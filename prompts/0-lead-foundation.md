# Pha 0 — Lead: Nền tảng chung

Bạn là **Lead** của dự án. Hãy đọc `docs/SPEC.md` và `docs/PLAN.md` trước. Nhiệm vụ của bạn là dựng nền tảng để 3 agent sau đó làm song song mà **không đụng file của nhau**. Hãy làm nhanh, gọn và chính xác: những gì bạn làm ở đây sẽ bị đóng băng.

## Việc cần làm

1. **Khởi tạo repo**
   - `git init`; dự án Astro (static) + TypeScript strict + Tailwind + MDX + `@astrojs/sitemap`.
   - Cài **toàn bộ** thư viện dự kiến cần cho pha 1, để các agent không phải sửa `package.json`: Playwright, `@lhci/cli`, ESLint + Prettier (kèm plugin Astro). Thêm thư viện PWA và bản đồ (ví dụ Leaflet) nếu chọn dùng.
   - Tạo sẵn các script: `dev`, `build`, `preview`, `lint`, `format`, `test:e2e`, `lhci`, `check:content` (tạm thời in "TODO").
2. **Thiết kế nền (Saigon × Liquid Glass)**, theo mục "Định hướng thiết kế" trong SPEC:
   - Design token (màu, font, bo góc, khoảng cách, công thức kính) trong `src/styles/` và Tailwind config.
   - Font Noto Sans JP / Noto Serif JP / Inter, có subset và `font-display: swap`.
   - Bộ component kính hoàn chỉnh trong `src/components/glass/`: `GlassPanel`, `GlassButton`, `GlassChip`, `GlassSearch`, `GlassTabBar` (dạng viên nổi giống iOS 26), `GlassSheet` (bottom sheet). Có `-webkit-backdrop-filter`, có fallback `@supports`, có tôn trọng `prefers-reduced-motion`.
   - Layout chung trong `src/layouts/`: `BaseLayout` (nền ảnh poster Sài Gòn làm mờ cố định, safe-area, viewport-fit=cover, `100dvh`), header kính và tab bar kính.
3. **i18n**: routing `/`, `/vi/`, `/en/`; file `src/i18n/ja.json` chứa **toàn bộ** key UI dự kiến; `vi.json` và `en.json` tạm copy từ ja; helper `t()` trong `src/lib/`.
4. **Schema nội dung**: `src/content/config.ts` đúng như SPEC (thêm trường `fixture: boolean`). Tạo **2 bản ghi fixture** cho mỗi collection (spots, areas, courses, guides, phrases). Fixture chỉ là dữ liệu giả, ghi rõ `fixture: true` và nội dung "ダミー".
5. **Stub** cho phần agent khác sẽ viết. Mỗi stub có props cố định, kiểu TypeScript rõ ràng và nội dung tạm:
   - Cho A: `src/components/media/VideoHero.astro`; trang `index`, `spots/index`, `spots/[slug]`, `areas/[area]`, `courses/index`, `courses/[slug]`, `404`, `about`.
   - Cho C: `src/components/seo/SEO.astro`, `src/components/pwa/RegisterSW.astro`; trang `phrases/index`, `guide/index`, `contact`, `privacy`.
   - Trong `BaseLayout`, gọi sẵn `<SEO>` và `<RegisterSW>` để C không phải sửa layout.
6. **Trang demo `/dev/glass`**: video nền placeholder + tất cả component kính, để duyệt trên điện thoại thật.
7. **Viết tài liệu**:
   - Copy `SPEC.md` và `PLAN.md` vào `docs/`.
   - Viết `docs/CONTRACT.md`: schema, props của mọi component dùng chung và stub, danh sách key i18n, bảng route → agent phụ trách.
   - Tạo `docs/status/` và `docs/change-requests/`, mỗi thư mục có 3 file trống `agent-A.md`, `agent-B.md`, `agent-C.md`.
8. **Kiểm tra và đóng gói**: `npm run lint` và `npm run build` không lỗi. Commit, gắn tag `foundation`. Tạo 3 nhánh từ tag này: `agent-a/ui`, `agent-b/content`, `agent-c/features`.

## Khi xong

Dừng lại và báo cho tôi:
- Lệnh chạy dev để mở `/dev/glass` trên điện thoại (`astro dev --host`).
- Tóm tắt hợp đồng.

Chờ tôi duyệt giao diện kính trước khi bắt đầu pha 1.
