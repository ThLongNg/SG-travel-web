# Pha 1 — Agent A: Giao diện & các trang chính

Bạn là **Agent A**. Bạn làm trên nhánh `agent-a/ui`, trong worktree riêng. Ba agent đang chạy song song, nên trước hết hãy đọc `docs/SPEC.md`, `docs/PLAN.md` (đặc biệt là bảng sở hữu file và quy tắc chung) và `docs/CONTRACT.md`.

**Bạn chỉ được sửa** các đường dẫn thuộc A trong bảng sở hữu file. Nội dung thật do Agent B viết song song; bạn dùng dữ liệu **fixture** có sẵn và dựng giao diện sao cho tự động chạy đúng khi nội dung thật được gộp vào. **Không hardcode nội dung**: mọi thứ đọc từ Content Collections và i18n.

## Việc cần làm (theo thứ tự ưu tiên)

1. **`VideoHero`** (`src/components/media/`): làm theo mục "Video nền TPHCM" trong SPEC.
   - `autoplay muted loop playsinline`, có poster preload.
   - Chọn nguồn video theo hướng màn hình.
   - Không tải video khi `prefers-reduced-motion`, `saveData` hoặc mạng 2g/3g.
   - Tạm dừng khi khuất màn hình hoặc khi tab ẩn.
   - Có nút kính phát/tạm dừng và scrim để chữ dễ đọc.
   - Giữ nguyên props trong CONTRACT.
2. **Trang chủ `/`**:
   - Hero video toàn màn hình với chữ dọc, khẩu hiệu, `GlassSearch` và chip chủ đề.
   - Các mục 01 人気の観光地 (thẻ vuốt ngang), 02 エリアから探す, 03 モデルコース, 04 旅の準備 (link sang trang của C).
   - Header trong suốt chuyển thành kính khi cuộn.
3. **Chi tiết địa điểm `/spots/[slug]/`** (trang quan trọng nhất):
   - Gallery vuốt (scroll-snap) và nút quay lại / yêu thích / chia sẻ (Web Share API).
   - Hộp 基本情報 dạng lưới icon; accordion 見どころ / ヒント / 注意点.
   - Nút "地図で開く" mở thẳng app Google/Apple Maps; bản đồ chỉ tải khi cuộn tới.
   - Cuối trang có 情報更新日 và 出典; hiện nhãn "情報確認中" khi `verified: false` ở môi trường dev.
4. **Danh sách `/spots/`**: lưới thẻ; bộ lọc (khu vực, chủ đề, mùa) mở trong `GlassSheet`; tìm kiếm phía client, khớp được cả kana; trạng thái lọc phản ánh lên URL.
5. **`/areas/[area]/`**, **`/courses/`** và **`/courses/[slug]/`** (timeline theo ngày).
6. **`404`** và **`about`**.

## Yêu cầu

- Thiết kế mobile trước (375 / 390px). Vùng chạm ≥ 44px. Có safe-area.
- Tuân thủ giới hạn số phần tử kính trên màn hình như SPEC. Danh sách dài dùng kính "nhẹ".
- Chuỗi UI lấy từ `t()`. Thiếu key thì ghi vào `docs/change-requests/agent-A.md`, tạm dùng key gần nhất.
- Mỗi trang phải chạy đúng với cả 3 ngôn ngữ (`/`, `/vi/`, `/en/`).
- JS ban đầu < 50KB gzip.

## Khi xong

Chạy `npm run lint` và `npm run build`, commit, rồi viết `docs/status/agent-A.md` với các nội dung: đã xong, chưa xong, change request, ghi chú cho Integrator.
