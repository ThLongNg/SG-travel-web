import ja from '../i18n/ja.json';
import vi from '../i18n/vi.json';
import en from '../i18n/en.json';

export const locales = ['ja', 'vi', 'en'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'ja';

export const htmlLang: Record<Locale, string> = { ja: 'ja', vi: 'vi', en: 'en' };

type Dict = typeof ja;
type Leaves<T, P extends string = ''> = {
  [K in keyof T & string]: T[K] extends string ? `${P}${K}` : Leaves<T[K], `${P}${K}.`>;
}[keyof T & string];
/** Every valid i18n key, e.g. 'spots.basicInfo'. Keys are defined in src/i18n/ja.json. */
export type I18nKey = Leaves<Dict>;

const dicts: Record<Locale, unknown> = { ja, vi, en };

function lookup(dict: unknown, key: string): string | undefined {
  const v = key.split('.').reduce<unknown>((o, k) => (o as Record<string, unknown>)?.[k], dict);
  return typeof v === 'string' ? v : undefined;
}

/** Translate a key; falls back to Japanese. `{name}` placeholders are filled from `vars`. */
export function t(lang: Locale, key: I18nKey, vars: Record<string, string | number> = {}): string {
  const s = lookup(dicts[lang], key) ?? lookup(ja, key) ?? key;
  return s.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? `{${k}}`));
}

/** Locale from the `[...lang]` route param (undefined → ja). */
export function getLocale(param: string | undefined): Locale {
  return (locales as readonly string[]).includes(param ?? '') ? (param as Locale) : defaultLocale;
}

/** getStaticPaths helper for pages under src/pages/[...lang]/: one path per locale. */
export function localeParams() {
  return locales.map((l) => ({ params: { lang: l === defaultLocale ? undefined : l } }));
}

/** Prefix an absolute path with the locale: localizePath('/spots/', 'vi') → '/vi/spots/'. */
export function localizePath(path: string, lang: Locale): string {
  return lang === defaultLocale ? path : `/${lang}${path === '/' ? '/' : path}`;
}

/** Strip a locale prefix from a pathname: '/vi/spots/' → '/spots/'. */
export function unlocalizePath(pathname: string): string {
  return pathname.replace(/^\/(vi|en)(?=\/|$)/, '') || '/';
}
