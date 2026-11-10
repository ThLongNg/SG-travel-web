# Nội dung (Content Collections) — hướng dẫn cho người biên tập

> Chủ sở hữu: Agent B. Schema nằm ở `src/content.config.ts` (Lead, đóng băng). File này không được Astro đọc như nội dung.

## Cấu trúc

| Thư mục    | Định dạng | Id (= `slug` = tên file)                            |
| ---------- | --------- | --------------------------------------------------- |
| `spots/`   | Markdown  | vd. `ben-thanh-market` — phần thân = 楽しみ方       |
| `areas/`   | Markdown  | vd. `hcmc-center` — phần thân = mô tả tổng quan     |
| `courses/` | Markdown  | vd. `hcmc-2n3d`                                     |
| `guides/`  | Markdown  | mỗi `category` một file (`visa`, `money`…)          |
| `phrases/` | YAML      | mỗi file một nhóm tình huống (`greetings`, `food`…) |

Ảnh: `src/assets/content/<slug>.webp` (ảnh chính) và `<slug>-2.webp`… (gallery). Ảnh thật từ Wikimedia Commons (CC BY / CC BY-SA / CC0 / public domain); nguồn và giấy phép ở `src/data/photo-credits.json` (hiển thị tại /about/#credits) và `CREDITS.md`.

## Quy tắc chất lượng thông tin

- Không bịa. Giờ mở cửa, giá vé, cách đi, quy định visa… phải có nguồn trong `sources` (ưu tiên nguồn chính thức).
- Chưa chắc chắn → viết `TODO: 要確認` ngay tại chỗ và đặt `verified: false`.
- Chuỗi YAML có chứa `: ` (ví dụ `TODO: 要確認`) **phải đặt trong dấu nháy đơn**, nếu không YAML sẽ hiểu thành object và build lỗi.
- `lastVerified` = ngày kiểm tra gần nhất.
- `npm run check:content` liệt kê mọi `TODO: 要確認`, bản ghi `verified: false`, bản ghi thiếu nguồn, ảnh thiếu alt.

## Văn phong

- Tiếng Nhật thể です・ます, giọng tạp chí du lịch, câu ngắn.
- Địa danh dùng katakana phổ biến; lần đầu xuất hiện kèm tên tiếng Việt (trường `nameVi`).
- Ngày dạng `2026年11月11日`, giờ 24h, giá kèm `約〇〇円` (trang tự quy đổi từ `priceVnd`).
- Từ tháng 7/2025, TP.HCM bỏ cấp quận và sáp nhập tỉnh. Nội dung vẫn dùng cách gọi quen thuộc 「1区」「5区」 nhưng có ghi chú về tên mới.

## Sổ tay hội thoại (`phrases/`) — cách đọc katakana theo **giọng miền Nam**

Trường `kana` được viết gần với cách phát âm của **người Sài Gòn (giọng miền Nam)**, vì website tập trung vào TP.HCM. Một số quy ước:

| Chữ Việt           | Giọng Nam                  | Ví dụ                                             |
| ------------------ | -------------------------- | ------------------------------------------------- |
| `v`, `d`, `gi`     | đọc như "y" → ヤ/ユ/ヨ行   | Dạ → ヤー, Dừng → ユン, giúp → ユップ, với → ヨイ |
| `r`                | → ラ行                     | rau → ラウ                                        |
| `qu`               | → ワ/ウ                    | quá → ワー, Quẹo → ウェオ                         |
| vần `ơn`           | gần "ung" → ウン           | Cảm ơn → カム ウン, hơn → フン                    |
| âm cuối `-t`, `-c` | gần như không bật hơi → ッ | Nhật → ニャッ, mất → マッ                         |
| `nhiêu`, `hiểu`    | rút gọn → ニウ, ヒウ       | Bao nhiêu → バオ ニウ                             |

Từ vựng cũng ưu tiên cách nói miền Nam (và có ghi chú trong `note`):

- **Mắc** (đắt), **Quẹo** (rẽ), **nước suối** (nước khoáng đóng chai), **rau ngò** (rau mùi), **Dạ** (vâng).

Katakana chỉ là cách đọc gần đúng; nút phát âm (`speechSynthesis`, `vi-VN`) giúp nghe chuẩn hơn. Nên nhờ người bản xứ miền Nam nghe lại khi cập nhật.

## Thêm một địa điểm mới

1. Copy một file trong `spots/` (vd. `ben-thanh-market.md`) thành `<slug-moi>.md`, sửa `slug` cho trùng tên file.
2. Thêm ảnh `src/assets/content/<slug-moi>.webp` (+ `-2.webp`…) và ghi vào `CREDITS.md`.
3. Điền thông tin, nguồn, `lastVerified`, `verified`.
4. Chạy `npm run check:content` rồi `npm run build`.
