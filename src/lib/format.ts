import { rate } from '../components/tools/rate.config';

/** 2026-11-11 → 2026年11月11日 */
export function formatJaDate(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  return `${date.getUTCFullYear()}年${date.getUTCMonth() + 1}月${date.getUTCDate()}日`;
}

/** 150000 → "150,000ドン" */
export function formatVnd(vnd: number): string {
  return `${vnd.toLocaleString('ja-JP')}ドン`;
}

/** VND → rounded JPY using src/components/tools/rate.config.ts (rounded to 10 yen above 1,000). */
export function vndToJpy(vnd: number): number {
  const y = vnd * rate.jpyPerVnd;
  return y >= 1000 ? Math.round(y / 10) * 10 : Math.round(y);
}

/** 150000 → "150,000ドン（約900円）"; 0 → "無料" */
export function formatPrice(vnd: number): string {
  if (vnd === 0) return '無料';
  return `${formatVnd(vnd)}（約${vndToJpy(vnd).toLocaleString('ja-JP')}円）`;
}

/** 90 → "1時間30分" */
export function formatDuration(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return [h ? `${h}時間` : '', m ? `${m}分` : ''].join('') || '0分';
}

/** Hiragana → katakana so search matches either script. Also NFKC-normalizes (half-width kana etc.). */
export function normalizeKana(s: string): string {
  return s
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[ぁ-ゖ]/g, (c) => String.fromCharCode(c.charCodeAt(0) + 0x60));
}
