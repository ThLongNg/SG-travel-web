# Status — Agent C (nhánh `agent-c/features`)

## Đã xong

**Trang** (bố cục theo `/dev/glass` + Figma; amber = hành động/đang chọn, teal = link/tag/icon):

- `/phrases/` — `src/components/phrase/{PhraseBook,PhraseCard,ShowMode}.astro`, `search.ts`.
  Tiêu đề + mô tả, ô tìm kiếm (tìm cả tiếng Việt không dấu, hiragana/katakana), chip nhóm cuộn ngang
  (「すべて」 + từng nhóm; mở thẳng nhóm bằng `#<slug>`), nhãn 「食事 ・ 12フレーズ」 (số đếm cập nhật theo tìm
  kiếm), thẻ câu kính light (ja nhỏ → vi lớn → katakana, nút phát âm + 見せる).
  - Phát âm: `speechSynthesis`, chỉ chọn giọng `vi-*`; không có giọng → ẩn mọi nút phát âm/「もう一度再生」 và
    hiện ghi chú `phrases.noVoice` (đặt cuối danh sách + trong 見せるモード, vì ghi chú hiện trễ ~1 s, để ở trên
    thì nó thành phần tử LCP → Lighthouse 0.64).
  - 見せるモード: `<dialog>` toàn màn hình nền amber, nút đóng trên-trái, 「見せるモード」, câu ja nhỏ, câu vi
    `clamp(44px,13vw,112px)`, katakana, nút 「もう一度再生」 rộng ở đáy, chú thích 「表示中は画面がスリープしません」
    (chỉ hiện khi Wake Lock thực sự được cấp; tự xin lại khi quay lại tab). Đóng: nút, Esc, vuốt xuống > 100 px.
- `/guide/` — bộ quy đổi `src/components/tools/CurrencyConverter.astro` (2 chiều, chip số tiền hay dùng, nút
  đổi chỗ, hiển thị 「2026年11月11日時点のレート」 + 1円≈…₫ + ghi chú), danh sách `guides` dạng accordion trên
  kính strong (icon-badge theo category, ngày cập nhật, 出典), hàng chip nhảy tới mục (mở accordion).
- `/contact/` — `ContactForm.astro`: Formspree (`PUBLIC_FORMSPREE_ID`), validate client với thông báo tiếng
  Nhật (`aria-invalid`, `aria-describedby`, focus vào ô lỗi đầu), gửi bằng fetch, honeypot `_gotcha`; nút LINE
  (`PUBLIC_LINE_URL`). Thiếu biến môi trường → hiện 「現在準備中です」, không lỗi build.
- `/privacy/` — chính sách đơn giản, đúng với những gì site làm (Formspree, Google Maps iframe, cache SW, giọng
  đọc trên máy, không cookie/analytics).

**SEO** (`SEO.astro`, props giữ nguyên): title/description, canonical, `hreflang` ja/vi/en + `x-default`,
robots `noindex` (khi đó bỏ canonical/hreflang), OG + Twitter (`og:locale` + alternate), JSON-LD:
`TouristAttraction` tự sinh cho `/spots/<slug>/` từ collection (geo, address, image), `BreadcrumbList` tự suy
từ URL (hoặc dùng `breadcrumbs` của trang), `WebSite` ở trang chủ; không sinh trùng nếu trang tự truyền.
OG image: spot/area/course = ảnh hero cắt 1200×630 JPEG (astro:assets `getImage`); các trang khác = ảnh tĩnh
`public/og/<section>.png` sinh bằng sharp (`src/components/seo/generate-images.mjs`). Sitemap: integration có
sẵn của Lead. `public/robots.txt`.

**PWA**: `public/manifest.webmanifest` (icon 192/512/maskable, shortcuts 会話帳 & 換算), `public/icons/*`,
`RegisterSW.astro` (manifest, apple-touch-icon, đăng ký SW **chỉ ở bản build**). `public/sw.js`: precache
`/phrases/` cả 3 ngôn ngữ + CSS/JS của chúng; trang: network-first rồi fallback cache (mọi trang đã xem dùng
được offline), chưa có thì trang 「オフラインです」 có link tới 会話帳; asset `/_astro/` cache-first. **Không
cache video** (`.mp4/.webm/...`, `destination=video`, request có `Range` → đi thẳng mạng).

**Khác**: `scripts/encode-video.sh` (kiểm tra ffmpeg/encoder, cắt 8–15 s, 720×1280 + 1920×1080, MP4 H.264
veryfast CRF 28 không tiếng `+faststart` + WebM VP9, poster WebP/AVIF, nền mờ, in dung lượng so với mục tiêu
2.5 MB / 5 MB — chưa chạy thật vì máy không có ffmpeg; đã kiểm `bash -n` và nhánh báo lỗi). `vercel.json`
(static, header cache `/_astro/` immutable, `sw.js` no-cache). `rate.config.ts` có hướng dẫn cập nhật.

**Test & CI**: `playwright.config.ts` (cổng 4341, iPhone SE 375×667 WebKit, iPhone 15 WebKit, Pixel 7 Chromium),
`tests/e2e/`:

- `smoke.spec.ts`: mọi route trong `dist/` (đọc tự động, 44 trang) × 3 viewport: HTTP < 400, `main`/`h1`/tab
  bar hiển thị, không tràn ngang, không lỗi JS; screenshot trang ja → `tests/screenshots/<project>/*.jpg`; 404.
- `phrases.spec.ts`: lọc chip/tìm kiếm, không giọng vi → ẩn nút + ghi chú, có giọng → đọc `vi-VN`,
  見せるモード (toàn màn hình, chữ ≥ 44 px, Wake Lock xin/nhả, phát lại, đóng bằng nút/Esc/vuốt xuống) + screenshot
  `phrases--show-mode.jpg`. Giọng đọc và Wake Lock được mock để không phụ thuộc máy.
- `features.spec.ts`: quy đổi 2 chiều + ngày tỷ giá, accordion guide, validate form tiếng Nhật, gửi Formspree
  (mock route), **tab bar bằng bàn phím** (Chromium: Tab qua đủ 5 tab có focus ring, Enter điều hướng; WebKit:
  focus + focus ring + Enter, vì WebKit/Safari mặc định không Tab tới link).
- `video.spec.ts`: reduced-motion / saveData không tải video (**`test.fixme`** — chờ VideoHero của A), các trang
  khác không tải video.
- `seo-pwa.spec.ts`: head tags, TouristAttraction, robots/sitemap/manifest/icon; offline (Chromium): 会話帳 en
  chưa từng mở vẫn chạy offline, trang đã xem chạy offline, trang chưa xem → trang offline, cache không có video.
- `lighthouserc.json` (mobile, 390×844, 4 nhóm ≥ 0.95, server 4341), `.github/workflows/ci.yml`
  (lint → build → check:content → test:e2e → lhci, upload screenshot/report).

## Kết quả (trên fixture)

- `npm run lint`: sạch. `npm run build`: 0 lỗi / 0 cảnh báo / 0 gợi ý, 44 trang.
- `npm run test:e2e`: **173 passed, 10 skipped** (6 = 2 test video `fixme` × 3 thiết bị; 2 = vuốt trên WebKit
  không tạo được TouchEvent tổng hợp; 2 = test offline chỉ chạy Chromium).
- `lhci` (chạy thử local, Chromium của Playwright qua `CHROME_PATH`, máy đang tải nặng vì 3 agent):
  Accessibility / Best Practices / SEO = **100** ở cả 6 URL. Performance: `/phrases/` 100, `/contact/` 100,
  `/guide/` 95, `/courses/` 100, `/` 92, `/spots/` 93 (trang của A, đang là stub; TBT dao động 0–1000 ms giữa
  các lần chạy do máy bận). Cần chạy lại trong CI sau khi gộp.

## Chưa xong / rủi ro

- Test video reduced-motion/saveData đang `fixme` (phụ thuộc VideoHero của A) — xem CR-C5.
- Tỷ giá trong `rate.config.ts` vẫn là giá trị tạm (`source: 'TODO: 要確認'`); cần tỷ giá thật + ngày.
- `robots.txt` dùng domain mẫu (CR-C2). Chuỗi UI mới đang ở `extra-i18n.ts` (CR-C1).
- `encode-video.sh` chưa chạy thật (không có ffmpeg trên máy).
- Lighthouse Performance trang chủ/`/spots/` < 95 ở lần đo local; chi phí Style & Layout lớn chủ yếu từ font
  (nhiều `@font-face` unicode-range) + backdrop-filter dùng chung — Integrator đo lại trên CI.
- Screenshot **không commit** (CR-C3); chạy `npm run test:e2e` để sinh lại.

## Change request

Xem `docs/change-requests/agent-C.md`: CR-C1 key i18n · CR-C2 robots.txt domain · CR-C3 `.gitignore`
screenshot · CR-C4 chuyển script sinh ảnh sang `scripts/` · CR-C5 gửi A (404 noindex, JSON-LD tự sinh,
VideoHero test) · CR-C6 biến môi trường.

## Cách chạy test

```bash
npm install
npx playwright install chromium webkit   # lần đầu
npm run build                            # test chạy trên bản build (astro preview, cổng 4341)
npm run test:e2e                         # 3 thiết bị; screenshot → tests/screenshots/<thiết bị>/
npx playwright test --project=pixel-7    # một thiết bị
npm run lhci                             # Lighthouse mobile ≥ 95 (cần Chrome; local có thể đặt
                                         # CHROME_PATH tới Chromium của Playwright)
node src/components/seo/generate-images.mjs   # sinh lại public/og/*.png và public/icons/*.png
scripts/encode-video.sh <video> [start] [giây 8–15]   # cần ffmpeg
```
