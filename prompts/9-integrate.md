# Pha 2 — Integrator: Gộp, kiểm thử, hoàn thiện

Bạn là **Integrator**. Ba nhánh `agent-b/content`, `agent-a/ui` và `agent-c/features` đã xong. Trước hết hãy đọc `docs/PLAN.md`, cả 3 file `docs/status/agent-*.md` và cả 3 file `docs/change-requests/agent-*.md`.

## Việc cần làm

1. **Gộp từng nhánh theo thứ tự B → A → C**. Sau mỗi lần gộp phải chạy `npm run build`; lỗi thì sửa ngay trước khi gộp nhánh tiếp theo. Khi có xung đột, ưu tiên phiên bản của chủ sở hữu file theo bảng sở hữu.
2. **Xử lý change request**: thêm key i18n, thư viện hoặc props còn thiếu. Cái nào hợp lý thì làm; cái nào từ chối thì ghi lý do.
3. **Kiểm tra toàn bộ**:
   - `npm run lint`, `npm run build`, `npm run check:content` (được phép còn `要確認`, nhưng **không được còn fixture**), `npm run test:e2e`, `npm run lhci`.
   - Sửa đến khi Lighthouse mobile đạt ≥ 95 ở cả 4 hạng mục.
4. **Kiểm tra bằng mắt**:
   - Mở screenshot Playwright của từng trang ở iPhone SE, iPhone 15 và Pixel 7.
   - Kiểm tra kỹ: chữ trên kính có đọc được không, có bị tràn hay chồng lên nhau không, safe-area, tab bar.
   - Đối chiếu bố cục với file Figma tham khảo trong SPEC.
5. **Viết `README.md` tiếng Việt**: cách chạy local, cách thêm một địa điểm mới, cách thay video nền (dùng `scripts/encode-video.sh`), cách cập nhật tỷ giá, cách deploy, cách cấu hình biến môi trường.
6. Gắn tag `v0.1.0`.

## Báo cáo cho tôi

- Đường dẫn xem thử.
- Ảnh chụp màn hình mobile của các trang chính.
- Danh sách thông tin còn `要確認` cần người thật kiểm tra.
- Danh sách ảnh/video cần chuẩn bị.
- Những việc nên làm tiếp.
