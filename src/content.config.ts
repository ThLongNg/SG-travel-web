// Content schema — FROZEN after phase 0 (owner: Lead). Change requests → docs/change-requests/.
// Astro 7 requires this path (src/content/config.ts is a hard error since Astro 6).
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
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
// Spots belong to an area via spot.area === area.region (and optionally spot.city).

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
    ]),
    order: z.number().int().default(0),
    summary: z.string().min(1),
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

export const collections = { spots, areas, courses, guides, phrases };
