// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// Production URL: set SITE_URL at build time (Vercel/Netlify env).
const site = process.env.SITE_URL ?? 'https://saigon-travel.example';

export default defineConfig({
  site,
  output: 'static',
  trailingSlash: 'ignore',
  i18n: {
    locales: ['ja', 'vi', 'en'],
    defaultLocale: 'ja',
    routing: { prefixDefaultLocale: false },
  },
  integrations: [
    mdx(),
    sitemap({
      filter: (page) => !page.includes('/dev/'),
      i18n: { defaultLocale: 'ja', locales: { ja: 'ja-JP', vi: 'vi-VN', en: 'en-US' } },
    }),
  ],
  vite: { plugins: [tailwindcss()] },
});
