// Display helpers shared by spot / area / course components (owner: Agent A).
import { getCollection, type CollectionEntry } from 'astro:content';
import { t, type I18nKey, type Locale } from '../../lib/i18n';

export type Spot = CollectionEntry<'spots'>;
export type Area = CollectionEntry<'areas'>;
export type Course = CollectionEntry<'courses'>;
export type Region = Spot['data']['area'];
export type Theme = Spot['data']['themes'][number];

export const regions: readonly Region[] = ['north', 'central', 'south'];
export const allThemes: readonly Theme[] = [
  'hiking',
  'beach',
  'food',
  'heritage',
  'nature',
  'shopping',
  'walk',
  'history',
  'nightview',
  'market',
];

export const regionLabel = (lang: Locale, r: Region) => t(lang, `areas.${r}`);
export const themeLabel = (lang: Locale, th: Theme) => t(lang, `themes.${th}`);
export const monthLabel = (lang: Locale, m: number) => t(lang, `months.${m}` as I18nKey);

/** "南部 · ホーチミン" */
export const spotEyebrow = (lang: Locale, s: Spot) =>
  `${regionLabel(lang, s.data.area)} · ${s.data.city}`;

/** [12,1,2,3,4] → "12月〜4月"; [3,4,9,10] → "3月〜4月、9月〜10月" (wraps around the year). */
export function seasonText(lang: Locale, months: number[]): string {
  const set = new Set(months);
  if (set.size === 12) return `${monthLabel(lang, 1)}〜${monthLabel(lang, 12)}`;
  const ranges: [number, number][] = [];
  // Start each range at a month whose predecessor is not in the set (circular).
  for (let m = 1; m <= 12; m++) {
    const prev = m === 1 ? 12 : m - 1;
    if (!set.has(m) || set.has(prev)) continue;
    let end = m;
    while (set.has(end === 12 ? 1 : end + 1)) end = end === 12 ? 1 : end + 1;
    ranges.push([m, end]);
  }
  return ranges
    .map(([a, b]) =>
      a === b ? monthLabel(lang, a) : `${monthLabel(lang, a)}〜${monthLabel(lang, b)}`,
    )
    .join('、');
}

export function triState(lang: Locale, v: boolean | 'unknown'): string {
  return v === 'unknown' ? t(lang, 'common.unknown') : t(lang, v ? 'common.yes' : 'common.no');
}

/** Spots sorted for display: real content before fixtures, then by Japanese name. */
export async function getSortedSpots(): Promise<Spot[]> {
  const spots = await getCollection('spots');
  return spots.sort(
    (a, b) =>
      Number(a.data.fixture) - Number(b.data.fixture) ||
      a.data.nameJa.localeCompare(b.data.nameJa, 'ja'),
  );
}

export async function getSortedAreas(): Promise<Area[]> {
  const areas = await getCollection('areas');
  return areas.sort(
    (a, b) =>
      regions.indexOf(b.data.region) - regions.indexOf(a.data.region) ||
      a.data.order - b.data.order,
  );
}

export async function getSortedCourses(): Promise<Course[]> {
  const courses = await getCollection('courses');
  return courses.sort(
    // trip order: a course starting on day 1 comes before the day-3 options
    (a, b) =>
      Number(a.data.fixture) - Number(b.data.fixture) ||
      a.data.schedule[0].day - b.data.schedule[0].day ||
      a.data.days - b.data.days,
  );
}

/** Google Maps universal link (opens the app when installed). iOS swaps to Apple Maps in JS. */
export function mapLinks(name: string, lat: number, lng: number) {
  const q = encodeURIComponent(name);
  return {
    google: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
    apple: `https://maps.apple.com/?q=${q}&ll=${lat},${lng}`,
    embed: `https://maps.google.com/maps?q=${lat},${lng}&z=16&hl=ja&output=embed`,
  };
}

/** "N nights M days" label (courses.nights), or courses.dayTrip when nights = 0. */
export function courseLength(lang: Locale, d: { nights: number; days: number }): string {
  return d.nights === 0
    ? t(lang, 'courses.dayTrip')
    : t(lang, 'courses.nights', { n: d.nights, m: d.days });
}
