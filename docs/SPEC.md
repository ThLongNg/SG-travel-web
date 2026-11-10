# SPEC — Website du lịch Việt Nam cho người Nhật ("Saigon × Liquid Glass")

> Đây là bản đặc tả chung. Đặt file này tại `docs/SPEC.md` trong repo. Mọi agent đều phải đọc file này trước khi làm việc.
> Kế hoạch chia việc nằm ở `docs/PLAN.md`, còn prompt riêng cho từng agent nằm ở thư mục `prompts/`.

## Bối cảnh

Hãy xây dựng một website tĩnh giới thiệu các địa điểm du lịch Việt Nam, đối tượng là **khách du lịch người Nhật**. Website chỉ để giới thiệu, gần như không có backend. Ưu tiên tuyệt đối là:

1. **Giao diện đẹp, tinh tế, hợp gu người Nhật**: không trông như template.
2. **Chất lượng thông tin**: chính xác, chi tiết, thực dụng, viết bằng tiếng Nhật tự nhiên.

Ngôn ngữ mặc định của site là **tiếng Nhật**. Có thêm bản tiếng Việt và tiếng Anh (ưu tiên thấp hơn; được phép để trống nội dung và hiển thị bản tiếng Nhật kèm ghi chú).

## Công nghệ

- **Astro** (bản ổn định mới nhất), xuất ra site tĩnh hoàn toàn (`output: 'static'`).
- **TypeScript** ở chế độ strict.
- **Tailwind CSS** cho style, có định nghĩa design token (màu, font, khoảng cách) ở một chỗ.
- **Astro Content Collections** + Markdown/MDX để quản lý nội dung, schema validate bằng Zod.
- **Astro i18n routing**: `/` (ja), `/vi/`, `/en/`.
- Ảnh: dùng `astro:assets` để tối ưu (WebP/AVIF, lazy load, đúng kích thước).
- Bản đồ: nhúng Google Maps iframe hoặc Leaflet + OpenStreetMap, chỉ tải khi người dùng cuộn tới (lazy).
- JavaScript phía client ở mức tối thiểu: chỉ dùng Astro islands cho phần thực sự cần tương tác (bộ lọc, đổi tiền, sổ tay hội thoại).
- Triển khai lên Vercel hoặc Netlify ở dạng static.
- Không dùng database, không đăng nhập, không có server riêng.

## Tính năng

### 1. Trang chủ `/`

- Hero lớn với ảnh đẹp, câu khẩu hiệu tiếng Nhật ngắn gọn, ô tìm kiếm.
- Chip lọc nhanh theo chủ đề: ビーチ / グルメ / 世界遺産 / 自然 / ショッピング / 街歩き.
- Các mục: 人気の観光地, エリアから探す (Bắc / Trung / Nam), モデルコース, 旅の準備 (thông tin thực dụng).
- Trang chủ không được dài lê thê: mỗi mục tối đa 4–6 thẻ, kèm link "もっと見る".

### 2. Danh sách địa điểm `/spots/`

- Lưới thẻ địa điểm, mỗi thẻ gồm ảnh, tên tiếng Nhật, tên tiếng Việt, khu vực và 2–3 tag.
- Lọc phía client theo khu vực, chủ đề và mùa đẹp nhất; thêm ô tìm kiếm theo từ khóa (tìm được cả katakana và hiragana).
- Không cần reload; trạng thái lọc phản ánh lên URL query.

### 3. Chi tiết địa điểm `/spots/[slug]/`

Đây là trang quan trọng nhất. Cấu trúc:

- Ảnh lớn + gallery.
- Tên: tiếng Nhật (katakana), tên gốc tiếng Việt có dấu, kèm cách đọc.
- Tóm tắt 2–3 câu: "どんな場所？".
- **Hộp thông tin nhanh (基本情報)**: khu vực, giờ mở cửa, giá vé (VND và JPY quy đổi gần đúng), thời gian tham quan nên dành, mùa đẹp nhất, cách đi từ thành phố/sân bay gần nhất, có nhà vệ sinh không, có trả bằng thẻ không, có Wi-Fi không.
- Mục 見どころ (điểm nhấn), 楽しみ方 (cách tận hưởng), 日本人旅行者へのヒント (mẹo riêng cho người Nhật), 注意点 (lưu ý an toàn, lừa đảo thường gặp, trang phục, thời tiết).
- Bản đồ.
- Địa điểm lân cận và mô hình lịch trình có chứa địa điểm này.
- Cuối trang: **情報更新日** (ngày cập nhật) và **出典** (nguồn tham khảo).

### 4. Khu vực `/areas/[area]/`

Tổng quan từng khu vực (miền Bắc / Trung / Nam, hoặc theo thành phố): khí hậu theo tháng, cách di chuyển và danh sách địa điểm.

### 5. Lịch trình mẫu `/courses/` và `/courses/[slug]/`

Ví dụ: 3泊4日 ダナン・ホイアン, 4泊5日 ハノイ・ハロン湾. Hiển thị dạng timeline theo ngày và giờ, có thời gian di chuyển giữa các điểm và chi phí ước tính.

### 6. Thông tin hữu ích `/guide/`

Visa, tiền tệ và đổi tiền, SIM/eSIM, Grab, tiền tip, an toàn, vệ sinh và nước uống, điện áp và ổ cắm, thời tiết theo mùa, ứng xử văn hóa. Thêm **công cụ quy đổi VND ↔ JPY** chạy hoàn toàn ở client: tỷ giá đặt trong file config, hiển thị rõ ngày của tỷ giá.

### 7. Sổ tay hội thoại `/phrases/` (指さし会話帳)

- Các câu tiếng Việt thông dụng, chia theo tình huống: chào hỏi, gọi món, taxi/Grab, mua sắm và trả giá, hỏi đường, khẩn cấp.
- Mỗi câu gồm: tiếng Nhật, tiếng Việt có dấu, cách đọc bằng katakana và nút **phát âm** bằng Web Speech API (`speechSynthesis`, giọng `vi-VN`), không cần backend.
- Có **chế độ "見せる"**: hiển thị câu tiếng Việt cỡ chữ thật lớn để đưa màn hình cho người Việt đọc.
- Dữ liệu câu lưu trong file JSON hoặc YAML trong content.

### 8. Liên hệ `/contact/`

Không cần backend: dùng form gửi qua dịch vụ bên ngoài (Formspree hoặc Netlify Forms, endpoint đặt trong biến môi trường) và/hoặc nút link tới LINE Official Account. Chừa sẵn chỗ để điền ID.

### 9. Các trang khác

About, 404 (vẫn đẹp và có link quay về), chính sách bảo mật.

## Mô hình dữ liệu (Content Collections)

Định nghĩa schema Zod chặt chẽ. Thiếu trường bắt buộc thì build phải lỗi. Ví dụ collection `spots`:

```ts
{
  slug, nameJa, nameVi, reading,          // tên & cách đọc
  area: 'north' | 'central' | 'south',
  city, themes: string[], bestSeasons: number[], // tháng 1–12
  summary, heroImage, gallery: image[],
  info: {
    hours, priceVnd, priceNote,
    durationMinutes, access,
    toilet: boolean | 'unknown',
    cardPayment: boolean | 'unknown',
    wifi: boolean | 'unknown',
  },
  coordinates: { lat, lng },
  tipsForJapanese: string[], cautions: string[],
  nearby: slug[],
  sources: { title, url }[],
  lastVerified: date,
  verified: boolean,       // false = còn thông tin chưa xác minh
}
```

Làm tương tự cho `areas`, `courses`, `guides` và `phrases`.

## Quy tắc về chất lượng thông tin (rất quan trọng)

- **Không được bịa thông tin.** Giờ mở cửa, giá vé, số liệu… nếu không chắc chắn thì ghi `TODO: 要確認` và đặt `verified: false`. Trang có `verified: false` hiển thị một nhãn nhỏ "情報確認中" trong môi trường dev, và có script `npm run check:content` liệt kê mọi chỗ còn TODO.
- Văn phong tiếng Nhật: thể です・ます, tự nhiên như tạp chí du lịch Nhật, câu ngắn, tránh giọng văn dịch máy. Tên địa danh dùng katakana phổ biến (ホイアン, ハロン湾, ダナン…), lần đầu xuất hiện thì kèm tên tiếng Việt.
- Đơn vị và định dạng theo thói quen Nhật: ngày dạng `2026年11月11日`, giờ 24h, giá kèm `約〇〇円`.
- Mỗi địa điểm phải có ít nhất 1 nguồn tham khảo, ưu tiên nguồn chính thức.
- Ảnh: ở giai đoạn đầu dùng placeholder có ghi chú rõ; không dùng ảnh không rõ bản quyền. Tạo file `CREDITS.md` để ghi nguồn ảnh.

## Định hướng thiết kế: "Saigon × Liquid Glass"

Toàn bộ giao diện phải mang **hơi thở của Thành phố Hồ Chí Minh (Sài Gòn)**: năng động, rực rỡ về đêm, hiện đại đan xen cổ kính. Phong cách UI là **liquid glass giống Apple** (iOS 26 / macOS Tahoe): các lớp kính trong suốt nổi trên nền video thành phố.

Tham khảo bố cục (không phải phong cách màu) trong file Figma: https://www.figma.com/design/dwIu3KwSq9CHbWiqNSdYry. Phần cấu trúc màn hình (trang chủ, chi tiết địa điểm, sổ tay hội thoại, chế độ 見せる) giữ nguyên tinh thần; phần màu sắc và chất liệu thì làm theo mục này.

### 1. Video nền TPHCM

- **Trang chủ**: hero toàn màn hình (`100dvh`) là một **video ngắn về TPHCM chạy lặp**, ví dụ phố đi bộ Nguyễn Huệ, sông Sài Gòn về đêm, dòng xe máy vệt đèn, toà Landmark 81, chợ Bến Thành. Tiêu đề, ô tìm kiếm và nút đều là các lớp kính nổi trên video.
- **Các trang khác**: không phát video (để tiết kiệm pin và dữ liệu). Dùng ảnh poster của video làm **nền cố định, làm mờ mạnh** (blur 40–60px, tối đi một chút). Nội dung là các tấm kính trên nền đó, để cả site vẫn đồng nhất cảm giác Sài Gòn.
- Yêu cầu kỹ thuật cho video:
  - Thẻ `<video autoplay muted loop playsinline preload="metadata" poster="...">` (bắt buộc có `muted` + `playsinline` để tự phát trên iPhone).
  - Thời lượng 8–15 giây, cắt sao cho vòng lặp liền mạch; không có âm thanh.
  - Hai bản: mobile dọc 720×1280 (mục tiêu ≤ 2.5MB) và desktop ngang 1920×1080 (≤ 5MB). Chọn bằng `<source media="...">` hoặc JS theo hướng màn hình.
  - Định dạng: MP4 (H.264) cho mọi trình duyệt + WebM (VP9/AV1) cho trình duyệt hỗ trợ.
  - Poster là ảnh WebP/AVIF tối ưu và được preload, để LCP không phụ thuộc vào video.
  - **Chỉ hiển thị poster, không tải video** khi: bật `prefers-reduced-motion`, bật chế độ tiết kiệm dữ liệu (`navigator.connection.saveData`) hoặc mạng yếu (`effectiveType` là 2g/3g).
  - Tự tạm dừng video khi cuộn khỏi màn hình (IntersectionObserver) hoặc khi tab bị ẩn (`visibilitychange`).
  - Có nút nhỏ dạng kính để **tạm dừng/phát video** (yêu cầu tiếp cận theo WCAG 2.2.2).
  - Phủ một lớp scrim (gradient tối từ dưới lên) lên video để chữ luôn đủ tương phản.
- Nguồn video: tôi sẽ tự cung cấp. Trong lúc chờ, hãy dùng video/ảnh placeholder đặt tại `public/media/hero-saigon.*`, ghi rõ trong README cách thay. Nếu dùng video stock (Pexels, Pixabay…) thì phải kiểm tra giấy phép và ghi nguồn vào `CREDITS.md`.

### 2. Liquid glass

Tạo một bộ component kính dùng chung, không viết lặp CSS ở từng chỗ: `GlassPanel`, `GlassButton`, `GlassChip`, `GlassSearch`, `GlassTabBar`, `GlassSheet` (bottom sheet).

- Công thức kính cơ bản (định nghĩa thành CSS variables/utility trong Tailwind):
  - Nền bán trong suốt: `rgba(255,255,255,0.10–0.18)` trên nền tối.
  - `backdrop-filter: blur(24px) saturate(180%)`, **kèm `-webkit-backdrop-filter`** cho Safari.
  - Viền sáng 1px `rgba(255,255,255,0.35)`, thêm highlight phía trên bằng `inset box-shadow`.
  - Lớp "phản chiếu" (specular) bằng pseudo-element gradient chéo mờ ở cạnh trên-trái.
  - Bóng đổ mềm, rất nhẹ.
  - Bo góc lớn: tấm kính 24–28px, nút và chip dạng viên thuốc (pill).
- Hiệu ứng khúc xạ thật (refraction, dùng SVG `feDisplacementMap`) **chỉ là nâng cấp tùy chọn** cho trình duyệt Chromium. Safari không hỗ trợ kiểu này, nên trên iPhone phải dùng bản blur cơ bản và vẫn phải đẹp.
- Fallback: `@supports not (backdrop-filter: blur(1px))` thì dùng nền kính đục hơn (opacity ~0.85).
- Tương tác: khi chạm, nút thu nhỏ còn 0.97 và highlight sáng lên; chuyển động mượt bằng spring/ease-out ~200ms; tôn trọng `prefers-reduced-motion`.
- **Thanh tab dưới dạng viên kính nổi** (giống tab bar iOS 26): cách mép dưới một khoảng, có tính `safe-area-inset-bottom`, tab đang chọn có "giọt kính" sáng hơn trượt theo.
- Header: trong suốt khi ở trên hero, chuyển thành thanh kính khi cuộn xuống.
- **Độ đọc là trên hết**: chữ trên kính phải đạt tương phản WCAG AA. Nếu nền video quá sáng ở một vùng thì tăng độ tối của tấm kính hoặc scrim, chứ không hy sinh khả năng đọc. Đoạn văn dài (mô tả địa điểm, lưu ý) đặt trên tấm kính đục hơn (opacity cao) để đọc thoải mái.
- **Hiệu năng trên mobile**: `backdrop-filter` rất tốn GPU. Không quá ~6 phần tử kính cùng hiển thị trên màn hình; danh sách dài (thẻ địa điểm, thẻ câu hội thoại) dùng kính "nhẹ" (blur nhỏ hoặc nền bán trong suốt không blur). Kiểm tra cuộn phải mượt 60fps trên iPhone tầm trung.

### 3. Màu sắc và chi tiết mang chất Sài Gòn

- Bảng màu lấy từ Sài Gòn về đêm:
  - Nền chủ đạo xanh đêm sâu, ví dụ `#0B1B2B`.
  - Màu nhấn chính là vàng hổ phách của đèn đường, ví dụ `#F2A541`.
  - Màu phụ là xanh sông Sài Gòn, ví dụ `#2EC4B6`.
  - Tối đa 2 màu nhấn; tất cả định nghĩa thành CSS variables.
- Họa tiết: dùng **gạch bông** (gạch hoa nhà Sài Gòn xưa) làm texture rất mờ cho footer, đường phân cách và trạng thái trống. Vẽ bằng SVG pattern nhẹ, không dùng ảnh nặng.
- Có thể dùng chữ "Sài Gòn" có dấu tiếng Việt như một chi tiết trang trí nhỏ cạnh tiêu đề tiếng Nhật.
- Font: **Noto Sans JP** cho thân bài, **Noto Serif JP** (hoặc Shippori Mincho) cho tiêu đề lớn, Inter cho chữ Latin/tiếng Việt. Chỉ tải các weight cần dùng; `font-display: swap`. Thân bài cỡ chữ ≥ 16px, `line-height` khoảng 1.8 cho tiếng Nhật.
- Giữ chi tiết kiểu tạp chí Nhật: chữ dọc (`writing-mode: vertical-rl`) cho tiêu đề phụ ở hero, số thứ tự 01/02/03 cho các mục.
- Câu khẩu hiệu tham khảo ở hero: 「活気と夜景の街、ホーチミンへ。」

### 4. Quy trình duyệt

**Trước khi code giao diện**, hãy:

1. Mô tả ngắn hướng thiết kế: màu, font, công thức kính, bố cục trang chủ / chi tiết / sổ tay.
2. Làm một trang demo `/dev/glass` chứa video nền và tất cả component kính, để tôi xem trên điện thoại thật và duyệt trước.

## Mobile web là ưu tiên số 1

Phần lớn khách Nhật sẽ xem trên điện thoại, kể cả khi đang đi du lịch ngoài đường (mạng 4G chập chờn, một tay cầm máy, đứng dưới nắng). Mọi quyết định thiết kế đều bắt đầu từ màn hình **375×667px** (iPhone SE) và **390×844px** (iPhone 14/15). Desktop chỉ là bản mở rộng.

- **Thiết kế mobile trước**: viết CSS mobile-first (base = mobile, `md:`/`lg:` để mở rộng). Mỗi trang đều phải được mô tả và kiểm tra ở bố cục mobile trước.
- **Điều hướng bằng một tay**:
  - Có thanh **bottom navigation** cố định với 4–5 mục: ホーム / 観光地 / コース / 会話帳 / お役立ち.
  - Header trên cùng gọn, tự ẩn khi cuộn xuống và hiện lại khi cuộn lên.
  - Nút hành động chính nằm trong vùng ngón cái chạm tới (nửa dưới màn hình).
- **Vùng chạm**: tối thiểu 44×44px, khoảng cách giữa các nút ≥ 8px. Không có thao tác nào chỉ dùng được bằng hover.
- **Safe area**: dùng `env(safe-area-inset-*)` cho notch và thanh home của iPhone; `viewport-fit=cover`. Dùng `100dvh` thay cho `100vh`.
- **Chữ dễ đọc ngoài trời**: thân bài 16–17px, độ tương phản cao. Không đặt chữ mỏng trên ảnh mà không có lớp phủ.
- **Trang chi tiết địa điểm trên mobile**:
  - Hộp 基本情報 hiển thị ngay dưới ảnh, dạng lưới icon gọn để lướt nhanh.
  - Các mục dài dùng accordion.
  - Nút "地図で開く" mở thẳng ứng dụng Google Maps/Apple Maps; có nút "共有" dùng Web Share API.
- **Bộ lọc trên mobile**: mở dạng bottom sheet, không chiếm màn hình chính. Chip lọc cuộn ngang được.
- **Gallery ảnh**: vuốt ngang (CSS scroll-snap), chạm để xem toàn màn hình.
- **Sổ tay hội thoại**: chế độ "見せる" hiển thị toàn màn hình, chữ rất lớn, giữ màn hình sáng (Wake Lock API nếu có).
- **Hiệu năng trên mạng yếu**:
  - Ngân sách: JS ban đầu < 50KB (gzip), LCP < 2.5s trên 4G chậm.
  - Ảnh có `srcset` theo kích thước mobile; ảnh hero được ưu tiên tải trước, các ảnh còn lại lazy load.
  - Font tiếng Nhật được subset hoặc tải theo `unicode-range`.
- **PWA nhẹ**: có `manifest.webmanifest`, icon, theme-color, và service worker cache các trang đã xem cùng trang 会話帳 để **dùng được khi offline**.
- **Kiểm thử**:
  - Kiểm tra bằng Playwright với các viewport iPhone SE, iPhone 15 và Pixel 7; chụp screenshot từng trang chính để tôi xem.
  - Kiểm tra trên Safari iOS (WebKit), vì đây là trình duyệt chủ yếu của người Nhật.

## Yêu cầu kỹ thuật và chất lượng

- Lighthouse (mobile): Performance, Accessibility, Best Practices và SEO đều ≥ 95.
- Đạt chuẩn WCAG 2.1 AA: tương phản màu, alt text bằng tiếng Nhật, điều hướng được bằng bàn phím.
- SEO: `lang="ja"`, thẻ `hreflang`, sitemap, robots.txt, OG image cho từng trang; JSON-LD `TouristAttraction` cho trang địa điểm và `BreadcrumbList`.
- Cấu trúc component rõ ràng (`Header`, `Footer`, `SpotCard`, `InfoBox`, `MapEmbed`, `PhraseCard`, `Timeline`…). Toàn bộ chuỗi UI nằm trong file i18n, không hardcode trong component.
- Có ESLint + Prettier; `npm run build` không được có lỗi hay cảnh báo.
- README bằng tiếng Việt, hướng dẫn: chạy local, **cách thêm một địa điểm mới** (copy template), cách cập nhật tỷ giá, cách deploy.
