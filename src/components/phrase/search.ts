import { normalizeKana } from '../../lib/format';

/** Combining diacritical marks block (U+0300–U+036F): Vietnamese tone/vowel marks after NFD. */
const LATIN_MARKS = new RegExp(
  `[${String.fromCharCode(0x300)}-${String.fromCharCode(0x36f)}]`,
  'g',
);

/**
 * Search key used both at build time (data-search) and in the browser (query):
 * Vietnamese diacritics removed (xin chao = Xin chào), hiragana → katakana, NFKC, lower-case.
 * Only Latin combining marks are stripped so Japanese dakuten (U+3099) survive.
 */
export function searchKey(s: string): string {
  const latin = s.normalize('NFD').replace(LATIN_MARKS, '').replace(/[đĐ]/g, 'd');
  return normalizeKana(latin).replace(/\s+/g, ' ');
}
