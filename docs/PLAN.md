# PLAN — Chia việc cho 3 agent chạy song song

## Ý tưởng

Ba agent làm cùng lúc sẽ giẫm chân nhau nếu cùng sửa một file. Vì vậy kế hoạch có 3 pha:

```
Pha 0 (tuần tự, 1 agent)      Pha 1 (song song, 3 agent)               Pha 2 (tuần tự, 1 agent)
┌──────────────────────┐      ┌─ Agent A: Giao diện & trang ──────┐
│ Lead: nền tảng chung │ ───► ├─ Agent B: Nội dung & dữ liệu ─────┤ ───► Integrator: gộp, kiểm thử,
│ (khung, token, kính, │      └─ Agent C: Tính năng & chất lượng ─┘      sửa lỗi, deploy
│  schema, hợp đồng)   │
└──────────────────────┘
```

- **Pha 0** tạo mọi thứ dùng chung và "đóng băng" chúng thành **hợp đồng** (`docs/CONTRACT.md`).
- **Pha 1**: mỗi agent làm trên **nhánh git + worktree riêng** và **chỉ được sửa các đường dẫn mình sở hữu**.
- **Pha 2** gộp ba nhánh lại và chạy kiểm thử toàn bộ.

## Bảng sở hữu file (quan trọng nhất)

| Đường dẫn                                                                                                                                                                                     | Chủ sở hữu                        | Ghi chú                                                                                                                                                    |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `package.json`, lockfile, `astro.config.*`, `tsconfig.json`, `eslint.config.js`, `.prettierrc`, `.prettierignore`                                                                             | Lead (pha 0) → Integrator (pha 2) | Pha 1 **không ai sửa**. Cần thêm thư viện thì ghi vào change request. (Tailwind v4: không có `tailwind.config.*`, token nằm trong `src/styles/global.css`) |
| `src/styles/**`, `src/components/glass/**`, `src/layouts/**`, `src/lib/**`, `src/components/StubPage.astro`, `src/pages/dev/**`                                                               | Lead                              | Đóng băng sau pha 0. `StubPage` bị xóa ở pha 2                                                                                                             |
| `src/content.config.ts` (schema Zod)                                                                                                                                                          | Lead                              | Đóng băng. Astro 7 bắt buộc đường dẫn này (`src/content/config.ts` báo lỗi)                                                                                |
| `src/i18n/ja.json` (danh sách key)                                                                                                                                                            | Lead                              | Agent khác chỉ **đề xuất** key mới                                                                                                                         |
| `docs/SPEC.md`, `docs/PLAN.md`, `docs/CONTRACT.md`                                                                                                                                            | Lead                              | Chỉ đọc trong pha 1                                                                                                                                        |
| `src/pages/[...lang]/index.astro`, `src/pages/[...lang]/spots/**`, `src/pages/[...lang]/areas/**`, `src/pages/[...lang]/courses/**`, `src/pages/[...lang]/about.astro`, `src/pages/404.astro` | **A**                             | `[...lang]` = một file phục vụ cả `/`, `/vi/`, `/en/`                                                                                                      |
| `src/components/{home,spot,area,course,media}/**` (gồm `VideoHero`)                                                                                                                           | **A**                             |                                                                                                                                                            |
| `src/content/**`, `src/assets/content/**`, `public/media/**`                                                                                                                                  | **B**                             |                                                                                                                                                            |
| `src/i18n/vi.json`, `src/i18n/en.json`, `CREDITS.md`, `scripts/check-content.*`                                                                                                               | **B**                             |                                                                                                                                                            |
| `src/pages/[...lang]/phrases/**`, `src/pages/[...lang]/guide/**`, `src/pages/[...lang]/contact.astro`, `src/pages/[...lang]/privacy.astro`                                                    | **C**                             |                                                                                                                                                            |
| `src/components/{phrase,tools,seo,pwa}/**` (gồm `tools/rate.config.ts`), `public/manifest.webmanifest`, `public/sw.js`, `public/icons/**`, `public/robots.txt`, `public/og/**`                | **C**                             |                                                                                                                                                            |
| `scripts/encode-video.*`, `tests/**`, `playwright.config.*`, `lighthouserc.*`, `.github/workflows/**`, `vercel.json`                                                                          | **C**                             |                                                                                                                                                            |
| `docs/status/agent-X.md`, `docs/change-requests/agent-X.md`                                                                                                                                   | mỗi agent một file riêng          |                                                                                                                                                            |
| `README.md`                                                                                                                                                                                   | Integrator                        |                                                                                                                                                            |

## Hợp đồng do pha 0 tạo ra (`docs/CONTRACT.md`)

1. **Schema nội dung**: kiểu dữ liệu của `spots`, `areas`, `courses`, `guides`, `phrases`. Kèm **2 bản ghi mẫu (fixture)** cho mỗi collection, đánh dấu `fixture: true`, để A và C có dữ liệu mà dựng giao diện ngay, không phải chờ B.
2. **API của component kính**: props của `GlassPanel`, `GlassButton`, `GlassChip`, `GlassSearch`, `GlassTabBar`, `GlassSheet`.
3. **Stub cho phần agent khác sẽ viết**: Lead tạo sẵn file với props cố định và nội dung tạm, ví dụ `src/components/seo/SEO.astro` (C sẽ làm thật), `src/components/media/VideoHero.astro` (A sẽ làm thật). Agent sở hữu được viết lại phần ruột nhưng **không được đổi props**.
4. **Key i18n**: danh sách key trong `ja.json`.
5. **Route**: danh sách URL và agent phụ trách từng URL.

## Quy tắc chung cho cả 3 agent ở pha 1

- Đọc `docs/SPEC.md`, `docs/PLAN.md`, `docs/CONTRACT.md` trước khi làm.
- Chỉ sửa file mình sở hữu. Cần đổi thứ thuộc người khác thì ghi vào `docs/change-requests/agent-X.md`, ghi rõ file, lý do và nội dung đề xuất. Sau đó làm tạm bằng cách khác, không bị chặn.
- Không cài thêm thư viện. Nếu thật sự cần thì ghi vào change request.
- Commit nhỏ và thường xuyên, theo Conventional Commits (`feat(spot): ...`).
- Trước khi kết thúc phải chạy `npm run lint` và `npm run build` không lỗi, rồi viết `docs/status/agent-X.md`: đã xong gì, còn gì, rủi ro gì.
- Không bịa thông tin du lịch (xem SPEC, mục "Quy tắc về chất lượng thông tin").

## Thứ tự gộp ở pha 2

B (nội dung) → A (trang) → C (tính năng). Sau mỗi lần gộp, chạy build và test ngay.
