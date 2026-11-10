# CONTRACT — Hợp đồng dùng chung (đóng băng sau pha 0)

> Tạo ở pha 0 (tag `foundation`). Trong pha 1, mọi thứ ở đây **chỉ đọc**. Cần thay đổi → ghi vào `docs/change-requests/agent-X.md`.
> Đọc kèm `docs/SPEC.md` và `docs/PLAN.md` (bảng sở hữu file).

## 0. Môi trường và lệnh

- Astro **7.4** (static), TypeScript strict, Tailwind **v4** (token trong CSS `@theme`, không có `tailwind.config`), MDX, sitemap. Zod **v4** (`import { z } from 'astro/zod'`).
- Font: Fontsource (`Inter Variable`, `Noto Sans JP Variable`, `Noto Serif JP` 700). Tự subset theo `unicode-range`.
- Lệnh: `npm run dev` · `build` (= `astro check && astro build`, phải 0 lỗi / 0 cảnh báo) · `preview` · `lint` (eslint + prettier --check) · `format` · `test:e2e` (Playwright) · `lhci` · `check:content`.
- Thư viện có sẵn cho pha 1: `@playwright/test` (đã cài trình duyệt Chromium + WebKit), `@lhci/cli`, `sharp` (đi kèm Astro). **Không có** Leaflet và thư viện PWA: bản đồ dùng Google Maps `<iframe loading="lazy">`, service worker tự viết (`public/sw.js`). Không có thư viện sinh ảnh OG → C dùng ảnh OG tĩnh.
- `SITE_URL` (biến môi trường lúc build) đặt domain thật; mặc định `https://saigon-travel.example`.

## 1. Route → agent phụ trách

Mọi trang nội dung nằm dưới `src/pages/[...lang]/` và dùng helper `localeParams()`; một file sinh ra cả 3 ngôn ngữ (`/x/`, `/vi/x/`, `/en/x/`).

| URL                             | File                                                                  | Agent |
| ------------------------------- | --------------------------------------------------------------------- | ----- |
| `/`                             | `[...lang]/index.astro`                                               | A     |
| `/spots/`                       | `[...lang]/spots/index.astro`                                         | A     |
| `/spots/[slug]/`                | `[...lang]/spots/[slug].astro`                                        | A     |
| `/areas/[area]/`                | `[...lang]/areas/[area].astro` (`area` = id trong collection `areas`) | A     |
| `/courses/`, `/courses/[slug]/` | `[...lang]/courses/…`                                                 | A     |
| `/about/`                       | `[...lang]/about.astro`                                               | A     |
| 404                             | `404.astro` (một file, tiếng Nhật)                                    | A     |
| `/phrases/`                     | `[...lang]/phrases/index.astro`                                       | C     |
| `/guide/`                       | `[...lang]/guide/index.astro`                                         | C     |
| `/contact/`, `/privacy/`        | `[...lang]/contact.astro`, `[...lang]/privacy.astro`                  | C     |
| `/dev/glass/`                   | `dev/glass.astro` (noindex, không vào sitemap)                        | Lead  |

Mẫu cho trang động (giữ đúng mẫu này):

```astro
export const getStaticPaths = (async () => {
  const spots = await getCollection('spots');
  return localeParams().flatMap(({ params }) =>
    spots.map((spot) => ({ params: { ...params, slug: spot.id }, props: { spot } })),
  );
}) satisfies GetStaticPaths;
const lang = getLocale(Astro.params.lang);
```

## 2. Schema nội dung (`src/content.config.ts`)

Id của mỗi entry = trường `slug` (glob loader dùng `slug` làm id) = tên file. Mọi collection có `fixture: boolean` (mặc định `false`). Mọi collection trừ `phrases` có `sources` (≥ 1, `{ title, url }`), `lastVerified` (date) và `verified`.

- **spots** (`src/content/spots/*.md|mdx`): `slug, nameJa, nameVi, reading, area ('north'|'central'|'south'), city, themes[], bestSeasons (1–12)[], summary, heroImage (image), heroAlt, gallery {src: image, alt}[], info {hours, priceVnd (number|null), priceNote?, durationMinutes, access, toilet, cardPayment, wifi (boolean|'unknown')}, coordinates {lat,lng}, highlights[], tipsForJapanese[] (≥1), cautions[] (≥1), nearby (slug)[]`. **Phần thân Markdown = 楽しみ方.**
- **areas** (`src/content/areas/*.md`): `slug, nameJa, nameVi, region (area), order, summary, heroImage, heroAlt, climate[12] {month, highC, lowC, rainMm (number|null), season 'dry'|'rainy'}, transport[]`. Thân = mô tả tổng quan. Spot thuộc area khi `spot.area === area.region` (có thể lọc thêm theo `city`).
- **courses** (`src/content/courses/*.md`): `slug, title, nights, days, summary, heroImage, heroAlt, themes[], estimatedCostJpy {min,max,note?}, schedule[] {day, title?, items[] {time 'HH:MM', title, spot? (slug), note?, moveMinutes?, moveBy?, costVnd?}}`.
- **guides** (`src/content/guides/*.md`): `slug, title, category ('visa'|'money'|'sim'|'grab'|'tip'|'safety'|'hygiene'|'power'|'weather'|'manners'), order, summary`. Thân = nội dung.
- **phrases** (`src/content/phrases/*.yml`): mỗi file một nhóm: `slug, titleJa, order, verified, fixture, phrases[] {id, ja, vi, kana, note?}`.
- Chủ đề (`themes`): `beach, food, heritage, nature, shopping, walk, history, nightview, market` → nhãn ở `t(lang, 'themes.<key>')`.
- Ảnh nội dung: `src/assets/content/<slug>*.webp`, đường dẫn tương đối trong frontmatter (`../../assets/content/…`).

**Fixture**: 2 bản ghi mỗi collection, tên `fixture-*`, `fixture: true`, nội dung "ダミー". B xóa toàn bộ khi viết nội dung thật.

## 3. Helper dùng chung (`src/lib/`)

- `i18n.ts`: `locales`, `type Locale`, `type I18nKey`, `t(lang, key, vars?)` (thay `{name}`; thiếu key ở vi/en → rơi về ja), `getLocale(param)`, `localeParams()`, `localizePath(path, lang)`, `unlocalizePath(pathname)`.
- `format.ts`: `formatJaDate(d)` → `2026年11月11日`, `formatVnd`, `vndToJpy`, `formatPrice(vnd)` → `150,000ドン（約900円）` (0 → 無料), `formatDuration(min)` → `1時間30分`, `normalizeKana(s)` (NFKC + hiragana→katakana, dùng cho tìm kiếm).
- `media.ts`: `heroMedia` = đường dẫn cố định của poster / nền mờ / video (xem mục 6).
- `src/components/tools/rate.config.ts` (**chủ: C**, Lead tạo stub): `export const rate = { jpyPerVnd, asOf: 'YYYY-MM-DD', source }`. Giữ nguyên tên export; `format.ts` import file này.

## 4. Component kính (`src/components/glass/`) — props

CSS dùng chung: `src/styles/glass.css` (`.glass`, `.glass--strong`, `.glass--light`, `.glass--refract`, `.glass-radius`, `.glass-pill`, `.glass-press`, `.touch-target`). Token: `src/styles/global.css` (`bg-night`, `text-ink`, `text-ink-muted`, `bg-amber`, `text-amber`, `text-river`, `font-display`, `.section-no`, `.vertical-title`, `.tile-pattern`, `.tile-divider`, `.sr-only`).

| Component     | Props                                                                                                                                                                                                                                                   |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GlassPanel`  | `as?: 'div'\|'section'\|'article'\|'aside'\|'header'\|'footer'\|'li'` · `variant?: 'default'\|'strong'\|'light'` · `padding?: 'none'\|'sm'\|'md'\|'lg'` · `refract?: boolean` · mọi thuộc tính HTML khác. Slot mặc định                                 |
| `GlassButton` | `href?` (có → `<a>`, không → `<button type>`) · `variant?: 'glass'\|'accent'` · `size?: 'md'\|'lg'` · `icon?: IconName` · `iconOnly?: boolean` (bắt buộc kèm `label`) · `label?` (aria-label) · `class?` · thuộc tính HTML khác (vd. `data-sheet-open`) |
| `GlassChip`   | `href?` · `selected?: boolean` (`aria-pressed` cho button, `aria-current` cho link) · `variant?: 'default'\|'light'` · `class?` · thuộc tính HTML khác                                                                                                  |
| `GlassSearch` | `label`, `placeholder`, `submitLabel` (bắt buộc) · `action?` (có → form GET; không → chặn submit, tự nghe sự kiện `input`) · `name?='q'` · `value?` · `id?` · `class?`                                                                                  |
| `GlassTabBar` | `items: {href,label,icon}[]` · `active: number` (-1 = không có) · `label` (aria-label). **Đã gắn sẵn trong BaseLayout** — trang không tự render                                                                                                         |
| `GlassSheet`  | `id`, `title`, `closeLabel` · `class?` · slot mặc định + slot `footer`. `<dialog>` gốc. Mở: phần tử bất kỳ có `data-sheet-open="<id>"` hoặc `el.showModal()`; đóng: `data-sheet-close`, chạm nền, vuốt xuống, Esc                                       |
| `Icon`        | `name: IconName` · `size?=22` · `label?` (không có → `aria-hidden`) · `class?`. Danh sách tên: xem `paths` trong `Icon.astro`                                                                                                                           |

Quy tắc: ≤ ~6 phần tử kính có blur trên một màn hình (header + tab bar đã chiếm 2). Danh sách dài dùng `variant="light"`. Đoạn văn dài dùng `variant="strong"`.

## 5. Layout (`src/layouts/BaseLayout.astro`) — props

`title` (bắt buộc; tự thêm `｜サイゴン・トラベル`) · `description?` · `lang: Locale` · `activeTab?: 'home'|'spots'|'courses'|'phrases'|'guide'` · `transparentHeader?` (header trong suốt trên hero) · `preloadPoster?` (preload poster cho LCP, trang chủ) · `image?` · `jsonLd?: Record<string, unknown>[]` · `breadcrumbs?: {name, href}[]` · `noindex?`. Slot mặc định → `<main id="main">`; slot `head` → thêm thẻ vào `<head>`.

Layout đã lo: `<html lang>`, viewport-fit=cover, theme-color, nền poster mờ cố định, header kính (tự ẩn khi cuộn xuống, chọn ngôn ngữ), footer gạch bông, tab bar kính, skip link, filter SVG khúc xạ. Nó gọi sẵn `<SEO>` và `<RegisterSW>`. Khi `transparentHeader` = false, `<main>` có sẵn padding-top cho header.

## 6. Stub (giữ nguyên props, chủ sở hữu viết lại phần ruột)

| File                                   | Chủ   | Props                                                                                                                                      |
| -------------------------------------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/components/media/VideoHero.astro` | A     | `lang: Locale` · `height?: 'full'\|'short'` · `class?` · slot mặc định = lớp phủ (tiêu đề, ô tìm kiếm…)                                    |
| `src/components/seo/SEO.astro`         | C     | `title, description, lang` · `image?` · `jsonLd?` · `breadcrumbs?: Breadcrumb[]` (export `interface Breadcrumb {name, href}`) · `noindex?` |
| `src/components/pwa/RegisterSW.astro`  | C     | không có props (manifest link, apple-touch-icon, đăng ký SW)                                                                               |
| Các trang ở mục 1                      | A / C | — dùng `StubPage` tạm, thay hoàn toàn                                                                                                      |

**Media cố định** (`src/lib/media.ts`, file thuộc B ở `public/media/`): `hero-saigon-poster.webp` (1920×1080), `hero-saigon-poster-portrait.webp` (720×1280), `hero-saigon-bg.webp` (nền mờ nhỏ), `hero-saigon-{mobile,desktop}.{mp4,webm}`. Hiện là placeholder tự sinh (đường chân trời vẽ SVG + Ken Burns 10 giây). Thay file thì giữ nguyên tên.

**Lưu ý video (đã kiểm chứng)**: WebKit (Playwright WebKit, có thể cả iOS Safari) báo `canPlayType('video/webm')` = "probably" nhưng **treo** với file VP9, làm sự kiện `load` của trang không bao giờ xảy ra. Luôn đặt **MP4 trước WebM** trong `<source>`, hoặc chỉ gắn WebM bằng JS cho trình duyệt không phải WebKit. Test Playwright với WebKit nên `waitUntil: 'domcontentloaded'` trên trang có video.

**Lưu ý kính**: WebKit không áp dụng `backdrop-filter` bên trong `<dialog>` (top layer) → `GlassSheet` dùng nền gần đục (0.97).

## 7. Key i18n (`src/i18n/ja.json`)

Nhóm key (xem file để biết từng key): `site.*` · `nav.*` · `common.*` · `media.*` · `themes.*` · `areas.*` · `months.1…12` · `home.*` · `spots.*` · `courses.*` · `guide.*` · `phrases.*` · `contact.*` · `about.*` · `privacy.*` · `notFound.*` · `footer.*` · `pwa.*`. Biến: `{count}`, `{n}`, `{m}`, `{name}`, `{date}`.

`vi.json`, `en.json` hiện là bản sao của ja (B dịch, **không thêm/bớt key**). `t()` kiểm tra key lúc biên dịch (`I18nKey`) — key sai sẽ làm `astro check` lỗi.
Nội dung (Content Collections) chỉ có tiếng Nhật; trang vi/en hiển thị nội dung tiếng Nhật kèm `common.untranslated`.

## 8. Hướng thiết kế (tóm tắt)

- Màu: nền `#0B1B2B` (night), nhấn chính `#F2A541` (amber, đèn đường), nhấn phụ `#2EC4B6` (river). Chữ `#F5F7FA` / `#C3CDD8`.
- Font: tiêu đề Noto Serif JP 700, thân Noto Sans JP, Latin/Việt Inter. Thân 16px, line-height 1.8.
- Kính: `rgba(255,255,255,.12)` + `blur(24px) saturate(180%)` + viền `rgba(255,255,255,.35)` + highlight inset + sheen chéo trái-trên; pill cho nút/chip, bo 26px cho panel. Nhấn → scale .97 (spring 200ms). Khúc xạ SVG chỉ bật trên Chromium (`html.is-chromium`).
- Chi tiết tạp chí: chữ dọc `.vertical-title`, số mục `.section-no` (01 / 02…), chữ "Sài Gòn" trang trí, họa tiết gạch bông.
- Bố cục trang chủ: hero video 100dvh (chữ dọc + "SÀI GÒN" + khẩu hiệu + `GlassSearch` + chip chủ đề cuộn ngang) → 01 人気の観光地 (thẻ vuốt ngang) → 02 エリア → 03 モデルコース → 04 旅の準備. Xem mẫu ở `/dev/glass`.
