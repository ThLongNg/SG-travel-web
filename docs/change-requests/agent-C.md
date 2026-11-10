# Change requests — Agent C

## CR-C1 · i18n: thêm key cho chuỗi UI của C (Lead/Integrator — `src/i18n/*.json`)

Các chuỗi C cần nhưng chưa có trong `ja.json` đang nằm tạm trong `src/components/tools/extra-i18n.ts`
(hàm `xt(lang, key)`, có sẵn bản ja/vi/en, thiếu thì rơi về ja). Đề xuất:

- Thêm nguyên các key trong object `ja` của file đó vào `ja.json` (cùng tên: `phrases.all`, `phrases.count`,
  `phrases.groupsLabel`, `phrases.showModeHeading`, `phrases.wakeLockOn`, `phrases.swipeToClose`,
  `phrases.searchResults`, `guide.categories`, `guide.jumpTo`, `guide.cat.*` (10 mục), `guide.amount`,
  `guide.quick`, `guide.rateSource`, `contact.or`, `contact.requiredTag`, `contact.formTitle`,
  `contact.lineLead`, `contact.privacyNote` (biến `{link}`), `contact.errorSummary`, `offline.title`,
  `offline.lead`), bản vi/en lấy từ object `vi`/`en` cùng file (B có thể sửa lại văn phong).
- Sau đó thay `xt(` → `t(` và xóa `extra-i18n.ts` (với `guide.cat.${category}` cần cast `as I18nKey`).

## CR-C2 · `robots.txt` cần domain thật (Integrator)

`public/robots.txt` đang ghi `Sitemap: https://saigon-travel.example/sitemap-index.xml` vì file tĩnh không
đọc được `SITE_URL`. Hai cách:

1. Sửa tay domain khi biết domain thật, **hoặc**
2. Xóa `public/robots.txt` và thêm endpoint `src/pages/robots.txt.ts` (đường dẫn thuộc Lead):

```ts
import type { APIRoute } from 'astro';
export const GET: APIRoute = ({ site }) =>
  new Response(
    `User-agent: *\nAllow: /\nDisallow: /dev/\n\nSitemap: ${new URL('sitemap-index.xml', site)}\n`,
    { headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
  );
```

## CR-C3 · Bỏ screenshot khỏi git (Integrator — `.gitignore`)

Playwright ghi screenshot (JPEG) vào `tests/screenshots/<project>/*.jpg` mỗi lần chạy; CI upload chúng làm
artifact. Đề xuất thêm `tests/screenshots/` vào `.gitignore` (C **không commit** screenshot). Prettier không
bị ảnh hưởng (không parse `.jpg`), nên không cần sửa `.prettierignore`.

## CR-C4 · Script sinh ảnh OG/icon nên nằm ở `scripts/` (Integrator)

`src/components/seo/generate-images.mjs` (sinh `public/og/*.png` + `public/icons/*.png` bằng sharp) đặt tạm
trong thư mục của C vì `scripts/` chỉ cho phép C sở hữu `encode-video.*`. Đề xuất chuyển thành
`scripts/generate-images.mjs` (sửa `root` thành `new URL('../', import.meta.url)`) và thêm script
`"images": "node scripts/generate-images.mjs"` vào `package.json`.

## CR-C5 · Gửi Agent A

- `404.astro`: truyền `noindex` cho `BaseLayout` → SEO bỏ canonical/hreflang/breadcrumb cho trang 404.
- Trang spot **không cần** tự dựng JSON-LD `TouristAttraction`: `SEO.astro` tự sinh từ URL
  `/spots/<slug>/` (getEntry) và tự cắt ảnh hero 1200×630 làm OG image (cũng cho `/areas/*`, `/courses/*`).
  Nếu A vẫn truyền `jsonLd` có `@type: 'TouristAttraction'` hoặc `breadcrumbs`, SEO dùng bản của A và không
  sinh trùng.
- `VideoHero`: `tests/e2e/video.spec.ts` có 2 test đang `test.fixme` — kỳ vọng **không có request
  `.mp4/.webm`** khi `prefers-reduced-motion: reduce` hoặc `navigator.connection.saveData = true` (chỉ hiện
  poster). Sau khi gộp VideoHero thật, Integrator đổi `test.fixme(` → `test(`.

## CR-C6 · Biến môi trường (Integrator — README / Vercel)

- `PUBLIC_FORMSPREE_ID` — ID form Formspree (phần sau `https://formspree.io/f/`). Không đặt → form vẫn hiện,
  validate được, nhưng báo 「現在準備中です」 khi gửi.
- `PUBLIC_LINE_URL` — link LINE Official Account (vd. `https://lin.ee/xxxx`). Không đặt → nút xám + 「現在準備中です」.
- `SITE_URL` — như CONTRACT. CI đọc 3 biến này từ GitHub repository variables (`vars.*`).
