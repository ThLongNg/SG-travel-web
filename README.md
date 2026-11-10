# Saigon Travel — 日本人旅行者のためのベトナム観光ガイド

Website tĩnh giới thiệu du lịch Việt Nam (trọng tâm TP.HCM) cho khách Nhật. Giao diện "Saigon × Liquid Glass", ưu tiên mobile.
Astro 7 (static) · TypeScript strict · Tailwind CSS v4 · Content Collections · i18n `/` (ja) · `/vi/` · `/en/`.

Tài liệu: [docs/SPEC.md](docs/SPEC.md) (đặc tả) · [docs/PLAN.md](docs/PLAN.md) (chia việc, sở hữu file) · [docs/CONTRACT.md](docs/CONTRACT.md) (schema, component, quy ước thiết kế) · [CREDITS.md](CREDITS.md) (nguồn ảnh/video).

## Chạy local

Cần Node.js ≥ 22.

```bash
npm install
npm run dev -- --host        # http://localhost:4321 · điện thoại cùng Wi-Fi: http://<IP-máy>:4321
```

| Lệnh                    | Việc                                                                    |
| ----------------------- | ----------------------------------------------------------------------- |
| `npm run build`         | `astro check` + build ra `dist/` (phải 0 lỗi, 0 cảnh báo)               |
| `npm run preview`       | Xem bản build (service worker chỉ hoạt động ở bản build)                |
| `npm run lint`          | ESLint + Prettier (`npm run format` để tự sửa định dạng)                |
| `npm run check:content` | Liệt kê `TODO: 要確認`, bản ghi chưa xác minh, thiếu nguồn/alt, fixture |
| `npm run test:e2e`      | Playwright: iPhone SE, iPhone 15 (WebKit), Pixel 7 (Chromium)           |
| `npm run lhci`          | Lighthouse CI chế độ mobile, ngưỡng ≥ 95                                |
| `npm run images`        | Sinh lại ảnh OG (`public/og/`) và icon PWA (`public/icons/`)            |

Lần đầu chạy test cần cài trình duyệt: `npx playwright install chromium webkit`. Trước khi chạy `test:e2e`, tắt mọi `astro preview` đang chạy (Astro chỉ cho một server preview mỗi dự án).

Trang `/dev/glass` (noindex) là mẫu thiết kế chuẩn: toàn bộ component kính và pattern bố cục.

## Thêm một địa điểm mới

1. Copy một file có sẵn, ví dụ `src/content/spots/ben-thanh-market.md` → `src/content/spots/<slug>.md` (slug: chữ thường, số, gạch nối).
2. Sửa frontmatter: `slug` (trùng tên file), `nameJa`, `nameVi`, `reading`, `area` (`north`/`central`/`south`), `areaSlug` (id trong `src/content/areas/`), `themes`, `bestSeasons`, `info`, `coordinates`, `sources` (≥ 1 nguồn, ưu tiên chính thức), `lastVerified`, `verified`.
3. Ảnh: đặt `src/assets/content/<slug>.webp` (và `<slug>-2.webp`… cho gallery), ghi `heroAlt` / `alt` bằng tiếng Nhật, thêm dòng vào `CREDITS.md`.
4. Phần thân Markdown là mục 楽しみ方.
5. **Không bịa thông tin**: chưa chắc thì ghi `TODO: 要確認` và để `verified: false`.
6. Chạy `npm run build` (schema Zod báo lỗi nếu thiếu trường bắt buộc) và `npm run check:content`.

Khu vực, lịch trình, hướng dẫn và câu hội thoại làm tương tự trong `src/content/areas|courses|guides|phrases/` (schema ở `src/content.config.ts`).

## Thay video nền

Video hiện tại: flycam TP.HCM về đêm của kênh Explorepia (xem `CREDITS.md`). Để thay bằng video khác (8–15 giây, không âm thanh, vòng lặp liền):

```bash
# cần ffmpeg (Windows: winget install Gyan.FFmpeg · macOS: brew install ffmpeg)
bash scripts/encode-video.sh <video-gốc> [giây-bắt-đầu] [thời-lượng]
# ví dụ: bash scripts/encode-video.sh ~/Downloads/saigon-night.mp4 3 10
```

Script tạo đủ bộ file trong `public/media/` với tên cố định (bản dọc 720×1280 ≤ 2.5MB, bản ngang 1920×1080 ≤ 5MB, MP4 + WebM, poster, nền mờ) và in dung lượng để so với mục tiêu. Cập nhật `CREDITS.md` trong cùng commit.

## Cập nhật tỷ giá

Sửa `src/components/tools/rate.config.ts`: `jpyPerVnd` (số yên cho 1 đồng), `asOf` (ngày lấy tỷ giá, `YYYY-MM-DD`), `source` (tên nguồn). Ngày tỷ giá hiện cạnh công cụ quy đổi ở `/guide/`; giá vé quy đổi trên trang địa điểm cũng dùng tỷ giá này.

## Biến môi trường

| Biến                  | Dùng cho                                                               | Không đặt thì                          |
| --------------------- | ---------------------------------------------------------------------- | -------------------------------------- |
| `SITE_URL`            | Domain thật (canonical, hreflang, OG, sitemap, robots.txt)             | `https://saigon-travel.example`        |
| `PUBLIC_FORMSPREE_ID` | ID form Formspree (phần sau `https://formspree.io/f/`) cho `/contact/` | Form hiện nhưng báo 「現在準備中です」 |
| `PUBLIC_LINE_URL`     | Link LINE Official Account (vd. `https://lin.ee/xxxx`)                 | Nút LINE xám + 「現在準備中です」      |

Local: tạo file `.env` (đã nằm trong `.gitignore`). CI (GitHub Actions) đọc từ repository variables (`vars.*`).

## Deploy

**Vercel** (đã có `vercel.json`): import repo, framework Astro, đặt 3 biến môi trường ở trên, deploy. Build command `npm run build`, output `dist/`.

**Netlify**: build command `npm run build`, publish directory `dist`, đặt các biến môi trường tương tự.

CI (`.github/workflows/`) chạy `lint → build → check:content → test:e2e → lhci` cho mỗi push/PR.
