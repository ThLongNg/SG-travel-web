// Vercel Function: POST /api/translate — natural Saigon Vietnamese ⇄ Japanese with a katakana reading.
// Uses Google Gemini (Flash Lite) over REST. Needs GEMINI_API_KEY in the Vercel project's environment
// variables — never commit the key. Called by the 翻訳 bubble (src/components/translate/TranslateBubble.astro).

const MODEL = 'gemini-3.5-flash-lite';
const FALLBACK_MODEL = 'gemini-2.5-flash-lite';
const MAX_CHARS = 200;

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

const SYSTEM = `You translate for a young Japanese woman travelling alone in Ho Chi Minh City (Saigon).
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

Katakana reading ("kana") of the Vietnamese sentence, Southern pronunciation, one group per word separated by
spaces, no tone marks. Follow these examples exactly in style:
  Cho em một tô phở bò → チョー エム モッ トー フォー ボー
  Cám ơn chị nhiều nha → カム ウン チ ニウ ニャー
  Nhà vệ sinh ở đâu vậy ạ? → ニャー イェー シン オー ダウ ヤイ アー
  Anh chở em tới địa chỉ này nha → アン チョー エム トイ ディア チー ナイ ニャー
  Gọi công an giùm em với! → ゴイ コン アン ユム エム ヨイ
  Chị ơi, đừng bỏ ngò nha → チ オーイ、ドゥン ボー ンゴー ニャー
  Cổng chính chợ Bến Thành được không? → コン チン チョー ベン タン ドゥオック コン
Fixed readings: chị=チ, anh=アン, ơi=オーイ, đừng=ドゥン, được=ドゥオック, rồi=ロイ, không=コン, em=エム, nha=ニャー.
(Southern: v/d/gi → ヤ行, final -nh → ン, "ơn" → ウン, "ngọt" → ンゴッ, ch/tr → チャ行.)
No punctuation in "kana" except "、" where the Vietnamese has a comma.

"note": one short Japanese tip only when it really helps (e.g. "男性には chị を anh（アン）に"), otherwise "".`;

const TASK: Record<Dir, string> = {
  'ja-vi':
    'Translate this Japanese into natural spoken Saigon Vietnamese. Put the Vietnamese in "vi", its reading in "kana", and in "ja" a natural Japanese back-translation of your Vietnamese so she can check it.',
  'vi-ja':
    'Someone in Saigon wrote/said this in Vietnamese. Put the original (with diacritics fixed if they are missing) in "vi", its reading in "kana", and a natural Japanese translation in "ja".',
};

const SCHEMA = {
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

export class UpstreamError extends Error {
  status: number;
  constructor(status: number) {
    super(`gemini ${status}`);
    this.status = status;
  }
}

/** Translate; on a Gemini 5xx (overloaded) retry once on the previous Flash Lite. */
export async function translate(text: string, dir: Dir, key: string): Promise<TranslateResult> {
  try {
    return await callGemini(MODEL, text, dir, key);
  } catch (error) {
    if (!(error instanceof UpstreamError) || error.status < 500) throw error;
    return callGemini(FALLBACK_MODEL, text, dir, key);
  }
}

async function callGemini(
  model: string,
  text: string,
  dir: Dir,
  key: string,
): Promise<TranslateResult> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM }] },
        contents: [{ role: 'user', parts: [{ text: `${TASK[dir]}\n\n<text>${text}</text>` }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: SCHEMA,
          maxOutputTokens: 1024,
        },
      }),
    },
  );
  if (!res.ok) throw new UpstreamError(res.status);
  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const raw = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ?? '';
  const out = JSON.parse(raw) as Partial<TranslateResult>;
  if (!out.vi || !out.ja) throw new UpstreamError(422);
  return { vi: out.vi, kana: out.kana ?? '', ja: out.ja, note: out.note ?? '' };
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

async function readBody(request: Request): Promise<{ text: string; dir: string } | null> {
  try {
    const body = (await request.json()) as { text?: unknown; dir?: unknown };
    return {
      text: typeof body.text === 'string' ? body.text.trim() : '',
      dir: typeof body.dir === 'string' ? body.dir : '',
    };
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
  if (!body || !body.text || body.text.length > MAX_CHARS)
    return json({ error: 'bad-request' }, 400);
  if (body.dir !== 'ja-vi' && body.dir !== 'vi-ja') return json({ error: 'bad-request' }, 400);

  try {
    return json(await translate(body.text, body.dir, key));
  } catch (error) {
    if (error instanceof UpstreamError && error.status === 429) return json({ error: 'busy' }, 429);
    return json({ error: 'upstream' }, 502);
  }
}
