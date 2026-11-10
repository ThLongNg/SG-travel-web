# Pha 1 — Agent B: Nội dung & dữ liệu

Bạn là **Agent B**, người phụ trách biên tập nội dung. Bạn làm trên nhánh `agent-b/content`, trong worktree riêng. Trước hết hãy đọc `docs/SPEC.md` (đặc biệt là mục "Quy tắc về chất lượng thông tin"), `docs/PLAN.md` và `docs/CONTRACT.md`.

**Bạn chỉ được sửa** các đường dẫn thuộc B trong bảng sở hữu file. Bạn **không viết giao diện**. Agent này cần quyền **tìm kiếm web** để kiểm chứng thông tin.

## Việc cần làm

1. **Thay toàn bộ fixture bằng nội dung thật** (xóa các bản ghi `fixture: true`). Viết bằng tiếng Nhật, văn phong tạp chí du lịch, thể です・ます. Trọng tâm là **TPHCM và vùng lân cận**:
   - **Địa điểm (8)**: ベンタイン市場, サイゴン中央郵便局, グエンフエ通り（歩行者天国）, ビンタイ市場（チョロン）, クチトンネル, ランドマーク81（スカイビュー）, メコンデルタ（ミトー／ベンチェー）. Thêm 1 địa điểm ngoài TPHCM để minh họa: ホイアン旧市街.
   - **Khu vực**: ホーチミン中心部（1区・3区）, チョロン（5区）, ホーチミン近郊, 中部.
   - **Lịch trình mẫu (2)**: 「2泊3日 ホーチミン満喫」, 「3泊4日 ホーチミン＋メコンデルタ」.
   - **Hướng dẫn thực dụng**: visa, tiền và đổi tiền, SIM/eSIM, Grab, tip, an toàn và các kiểu lừa đảo thường gặp, nước uống và vệ sinh, ổ cắm, thời tiết theo mùa (mùa mưa / mùa khô), ứng xử văn hóa.
   - **Câu hội thoại (~40)**, theo các nhóm: あいさつ, 食事, 移動（タクシー・Grab）, 買い物・値段交渉, 緊急. Mỗi câu gồm tiếng Nhật, tiếng Việt có dấu và cách đọc katakana gần với **giọng miền Nam** (ghi chú điều này trong README nội dung).
2. **Kiểm chứng**:
   - Mỗi thông tin cụ thể (giờ mở cửa, giá vé, cách đi, quy định visa) phải có nguồn, ghi vào `sources`; ưu tiên nguồn chính thức.
   - Không chắc chắn thì ghi `TODO: 要確認` và đặt `verified: false`. **Tuyệt đối không bịa.**
   - Điền `lastVerified` là ngày bạn kiểm tra.
3. **Ảnh**:
   - Tạm dùng placeholder (SVG/ảnh màu) đặt trong `src/assets/content/`, đặt tên rõ ràng theo slug.
   - Lập danh sách ảnh cần chụp hoặc mua tại `docs/status/agent-B.md`.
   - `public/media/`: đặt video/poster placeholder và mô tả cảnh quay đề xuất cho video nền (8–15 giây, cảnh Sài Gòn đêm, vòng lặp liền).
4. **Bản dịch giao diện**: dịch `src/i18n/vi.json` và `src/i18n/en.json` từ `ja.json`. Không thêm hay bớt key; thiếu key thì ghi change request.
5. **Viết `scripts/check-content.*` thật**:
   - Liệt kê mọi `TODO: 要確認`, bản ghi `verified: false`, bản ghi thiếu nguồn, ảnh thiếu `alt`.
   - Trả mã lỗi khác 0 nếu còn fixture.
6. **`CREDITS.md`**: ghi nguồn và giấy phép của mọi ảnh/video.

## Khi xong

Chạy `npm run build` (schema Zod phải pass) và `npm run check:content`, rồi commit. Viết `docs/status/agent-B.md` gồm:
- Danh sách mục còn `要確認` để người thật kiểm tra lại.
- Danh sách ảnh/video cần chuẩn bị.
- Change request (nếu có).
