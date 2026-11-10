# Change requests — Agent A

## CR-A1 · `src/i18n/ja.json` (Lead / Integrator) — thêm key

| Key đề xuất                | Giá trị ja                     | Đang dùng tạm                                             | Dùng ở                                |
| -------------------------- | ------------------------------ | --------------------------------------------------------- | ------------------------------------- |
| `common.seeAll`            | すべて見る                     | `common.seeMore`（もっと見る）                            | `.section-more` ở trang chủ / khu vực |
| `common.all`               | すべて                         | (bỏ chip "すべて" ở hero)                                 | chip chủ đề ở hero                    |
| `common.copied`            | リンクをコピーしました         | (chỉ đổi màu icon chia sẻ)                                | fallback khi không có Web Share API   |
| `courses.schedule`         | スケジュール                   | `courses.nights`（2泊3日）                                | tiêu đề timeline `/courses/[slug]/`   |
| `home.prepConverter`       | 円⇄ドンをすぐ換算              | `guide.rateNote`                                          | ô 為替 ở 04 旅の準備                  |
| `about.lead`, `about.body` | (đoạn giới thiệu site, B viết) | `site.tagline` + `site.description` + `footer.disclaimer` | `/about/`                             |
| `spots.backToList`         | 観光地一覧へ                   | `nav.back`                                                | nút quay lại (khi không có history)   |

## CR-A2 · `src/styles/glass.css` (Lead) — `.glass` ghi đè `absolute` của Tailwind

`.glass { position: relative }` nằm ngoài `@layer` nên thắng utility `absolute` (trong `@layer utilities`).
Ví dụ `/dev/glass`: bộ đếm "1 / 8" (`glass ... absolute right-3 bottom-3`) thực tế **không** nằm góc ảnh.
Đề xuất: bọc `.glass { … }` trong `@layer components` hoặc dùng `:where(.glass) { position: relative }`.
Tạm thời A đặt `position: absolute` trong style riêng (VideoHero, nút back của course) hoặc bọc bằng `<span class="absolute">`.

## CR-A3 · `src/styles/global.css` (Lead) — `.tile-pattern` xóa nền kính

`.tile-pattern` đặt `background-image`, nên dùng chung với `.glass--strong` (nền là gradient) sẽ mất nền kính.
Đề xuất: ghi chú trong CONTRACT, hoặc thêm biến thể dùng `::after`. Tạm thời A đặt pattern vào một `div` tuyệt đối bên trong.

## CR-A4 · Agent C — anchor trên `/guide/`

Ô 04 旅の準備 ở trang chủ link tới `/guide/#converter` (bộ đổi tiền) và `/guide/#<slug guide>` (id của entry `guides`).
Đề nghị C đặt `id="converter"` cho công cụ đổi tiền và `id={guide.id}` cho từng mục guide.
