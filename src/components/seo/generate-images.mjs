// Owner: Agent C. Generates the static OG images (public/og/*.png) and PWA icons (public/icons/*.png)
// with sharp (bundled with Astro). Output is committed; re-run after changing titles or the poster:
//
//   node src/components/seo/generate-images.mjs
//
// Text is rendered by librsvg with a system serif font (Yu Mincho / Hiragino Mincho / Noto Serif JP).
// Spot / area / course pages don't use these: SEO.astro crops their hero image to 1200×630.
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../../', import.meta.url));
const out = (p) => `${root}public/${p}`;
const SERIF = "'Noto Serif JP', 'Yu Mincho', 'YuMincho', 'Hiragino Mincho ProN', serif";
const SANS = "'Noto Sans JP', 'Yu Gothic', 'Hiragino Sans', 'Meiryo', sans-serif";
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

const pages = {
  default: {
    title: ['活気と夜景の街、', 'ホーチミンへ。'],
    sub: '日本人旅行者のためのベトナム観光ガイド',
  },
  spots: { title: ['観光地一覧'], sub: 'エリア・テーマ・季節から探す' },
  courses: { title: ['モデルコース'], sub: '移動時間と費用の目安つき' },
  phrases: { title: ['指さし会話帳'], sub: '見せるだけで伝わる、ベトナム語のひとこと。' },
  guide: { title: ['旅の準備・', 'お役立ち情報'], sub: 'ビザ・お金・SIM・Grab ／ ドン⇄円 換算' },
  about: { title: ['このサイトについて'], sub: '日本人旅行者のためのベトナム観光ガイド' },
  contact: { title: ['お問い合わせ'], sub: 'サイトの内容についてのご質問・ご指摘' },
};

function ogOverlay({ title, sub }) {
  const size = title.some((l) => l.length > 7) ? 76 : 92;
  const lines = title
    .map(
      (l, i) =>
        `<text x="96" y="${300 + i * (size * 1.3) - (title.length - 1) * size * 0.5}" font-family="${SERIF}" font-weight="700" font-size="${size}" fill="#F5F7FA">${esc(l)}</text>`,
    )
    .join('');
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <defs>
    <radialGradient id="a" cx="0.1" cy="0.15" r="0.6"><stop offset="0" stop-color="#F2A541" stop-opacity="0.45"/><stop offset="1" stop-color="#F2A541" stop-opacity="0"/></radialGradient>
    <radialGradient id="b" cx="0.95" cy="0.5" r="0.5"><stop offset="0" stop-color="#2EC4B6" stop-opacity="0.35"/><stop offset="1" stop-color="#2EC4B6" stop-opacity="0"/></radialGradient>
    <radialGradient id="c" cx="0.3" cy="1" r="0.6"><stop offset="0" stop-color="#6246C8" stop-opacity="0.45"/><stop offset="1" stop-color="#6246C8" stop-opacity="0"/></radialGradient>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0.2"/><stop offset="0.45" stop-color="#fff" stop-opacity="0.07"/><stop offset="1" stop-color="#fff" stop-opacity="0.1"/></linearGradient>
  </defs>
  <rect width="1200" height="630" fill="#060C1C" fill-opacity="0.45"/>
  <rect width="1200" height="630" fill="url(#a)"/><rect width="1200" height="630" fill="url(#b)"/><rect width="1200" height="630" fill="url(#c)"/>
  <rect x="48" y="48" width="1104" height="534" rx="36" fill="url(#g)" stroke="#fff" stroke-opacity="0.28" stroke-width="2"/>
  <text x="96" y="140" font-family="${SANS}" font-weight="700" font-size="26" letter-spacing="9" fill="#F2A541">SÀI GÒN · TRAVEL GUIDE</text>
  ${lines}
  <text x="96" y="470" font-family="${SANS}" font-size="32" fill="#CBD5E1">${esc(sub)}</text>
  <text x="96" y="540" font-family="${SERIF}" font-weight="700" font-size="30" fill="#F5F7FA">サイゴン・トラベル</text>
  <path d="M1040 520 l12 -12 l12 12 l-12 12z M1076 520 l12 -12 l12 12 l-12 12z" fill="none" stroke="#F2A541" stroke-opacity="0.6" stroke-width="2"/>
</svg>`);
}

async function og() {
  await mkdir(out('og'), { recursive: true });
  const base = await sharp(out('media/hero-saigon-poster.webp'))
    .resize(1200, 630, { fit: 'cover' })
    .blur(18)
    .modulate({ brightness: 0.75, saturation: 1.2 })
    .toBuffer();
  for (const [name, page] of Object.entries(pages)) {
    await sharp(base)
      .composite([{ input: ogOverlay(page) }])
      .png({ compressionLevel: 9, palette: true, quality: 90 })
      .toFile(out(`og/${name}.png`));
    console.log(`og/${name}.png`);
  }
}

function iconSvg(size, { maskable = false } = {}) {
  const r = size * (maskable ? 0.27 : 0.32);
  const c = size / 2;
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
  <defs><radialGradient id="a" cx="0.25" cy="0.2" r="0.9"><stop offset="0" stop-color="#2EC4B6" stop-opacity="0.35"/><stop offset="1" stop-color="#2EC4B6" stop-opacity="0"/></radialGradient></defs>
  <rect width="${size}" height="${size}" fill="#0B1B2B"/><rect width="${size}" height="${size}" fill="url(#a)"/>
  <circle cx="${c}" cy="${c}" r="${r * 1.18}" fill="#F2A541" fill-opacity="0.18"/>
  <circle cx="${c}" cy="${c}" r="${r}" fill="#F2A541"/>
  <text x="${c}" y="${c + r * 0.36}" text-anchor="middle" font-family="${SERIF}" font-weight="700" font-size="${r * 1.05}" fill="#0B1B2B">サ</text>
</svg>`);
}

async function icons() {
  await mkdir(out('icons'), { recursive: true });
  const jobs = [
    ['icon-192.png', 192, false],
    ['icon-512.png', 512, false],
    ['icon-maskable-512.png', 512, true],
    ['apple-touch-icon.png', 180, false],
  ];
  for (const [file, size, maskable] of jobs) {
    await sharp(iconSvg(size, { maskable }))
      .png({ compressionLevel: 9 })
      .toFile(out(`icons/${file}`));
    console.log(`icons/${file}`);
  }
}

await og();
await icons();
