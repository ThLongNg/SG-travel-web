// Client logic of the 翻訳 bubble (TranslateBubble.astro):
// text translation with a local cache, ★ saved phrases (work offline), voice input (Web Speech API)
// and menu photos read by POST /api/translate/ {mode:'menu'}.
import { phraseTools } from '../phrase/client';
import { vndToJpy } from '../../lib/format';

type Dir = 'ja-vi' | 'vi-ja';
interface Result {
  vi: string;
  kana: string;
  ja: string;
  note: string;
}
interface Saved {
  dir: Dir;
  input: string;
  r: Result;
}
interface MenuItem {
  vi: string;
  kana: string;
  ja: string;
  desc: string;
  priceVnd: number;
  pick: boolean;
}

const API = '/api/translate/'; // trailing slash: vercel.json has trailingSlash:true (a 308 hop otherwise)
const CACHE_KEY = 'tr-cache-v1';
const SAVED_KEY = 'tr-saved-v1';
const CACHE_MAX = 100;

// localStorage can be missing or throw (private mode, blocked storage): the bubble still works without it.
function load<T>(key: string, fallback: T): T {
  try {
    return (JSON.parse(localStorage.getItem(key) ?? 'null') as T) ?? fallback;
  } catch {
    return fallback;
  }
}
function store(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota or blocked: ignore */
  }
}

const cacheKey = (dir: Dir, text: string) => `${dir}|${text}`;
function cached(dir: Dir, text: string): Result | null {
  return load<Record<string, Result>>(CACHE_KEY, {})[cacheKey(dir, text)] ?? null;
}
function remember(dir: Dir, text: string, r: Result) {
  const all = load<Record<string, Result>>(CACHE_KEY, {});
  delete all[cacheKey(dir, text)];
  all[cacheKey(dir, text)] = r; // re-insert = newest last
  const keys = Object.keys(all);
  for (const k of keys.slice(0, Math.max(0, keys.length - CACHE_MAX))) delete all[k];
  store(CACHE_KEY, all);
}

/** Photo → JPEG ≤1600 px as base64 (keeps the request small; Safari also turns HEIC into JPEG here). */
async function shrink(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const s = Math.min(1, 1600 / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.naturalWidth * s);
    canvas.height = Math.round(img.naturalHeight * s);
    canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
  } finally {
    URL.revokeObjectURL(url);
  }
}

type SpeechCtor = new () => {
  lang: string;
  interimResults: boolean;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
};

export function initTranslate(sheet: HTMLElement) {
  const $ = <T extends HTMLElement>(s: string) => sheet.querySelector<T>(s)!;
  const form = $<HTMLFormElement>('[data-tr-form]');
  const input = $<HTMLTextAreaElement>('[data-tr-input]');
  const submit = $<HTMLButtonElement>('[data-tr-submit]');
  const submitLabel = $('[data-tr-submit-label]');
  const errorBox = $('[data-tr-error]');
  const result = $('[data-tr-result]');
  const saveBtn = $<HTMLButtonElement>('[data-tr-save]');
  const mic = $<HTMLButtonElement>('[data-tr-mic]');
  const camera = $<HTMLInputElement>('[data-tr-camera]');
  const cameraLabel = $('[data-tr-camera-label]');
  const menu = $('[data-tr-menu]');
  const menuList = $('[data-tr-menu-list]');
  const savedWrap = $('[data-tr-saved]');
  const savedList = $('[data-tr-saved-list]');
  const itemTpl = $<HTMLTemplateElement>('[data-tr-menu-item]');
  const savedTpl = $<HTMLTemplateElement>('[data-tr-saved-item]');
  const dirButtons = [...sheet.querySelectorAll<HTMLButtonElement>('[data-tr-dir]')];
  const msg = JSON.parse(
    document.querySelector<HTMLElement>('[data-tr-messages]')?.textContent ?? '{}',
  ) as Record<string, string>;
  const tools = phraseTools();

  let dir: Dir = 'ja-vi';
  let current: Saved | null = null;

  const setDir = (d: Dir) => {
    dir = d;
    for (const b of dirButtons) b.setAttribute('aria-pressed', String(b.dataset.trDir === d));
    input.placeholder = input.dataset[d === 'ja-vi' ? 'phJaVi' : 'phViJa'] ?? '';
    input.lang = d === 'ja-vi' ? 'ja' : 'vi';
  };
  for (const b of dirButtons) b.addEventListener('click', () => setDir(b.dataset.trDir as Dir));

  const showError = (key: string) => {
    errorBox.textContent = msg[key] ?? msg.failed;
    errorBox.hidden = false;
  };
  const busy = (on: boolean, label = submit.dataset.busy ?? '') => {
    submit.disabled = on;
    camera.disabled = on;
    submitLabel.textContent = on ? label : (submit.dataset.label ?? '');
  };

  // ───── ★ saved phrases ─────
  const savedAll = () => load<Saved[]>(SAVED_KEY, []);
  const isSaved = (s: Saved) => savedAll().some((x) => x.dir === s.dir && x.input === s.input);
  const renderSaved = () => {
    const all = savedAll();
    savedWrap.hidden = all.length === 0;
    savedList.replaceChildren(
      ...all.map((s, i) => {
        const li = savedTpl.content.firstElementChild!.cloneNode(true) as HTMLElement;
        li.querySelector('[data-s-main]')!.textContent = s.dir === 'ja-vi' ? s.r.vi : s.r.ja;
        li.querySelector('[data-s-sub]')!.textContent = s.input;
        li.querySelector<HTMLElement>('[data-s-open]')!.addEventListener('click', () => {
          setDir(s.dir);
          input.value = s.input;
          render(s);
          result.scrollIntoView({ block: 'nearest' });
        });
        li.querySelector<HTMLElement>('[data-s-remove]')!.addEventListener('click', () => {
          store(
            SAVED_KEY,
            savedAll().filter((_, j) => j !== i),
          );
          renderSaved();
          if (current) saveBtn.setAttribute('aria-pressed', String(isSaved(current)));
        });
        return li;
      }),
    );
  };
  saveBtn.addEventListener('click', () => {
    if (!current) return;
    const others = savedAll().filter(
      (x) => !(x.dir === current!.dir && x.input === current!.input),
    );
    store(SAVED_KEY, isSaved(current) ? others : [current, ...others]);
    saveBtn.setAttribute('aria-pressed', String(isSaved(current)));
    renderSaved();
  });

  // ───── text result ─────
  const render = (s: Saved) => {
    current = s;
    menu.hidden = true;
    const { r } = s;
    $('[data-tr-vi]').textContent = r.vi;
    $('[data-tr-kana]').textContent = r.kana;
    const jaBig = $('[data-tr-ja-big]');
    jaBig.textContent = r.ja;
    jaBig.hidden = s.dir === 'ja-vi';
    $('[data-tr-back]').textContent = r.ja;
    $('[data-tr-back-wrap]').hidden = s.dir === 'vi-ja';
    // vi→ja: the Japanese is what she reads, so it goes on top
    if (s.dir === 'vi-ja') result.prepend(jaBig);
    else result.append(jaBig);
    $('[data-tr-note]').textContent = r.note;
    $('[data-tr-note-wrap]').hidden = !r.note;
    $('[data-tr-show]').hidden = s.dir === 'vi-ja';
    saveBtn.setAttribute('aria-pressed', String(isSaved(s)));
    result.hidden = false;
  };

  const post = async (body: unknown, timeoutMs: number): Promise<Response> => {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      return await fetch(API, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
        signal: ctrl.signal,
      });
    } finally {
      clearTimeout(timer);
    }
  };
  const errorFor = (status: number) =>
    status === 503 || status === 404
      ? 'unavailable'
      : status === 429 || status === 502 // 502 = every Gemini model overloaded
        ? 'busy'
        : 'failed';

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = input.value.trim();
    errorBox.hidden = true;
    if (!text) return input.focus();
    // Same sentence again → from the cache: instant, offline, no API call.
    const hit = cached(dir, text);
    if (hit) return render({ dir, input: text, r: hit });
    if (!navigator.onLine) return showError('offline');

    const d = dir;
    busy(true);
    try {
      // up to 3 models server-side when Gemini is overloaded (~5–7 s each)
      const res = await post({ text, dir: d }, 40_000);
      if (!res.ok) return showError(errorFor(res.status));
      const r = (await res.json()) as Result;
      remember(d, text, r);
      render({ dir: d, input: text, r });
    } catch {
      showError(navigator.onLine ? 'failed' : 'offline');
    } finally {
      busy(false);
    }
  });

  // Enter sends on desktop keyboards; Shift+Enter keeps a newline. IME composition is respected.
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
      e.preventDefault();
      form.requestSubmit();
    }
  });

  $('[data-tr-show]').addEventListener('click', () => {
    if (current && tools) tools.show(current.input, current.r.vi, current.r.kana);
  });
  $('[data-tr-speak]').addEventListener('click', () => {
    if (current && tools) tools.speak(current.r.vi);
  });

  // ───── voice input ─────
  const w = window as unknown as {
    SpeechRecognition?: SpeechCtor;
    webkitSpeechRecognition?: SpeechCtor;
  };
  const Speech = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  mic.hidden = !Speech;
  let rec: InstanceType<SpeechCtor> | null = null;
  mic.addEventListener('click', () => {
    if (!Speech) return;
    if (rec) return rec.stop();
    errorBox.hidden = true;
    rec = new Speech();
    rec.lang = dir === 'vi-ja' ? 'vi-VN' : 'ja-JP';
    rec.interimResults = true;
    rec.onresult = (e) => {
      input.value = Array.from(e.results, (r) => r[0].transcript).join('');
    };
    rec.onerror = (e) => {
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') showError('micDenied');
    };
    rec.onend = () => {
      rec = null;
      mic.setAttribute('aria-pressed', 'false');
      if (input.value.trim()) form.requestSubmit(); // spoke → translate right away
    };
    mic.setAttribute('aria-pressed', 'true');
    rec.start();
  });

  // ───── menu photo ─────
  const renderMenu = (items: MenuItem[], tip: string) => {
    result.hidden = true;
    $('[data-tr-menu-tip]').textContent = tip;
    $('[data-tr-menu-tip]').hidden = !tip;
    menuList.replaceChildren(
      ...items.map((it) => {
        const li = itemTpl.content.firstElementChild!.cloneNode(true) as HTMLElement;
        li.querySelector('[data-m-ja]')!.textContent = it.ja;
        li.querySelector('[data-m-vi]')!.textContent = it.vi;
        li.querySelector('[data-m-kana]')!.textContent = it.kana;
        li.querySelector('[data-m-desc]')!.textContent = it.desc;
        const price = li.querySelector<HTMLElement>('[data-m-price]')!;
        price.hidden = !it.priceVnd;
        price.textContent = `${it.priceVnd.toLocaleString('ja-JP')}ドン（約${vndToJpy(it.priceVnd).toLocaleString('ja-JP')}円）`;
        li.querySelector<HTMLElement>('[data-m-pick]')!.hidden = !it.pick;
        li.querySelector<HTMLElement>('[data-m-order]')!.addEventListener('click', () => {
          const vi = `Cho em ${it.vi.toLocaleLowerCase('vi')} nha`;
          tools?.show(`${it.ja}をください`, vi, `チョー エム ${it.kana} ニャー`);
        });
        return li;
      }),
    );
    $('[data-tr-menu-empty]').hidden = items.length > 0;
    menu.hidden = false;
    menu.scrollIntoView({ block: 'nearest' });
  };

  camera.addEventListener('change', async () => {
    const file = camera.files?.[0];
    camera.value = ''; // the same photo can be picked again
    if (!file) return;
    errorBox.hidden = true;
    if (!navigator.onLine) return showError('offline');
    busy(true, cameraLabel.dataset.busy);
    try {
      const image = await shrink(file);
      const res = await post({ mode: 'menu', image, mime: 'image/jpeg' }, 60_000);
      if (!res.ok) return showError(res.status === 400 ? 'badImage' : errorFor(res.status));
      const data = (await res.json()) as { items: MenuItem[]; tip: string };
      renderMenu(data.items, data.tip);
    } catch {
      showError(navigator.onLine ? 'failed' : 'offline');
    } finally {
      busy(false);
    }
  });

  renderSaved();
}
