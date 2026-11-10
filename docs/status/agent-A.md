# Status — Agent A (giao diện & trang chính)

Nhánh `agent-a/ui`. `npm run lint` ✅ · `npm run build` ✅ (0 lỗi / 0 cảnh báo / 0 gợi ý, 44 trang).
Đã kiểm tra bằng ảnh chụp Playwright WebKit iPhone 15 (preview cổng 4331): trang chủ, danh sách, chi tiết, khu vực, khóa học, about, 404, `/vi/`, `/en/`.

## Đã xong

- **`VideoHero`** (`src/components/media/`), giữ nguyên props:
  - Poster là `<picture>` dọc/ngang, khớp với preload của layout (LCP không phụ thuộc video).
  - `<video muted loop playsinline>` không có `<source>` trong HTML. JS chỉ gắn nguồn khi không bật `prefers-reduced-motion`, không bật `saveData` và mạng không phải 2g/3g. Màn hình dọc dùng file mobile, ngang dùng desktop, và đổi lại khi xoay máy.
  - Trên WebKit chỉ dùng MP4; trình duyệt khác dùng WebM trước rồi MP4.
  - Video tạm dừng khi khuất màn hình (IntersectionObserver) và khi tab ẩn. Nút kính phát/tạm dừng tôn trọng việc người dùng tự dừng. Có scrim, và video hiện dần khi bắt đầu phát.
- **Trang chủ**:
  - Hero gồm SÀI GÒN, khẩu hiệu (chỉ xuống dòng sau `、`), chữ dọc, `GlassSearch` (gửi tới `/spots/?q=`) và chip chủ đề (link tới `/spots/?theme=`).
  - 01 thẻ vuốt ngang · 02 hàng khu vực · 03 thẻ khóa học · 04 lưới 旅の準備 (bộ đổi tiền, 会話帳, 2 guide đầu tiên của collection `guides`).
  - Header trong suốt rồi thành kính khi cuộn (layout đã có sẵn).
- **`/spots/[slug]/`**:
  - Gallery scroll-snap với bộ đếm và lightbox toàn màn hình (`<dialog>`). Nút quay lại (`history.back` nếu trang trước cùng site), yêu thích (`localStorage`) và chia sẻ (Web Share API, nếu không có thì chép link).
  - どんな場所？, 基本情報 dạng lưới icon (giá có quy đổi sang yên, các giá trị 3 trạng thái).
  - Nút "地図で開く": thiết bị iOS mở Apple Maps, các thiết bị khác dùng universal link của Google Maps.
  - Accordion 見どころ / 楽しみ方 (thân Markdown) / ヒント / 注意点.
  - Iframe bản đồ chỉ tải khi cuộn tới (cách 200px) hoặc khi bấm nút.
  - Mục 近くの観光地 và khóa học chứa địa điểm này. Cuối trang có 情報更新日 + 出典.
  - Nhãn "情報確認中" chỉ hiện ở dev khi `verified: false`. JSON-LD `TouristAttraction` và breadcrumbs được truyền vào layout.
- **`/spots/`**:
  - Lưới thẻ 2/3/4 cột, có hàng chip chủ đề.
  - `GlassSheet` lọc theo khu vực, chủ đề và tháng; nút bộ lọc có huy hiệu đếm số bộ lọc đang bật.
  - Tìm kiếm không phân biệt hiragana/katakana/nửa độ rộng và không phân biệt dấu tiếng Việt (đã thử `だみー`, `ﾀﾞﾐｰ`, `dia diem`).
  - Trạng thái được ghi lên URL bằng `replaceState` (`?q=&area=&theme=&month=`). Có trạng thái trống dùng gạch bông và nút đặt lại.
- **`/areas/[area]/`**:
  - Phần tổng quan.
  - Bảng khí hậu 12 tháng: là `<table>` thật, vẽ thành cột mưa, kèm nhiệt độ cao nhất và chấm mùa khô/mưa.
  - Mục giao thông và các địa điểm cùng `region`.
  - Cuối trang có 更新日 và 出典.
- **`/courses/`** dùng thẻ lớn. **`/courses/[slug]/`** gồm hộp chi phí, phần tổng quan và timeline theo ngày (giờ, điểm, link tới spot nếu tồn tại, ghi chú, chi phí, "移動 · Grab · 15分").
- **`/about/`**, **`404`** (kính strong và gạch bông, có link về trang chủ và danh sách).
- Ngôn ngữ vi/en: mọi link được gắn tiền tố ngôn ngữ, và có ghi chú `common.untranslated`.
- JS inline mỗi trang khoảng 1–1.5KB gzip (dưới 50KB rất nhiều). Không có chuỗi UI nào hardcode, chỉ dùng `t()` và nội dung từ collection.

## Chưa xong / giới hạn

- Chưa có trang danh sách "お気に入り" (yêu thích mới chỉ lưu cục bộ).
- `/about/` chỉ ghép từ các key có sẵn; cần thêm key nội dung (CR-A1).
- Hero đang dùng chip `light` (không blur, nền tối 45%) để giữ ≤ 6 phần tử kính blur.
- Chưa kiểm tra trên thiết bị thật, cũng chưa chạy Lighthouse; C sẽ phụ trách test e2e và LHCI.

## Change request

Xem `docs/change-requests/agent-A.md`:

- CR-A1: các key i18n còn thiếu.
- CR-A2: `.glass` ghi đè `absolute`, nên bộ đếm ở `/dev/glass` bị lệch.
- CR-A3: `.tile-pattern` xóa mất nền kính.
- CR-A4: C cần đặt anchor `#converter` và `#<guide-id>` trên `/guide/`.

## Ghi chú cho Integrator

- Helper dùng chung của A nằm ở `src/components/spot/spot-utils.ts`: sắp xếp (fixture xếp cuối), nhãn, `seasonText`, `mapLinks`.
- Lọc khu vực dùng `spot.area === area.region` (chưa lọc theo city).
- Ảnh OG của trang chi tiết/khu vực/khóa học: truyền `heroImage.src` (đường dẫn `/_astro/...`) vào prop `image`; SEO của C cần chuyển thành URL tuyệt đối.
- Khi B gộp nội dung thật, thứ tự hiển thị là: nội dung thật trước, fixture sau (trang chủ lấy tối đa 6 spot / 5 khu vực / 2 khóa học).
