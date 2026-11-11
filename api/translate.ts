// Vercel Function: POST /api/translate — Gemini (Flash Lite) over REST. Two modes:
//   { text, dir: 'ja-vi' | 'vi-ja' }        → natural Saigon Vietnamese ⇄ Japanese + katakana reading
//   { mode: 'menu', image, mime }           → a menu / price board photo read into Japanese
// Needs GEMINI_API_KEY in the Vercel project's environment variables — never commit the key.
// Called by the 翻訳 bubble (src/components/translate/TranslateBubble.astro).

/** Tried in order; the next one is used when a model is overloaded (5xx) or retired (404).
 *  gemini-2.5-flash-lite was retired for new keys (404) — don't add it back. Last one is a bigger Flash. */
const MODELS = ['gemini-3.5-flash-lite', 'gemini-flash-lite-latest', 'gemini-3.5-flash'];
const MAX_CHARS = 200;
/** base64 length cap (~1.5 MB of JPEG); the client resizes photos to ~1600 px before sending. */
const MAX_IMAGE_B64 = 2_000_000;
const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export type Dir = 'ja-vi' | 'vi-ja';
export interface TranslateResult {
  /** the Vietnamese sentence (translation for ja→vi, the cleaned-up original for vi→ja) */
  vi: string;
  /** katakana reading of `vi`, Southern (Saigon) pronunciation, words separated by spaces */
  kana: string;
  /** natural Japanese: the meaning of `vi` (for ja→vi a back-translation she can check) */
  ja: string;
  /** optional one-line tip in Japanese; "" when none */
  note: string;
}
export interface MenuItem {
  vi: string;
  kana: string;
  ja: string;
  desc: string;
  /** price in VND, 0 when not readable */
  priceVnd: number;
  /** recommended for her (at most 3 per menu) */
  pick: boolean;
}
export interface MenuResult {
  items: MenuItem[];
  tip: string;
}

const STYLE = `You help a young Japanese woman travelling alone in Ho Chi Minh City (Saigon).
She talks to shop staff, street-food vendors, ride-hailing drivers and hotel staff.

Vietnamese you write must sound like what a polite young woman from Saigon would actually say out loud:
- Southern Vietnamese wording: "nha" (not "nhé"), "giùm", "coi" (= xem), "mắc" (= đắt), "quẹo", "ngò", "vậy", "dạ".
- Pronouns: she calls herself "em". Address the listener as "chị" by default (most vendors are women);
  use "anh" when the Japanese text is clearly talking to a man or a driver. Never use the textbook "tôi/bạn".
- Short, warm, spoken sentences with natural particles (ạ, nha, với, vậy). No word-by-word translation;
  keep the intent, drop Japanese politeness that Vietnamese wouldn't say.
- Saigon loanwords are fine where locals use them (menu, size, grab, bill).
- Prefer the shortest phrasing a local would really use. Start with "Dạ" only when answering someone.
  Examples: 辛くしないでください → "Không cay nha chị"; お会計お願いします → "Chị ơi, tính tiền giùm em";
  これください → "Cho em cái này nha"; 大丈夫です（断る） → "Dạ thôi, em không cần đâu".

Japanese you write: natural, polite spoken Japanese (です・ます), the way a Japanese person would say it.

Katakana reading ("kana") of Vietnamese, Southern pronunciation, one group per word separated by
spaces, no tone marks. Follow these examples exactly in style:
  Cho em một tô phở bò → チョー エム モッ トー フォー ボー
  Cám ơn chị nhiều nha → カム ウン チ ニウ ニャー
  Nhà vệ sinh ở đâu vậy ạ? → ニャー イェー シン オー ダウ ヤイ アー
  Anh chở em tới địa chỉ này nha → アン チョー エム トイ ディア チー ナイ ニャー
  Gọi công an giùm em với! → ゴイ コン アン ユム エム ヨイ
  Chị ơi, đừng bỏ ngò nha → チ オーイ、ドゥン ボー ンゴー ニャー
  Cổng chính chợ Bến Thành được không? → コン チン チョー ベン タン ドゥオック コン
Fixed readings: chị=チ, anh=アン, ơi=オーイ, đừng=ドゥン, được=ドゥオック, rồi=ロイ, không=コン, em=エム, nha=ニャー, túi=トゥイ.
(Southern: v/d/gi → ヤ行, final -nh → ン, "ơn" → ウン, "ngọt" → ンゴッ, ch/tr → チャ行.)
No punctuation in "kana" except "、" where the Vietnamese has a comma.`;

const TASK: Record<Dir, string> = {
  'ja-vi':
    'Translate this Japanese into natural spoken Saigon Vietnamese. Put the Vietnamese in "vi", its reading in "kana", and in "ja" a natural Japanese back-translation of your Vietnamese so she can check it. "note": one short Japanese tip only when it really helps (e.g. "男性には chị を anh（アン）に"), otherwise "".',
  'vi-ja':
    'Someone in Saigon wrote/said this in Vietnamese. Put the original (with diacritics fixed if they are missing) in "vi", its reading in "kana", and a natural Japanese translation in "ja". "note": one short Japanese tip only when it really helps, otherwise "".',
};

const MENU_TASK = `This photo is a menu, a price board or a shop sign in Saigon. Read every dish/drink you can see.
For each item:
- "vi": the name exactly as printed (fix missing diacritics), without the price.
- "kana": katakana reading of "vi".
- "ja": a natural Japanese name a Japanese person would understand, e.g. "牛肉のフォー", "砕き米ごはんと焼き豚（コムタム）".
- "desc": one short Japanese line: main ingredients and taste; say 辛い if it is spicy and mention unusual parts (内臓, 血のゼリー…) honestly.
- "priceVnd": the price in VND as an integer. Menus often write thousands short ("45", "45k", "45.000" all mean 45000). 0 if no price is readable.
- "pick": true for at most 3 items you would recommend to a Japanese woman on her first trip to Vietnam
  (classic, not too spicy, no unusual parts, good value); false otherwise.
"tip": one short Japanese line that helps her order from this menu (sizes, set meals, how prices are shown…), or "".
If the photo is not a menu or nothing is readable, return no items and explain in "tip" in Japanese.
At most 40 items, in the order they appear.`;

const TEXT_SCHEMA = {
  type: 'OBJECT',
  properties: {
    vi: { type: 'STRING' },
    kana: { type: 'STRING' },
    ja: { type: 'STRING' },
    note: { type: 'STRING' },
  },
  required: ['vi', 'kana', 'ja', 'note'],
  propertyOrdering: ['vi', 'kana', 'ja', 'note'],
};

const MENU_SCHEMA = {
  type: 'OBJECT',
  properties: {
    items: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          vi: { type: 'STRING' },
          kana: { type: 'STRING' },
          ja: { type: 'STRING' },
          desc: { type: 'STRING' },
          priceVnd: { type: 'INTEGER' },
          pick: { type: 'BOOLEAN' },
        },
        required: ['vi', 'kana', 'ja', 'desc', 'priceVnd', 'pick'],
        propertyOrdering: ['vi', 'kana', 'ja', 'desc', 'priceVnd', 'pick'],
      },
    },
    tip: { type: 'STRING' },
  },
  required: ['items', 'tip'],
  propertyOrdering: ['items', 'tip'],
};

export class UpstreamError extends Error {
  status: number;
  constructor(status: number) {
    super(`gemini ${status}`);
    this.status = status;
  }
}

type Part = { text: string } | { inlineData: { mimeType: string; data: string } };

/**
 * One structured Gemini call, "hedged": Gemini usually answers in 1–2 s but sometimes stalls for
 * 6–9 s or returns 503. If the current model hasn't answered after `hedgeMs`, the next model in
 * MODELS starts in parallel and the first good answer wins (the others are aborted). A model that
 * fails with overload / retired (404) / broken JSON hands over to the next one immediately.
 * Cost: an extra call only on slow requests.
 */
function gemini(
  parts: Part[],
  schema: object,
  maxOutputTokens: number,
  key: string,
  hedgeMs: number,
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const ctrls: AbortController[] = [];
    let next = 0;
    let running = 0;
    let done = false;
    let lastError: unknown = new UpstreamError(503);
    let timer: ReturnType<typeof setTimeout> | undefined;

    const finish = (fn: () => void) => {
      done = true;
      clearTimeout(timer);
      for (const c of ctrls) c.abort();
      fn();
    };
    const launch = () => {
      if (done || next >= MODELS.length) return;
      const model = MODELS[next++];
      const ctrl = new AbortController();
      ctrls.push(ctrl);
      running++;
      clearTimeout(timer);
      timer = setTimeout(launch, hedgeMs); // still waiting → hedge with the next model
      callGemini(model, parts, schema, maxOutputTokens, key, ctrl.signal).then(
        (out) => !done && finish(() => resolve(out)),
        (error: unknown) => {
          running--;
          if (done) return;
          lastError = error;
          const s = error instanceof UpstreamError ? error.status : 0;
          // 429: per-model quota (free tier limits each model separately) → another model may still have room
          if (!(s >= 500 || s === 404 || s === 422 || s === 429))
            return finish(() => reject(error));
          console.warn(`gemini ${model} → ${s || 'error'}, trying next model`);
          if (next < MODELS.length) launch();
          else if (running === 0) finish(() => reject(lastError));
        },
      );
    };
    launch();
  });
}

async function callGemini(
  model: string,
  parts: Part[],
  schema: object,
  maxOutputTokens: number,
  key: string,
  signal: AbortSignal,
): Promise<unknown> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: 'POST',
      signal,
      headers: { 'content-type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: STYLE }] },
        contents: [{ role: 'user', parts }],
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: schema,
          maxOutputTokens,
        },
      }),
    },
  );
  if (!res.ok) throw new UpstreamError(res.status);
  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const raw = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ?? '';
  try {
    return JSON.parse(raw);
  } catch {
    throw new UpstreamError(422); // cut off or not JSON
  }
}

/** Text translation. Exported so it can be tried locally with a real key. */
export async function translate(text: string, dir: Dir, key: string): Promise<TranslateResult> {
  const out = (await gemini(
    [{ text: `${TASK[dir]}\n\n<text>${text}</text>` }],
    TEXT_SCHEMA,
    1024,
    key,
    2500, // a normal answer takes 1–2 s
  )) as Partial<TranslateResult>;
  if (!out.vi || !out.ja) throw new UpstreamError(422);
  return { vi: out.vi, kana: out.kana ?? '', ja: out.ja, note: out.note ?? '' };
}

/** Menu photo → items in Japanese. Exported so it can be tried locally with a real key. */
export async function readMenu(image: string, mime: string, key: string): Promise<MenuResult> {
  const out = (await gemini(
    [{ inlineData: { mimeType: mime, data: image } }, { text: MENU_TASK }],
    MENU_SCHEMA,
    8192,
    key,
    9000, // a menu photo normally takes 4–6 s
  )) as Partial<MenuResult>;
  const items = (out.items ?? [])
    .filter((i) => i && i.vi && i.ja)
    .slice(0, 40)
    .map((i) => ({
      vi: String(i.vi),
      kana: String(i.kana ?? ''),
      ja: String(i.ja),
      desc: String(i.desc ?? ''),
      priceVnd: Number.isFinite(i.priceVnd) && i.priceVnd > 0 ? Math.round(i.priceVnd) : 0,
      pick: Boolean(i.pick),
    }));
  // keep the "at most 3" promise even if the model picks more
  let picks = 0;
  for (const i of items) if (i.pick && ++picks > 3) i.pick = false;
  return { items, tip: String(out.tip ?? '') };
}

// shortcut: in-memory per-instance rate limit (resets on cold start), upgrade to a KV store if abused.
const hits = new Map<string, number[]>();
function limited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 60_000);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > 20;
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });

type Body = { mode?: unknown; text?: unknown; dir?: unknown; image?: unknown; mime?: unknown };

async function readBody(request: Request): Promise<Body | null> {
  try {
    const body = (await request.json()) as Body;
    return body && typeof body === 'object' ? body : null;
  } catch {
    return null;
  }
}

export async function POST(request: Request): Promise<Response> {
  // Only this site may call the endpoint from a browser.
  const origin = request.headers.get('origin');
  if (origin && new URL(origin).host !== new URL(request.url).host) {
    return json({ error: 'origin' }, 403);
  }
  const key = process.env.GEMINI_API_KEY;
  if (!key) return json({ error: 'not-configured' }, 503);

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (limited(ip)) return json({ error: 'rate-limited' }, 429);

  const body = await readBody(request);
  if (!body) return json({ error: 'bad-request' }, 400);

  try {
    if (body.mode === 'menu') {
      const { image, mime } = body;
      if (typeof image !== 'string' || !image || image.length > MAX_IMAGE_B64) {
        return json({ error: 'bad-image' }, 400);
      }
      if (typeof mime !== 'string' || !IMAGE_TYPES.has(mime))
        return json({ error: 'bad-image' }, 400);
      return json(await readMenu(image, mime, key));
    }
    const text = typeof body.text === 'string' ? body.text.trim() : '';
    if (!text || text.length > MAX_CHARS) return json({ error: 'bad-request' }, 400);
    if (body.dir !== 'ja-vi' && body.dir !== 'vi-ja') return json({ error: 'bad-request' }, 400);
    return json(await translate(text, body.dir, key));
  } catch (error) {
    if (error instanceof UpstreamError && error.status === 429) return json({ error: 'busy' }, 429);
    return json({ error: 'upstream' }, 502);
  }
}
