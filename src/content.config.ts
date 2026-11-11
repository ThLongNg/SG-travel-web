// Content schema — FROZEN after phase 0 (owner: Lead). Change requests → docs/change-requests/.
// Astro 7 requires this path (src/content/config.ts is a hard error since Astro 6).
import { defineCollection } from 'astro:content';
import { file, glob } from 'astro/loaders';
import { z } from 'astro/zod';

const area = z.enum(['north', 'central', 'south']);
const theme = z.enum([
  'beach',
  'food',
  'heritage',
  'nature',
  'shopping',
  'walk',
  'history',
  'nightview',
  'market',
  'hiking',
]);
const month = z.number().int().min(1).max(12);
const triState = z.union([z.boolean(), z.literal('unknown')]);
const source = z.object({ title: z.string().min(1), url: z.url() });
const sources = z.array(source).min(1);
/** true = dummy data created in phase 0; check:content fails while any remain */
const fixture = z.boolean().default(false);

const spots = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/spots' }),
  schema: ({ image }) =>
    z.object({
      slug: z.string().regex(/^[a-z0-9-]+$/),
      nameJa: z.string().min(1), // katakana
      nameVi: z.string().min(1), // Vietnamese with diacritics
      reading: z.string().min(1), // how to read nameVi, in katakana
      area,
      /** id in the `areas` collection; finer than `area` (several areas share one region) */
      areaSlug: z.string().optional(),
      city: z.string().min(1),
      themes: z.array(theme).min(1),
      bestSeasons: z.array(month).min(1),
      summary: z.string().min(1), // どんな場所？ 2–3 sentences
      heroImage: image(),
      heroAlt: z.string().min(1),
      gallery: z.array(z.object({ src: image(), alt: z.string().min(1) })).default([]),
      info: z.object({
        hours: z.string().min(1), // e.g. "8:00〜18:00" or "TODO: 要確認"
        priceVnd: z.number().int().nonnegative().nullable(), // null = unknown
        priceNote: z.string().optional(),
        durationMinutes: z.number().int().positive(),
        access: z.string().min(1),
        toilet: triState,
        cardPayment: triState,
        wifi: triState,
      }),
      coordinates: z.object({
        lat: z.number().min(-90).max(90),
        lng: z.number().min(-180).max(180),
      }),
      highlights: z.array(z.string()).default([]), // 見どころ (short bullets; long text goes in the body)
      tipsForJapanese: z.array(z.string()).min(1),
      cautions: z.array(z.string()).min(1),
      nearby: z.array(z.string()).default([]), // spot slugs
      sources,
      lastVerified: z.coerce.date(),
      verified: z.boolean(),
      fixture,
    }),
});
// Markdown body of a spot = 楽しみ方 (how to enjoy), rendered with <Content />.

const areas = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/areas' }),
  schema: ({ image }) =>
    z.object({
      slug: z.string().regex(/^[a-z0-9-]+$/),
      nameJa: z.string().min(1),
      nameVi: z.string().min(1),
      region: area, // north / central / south
      order: z.number().int().default(0),
      summary: z.string().min(1),
      heroImage: image(),
      heroAlt: z.string().min(1),
      /** 12 entries, Jan → Dec */
      climate: z
        .array(
          z.object({
            month,
            highC: z.number().nullable(),
            lowC: z.number().nullable(),
            rainMm: z.number().nullable(),
            season: z.enum(['dry', 'rainy']),
          }),
        )
        .length(12),
      transport: z.array(z.string()).min(1),
      sources,
      lastVerified: z.coerce.date(),
      verified: z.boolean(),
      fixture,
    }),
});
// Spots belong to an area via spot.areaSlug === area.id; spots without areaSlug fall back to
// spot.area === area.region.

const courses = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/courses' }),
  schema: ({ image }) =>
    z.object({
      slug: z.string().regex(/^[a-z0-9-]+$/),
      title: z.string().min(1), // e.g. 「2泊3日 ホーチミン満喫」
      nights: z.number().int().nonnegative(),
      days: z.number().int().positive(),
      summary: z.string().min(1),
      heroImage: image(),
      heroAlt: z.string().min(1),
      themes: z.array(theme).default([]),
      estimatedCostJpy: z.object({ min: z.number(), max: z.number(), note: z.string().optional() }),
      schedule: z
        .array(
          z.object({
            day: z.number().int().positive(),
            title: z.string().optional(),
            items: z
              .array(
                z.object({
                  time: z.string().regex(/^\d{1,2}:\d{2}$/), // 24h
                  title: z.string().min(1),
                  spot: z.string().optional(), // spot slug
                  note: z.string().optional(),
                  moveMinutes: z.number().int().nonnegative().optional(), // travel time to next item
                  moveBy: z.string().optional(), // e.g. "Grab", "徒歩"
                  costVnd: z.number().int().nonnegative().optional(),
                }),
              )
              .min(1),
          }),
        )
        .min(1),
      sources,
      lastVerified: z.coerce.date(),
      verified: z.boolean(),
      fixture,
    }),
});

const guides = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/guides' }),
  schema: z.object({
    slug: z.string().regex(/^[a-z0-9-]+$/),
    title: z.string().min(1),
    category: z.enum([
      'visa',
      'money',
      'sim',
      'grab',
      'tip',
      'safety',
      'hygiene',
      'power',
      'weather',
      'manners',
      'payment',
      'food',
      'shopping',
    ]),
    order: z.number().int().default(0),
    /** one-line lead under the card title */
    summary: z.string().min(1),
    /** the card body: 1–5 short points (keep each to one line on a phone) */
    points: z.array(z.string().min(1)).min(1).max(5),
    /** render points as numbered steps (how-to cards) */
    ordered: z.boolean().default(false),
    /** call-to-action buttons (e.g. buy an eSIM, official site) */
    links: z.array(z.object({ label: z.string().min(1), url: z.url() })).default([]),
    sources,
    lastVerified: z.coerce.date(),
    verified: z.boolean(),
    fixture,
  }),
});

const phrases = defineCollection({
  loader: glob({ pattern: '**/*.{yml,yaml}', base: './src/content/phrases' }),
  schema: z.object({
    slug: z.string().regex(/^[a-z0-9-]+$/),
    titleJa: z.string().min(1), // e.g. あいさつ
    order: z.number().int().default(0),
    phrases: z
      .array(
        z.object({
          id: z.string().regex(/^[a-z0-9-]+$/),
          ja: z.string().min(1),
          vi: z.string().min(1), // with diacritics; spoken by speechSynthesis vi-VN
          kana: z.string().min(1), // katakana, Southern accent
          note: z.string().optional(),
        }),
      )
      .min(1),
    verified: z.boolean(),
    fixture,
  }),
});

/** One line of "what to say" in a shop or eatery (shown with a speak button and 見せる). */
const phrase = z.object({
  vi: z.string().min(1),
  kana: z.string().min(1), // Southern accent
  ja: z.string().min(1),
});

/** A recommended shop for a dish (MICHELIN Guide / Vietnamese review sites). */
const shop = z.object({
  name: z.string().min(1), // as on the sign
  area: z.string().min(1), // where it is, for a Japanese reader
  address: z.string().min(1), // Vietnamese, shown to drivers (住所を見せる)
  hours: z.string().min(1), // may be 'TODO: 要確認…'
  note: z.string().min(1),
  michelin: z.enum(['bib']).optional(),
  source: z.url(),
});

/** /eat/ — must-try dishes with a photo (src/assets/eat/<id>.webp) and recommended shops. */
const dishes = defineCollection({
  loader: file('./src/data/eat/dishes.yml'),
  schema: z.object({
    id: z.string().regex(/^[a-z0-9-]+$/),
    order: z.number().int(),
    nameVi: z.string().min(1), // as written on shop signs, e.g. "Phở"
    nameJa: z.string().min(1),
    category: z.enum(['main', 'snack', 'sweet', 'drink']),
    when: z.string().optional(), // e.g. 朝ごはんに
    imageAlt: z.string().min(1),
    priceVnd: z.object({ min: z.number().int().positive(), max: z.number().int().positive() }),
    desc: z.string().min(1),
    tip: z.string().optional(),
    phrases: z.array(phrase).min(1),
    shops: z.array(shop).default([]),
    sources,
    verified: z.boolean(),
  }),
});

/** /eat/ — souvenirs: what to buy, for whom, and where (types of shops, not specific stores). */
const souvenirs = defineCollection({
  loader: file('./src/data/eat/souvenirs.yml'),
  schema: z.object({
    id: z.string().regex(/^[a-z0-9-]+$/),
    order: z.number().int(),
    nameJa: z.string().min(1),
    nameVi: z.string().min(1), // shown to the shop staff (見せる)
    kana: z.string().min(1),
    category: z.enum(['food', 'beauty', 'craft', 'fashion']),
    priceVndFrom: z.number().int().positive(),
    forWhom: z.string().min(1), // e.g. 職場のバラマキに
    desc: z.string().min(1),
    where: z.string().min(1), // e.g. スーパー、ベンタイン市場
    sources,
    verified: z.boolean(),
  }),
});

export const collections = { spots, areas, courses, guides, phrases, dishes, souvenirs };
