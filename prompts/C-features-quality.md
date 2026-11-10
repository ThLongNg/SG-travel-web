# Pha 1 — Agent C: Tính năng, PWA, SEO và kiểm thử

Bạn là **Agent C**. Bạn làm trên nhánh `agent-c/features`, trong worktree riêng. Trước hết hãy đọc `docs/SPEC.md`, `docs/PLAN.md` và `docs/CONTRACT.md`.

**Bạn chỉ được sửa** các đường dẫn thuộc C trong bảng sở hữu file. Dùng dữ liệu fixture; nội dung thật do B viết song song.

## Việc cần làm

1. **Sổ tay hội thoại `/phrases/`**:
   - Tab theo nhóm câu, tìm kiếm, thẻ câu dạng kính "nhẹ".
   - Nút phát âm dùng `speechSynthesis` với giọng `vi-VN`. Nếu máy không có giọng tiếng Việt thì ẩn nút và hiện ghi chú.
   - **Chế độ 見せる**: hiển thị toàn màn hình, chữ tiếng Việt cực lớn, nền màu nhấn; giữ màn hình sáng bằng Wake Lock API (có kiểm tra hỗ trợ); có nút phát lại; đóng bằng nút hoặc vuốt xuống.
2. **Thông tin hữu ích `/guide/`**: trang tổng hợp đọc từ collection `guides`, kèm **công cụ quy đổi VND ↔ JPY** chạy ở client. Tỷ giá và ngày cập nhật đặt trong `src/components/tools/rate.config.ts`; hiển thị rõ ngày của tỷ giá.
3. **Liên hệ `/contact/`**: form gửi qua Formspree (endpoint lấy từ biến môi trường `PUBLIC_FORMSPREE_ID`) và nút link tới LINE Official Account (`PUBLIC_LINE_URL`). Có validate và thông báo lỗi bằng tiếng Nhật.
4. **`/privacy/`**: trang chính sách bảo mật đơn giản.
5. **SEO** (viết phần ruột của `SEO.astro`, **giữ nguyên props**):
   - Meta, OG/Twitter, `hreflang`, canonical.
   - JSON-LD `TouristAttraction` + `BreadcrumbList`.
   - Sitemap, `robots.txt`, OG image tự sinh cho từng trang (dùng thư viện đã cài; không có thì làm ảnh OG tĩnh).
6. **PWA** (viết phần ruột của `RegisterSW.astro`):
   - `manifest.webmanifest`, icon, theme-color.
   - Service worker cache các trang đã xem cùng toàn bộ `/phrases/` để dùng offline.
   - **Không cache file video.**
7. **Pipeline video** `scripts/encode-video.sh`: dùng ffmpeg chuyển một video gốc thành:
   - Bản dọc 720×1280 và bản ngang 1920×1080.
   - Mỗi bản có MP4 H.264 (`-preset veryfast`, CRF ~28, không âm thanh, `+faststart`) và WebM.
   - Ảnh poster WebP/AVIF.
   - Cắt 8–15 giây và in ra dung lượng để so với mục tiêu trong SPEC.
8. **Kiểm thử và CI**:
   - Playwright với viewport iPhone SE, iPhone 15 (WebKit) và Pixel 7 (Chromium). Test khói (smoke test) cho mọi route; chụp screenshot vào `tests/screenshots/`.
   - Test riêng: video không tải khi bật reduced-motion; tab bar dùng được bằng bàn phím; chế độ 見せる.
   - Lighthouse CI (`lighthouserc`) ở chế độ mobile với ngưỡng ≥ 95.
   - GitHub Actions chạy `lint → build → check:content → test:e2e → lhci`.
   - `vercel.json` để deploy dạng static.

## Khi xong

Chạy `npm run lint`, `npm run build` và `npm run test:e2e` (trên fixture). Commit, rồi viết `docs/status/agent-C.md` gồm: đã xong, chưa xong, change request, cách chạy test.
