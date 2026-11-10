# Status — Agent B (Nội dung & dữ liệu)

Nhánh `agent-b/content`, ngày kiểm chứng: **2026-11-11**. Công cụ web: Firecrawl search/scrape (có dùng được).

## Đã xong

- **Xóa toàn bộ fixture** (10 bản ghi `fixture: true`) và `fixture-course-2.webp`. Giữ 5 ảnh `fixture-*.webp` vì `/dev/glass` (Lead) import trực tiếp → CR-B1.
- **Spots (8)**: `ben-thanh-market`, `saigon-central-post-office`, `nguyen-hue-walking-street`, `binh-tay-market`, `cu-chi-tunnels`, `landmark-81-skyview`, `mekong-delta-my-tho-ben-tre`, `hoi-an-ancient-town`.
- **Areas (4)**: `hcmc-center` (1区・3区), `cholon` (5区), `hcmc-suburbs`, `central-vietnam`. Khí hậu 12 tháng lấy từ bảng Wikipedia (nguồn VIBST/WMO) của TP.HCM và Đà Nẵng.
- **Courses (2)**: `hcmc-2n3d` (2泊3日 ホーチミン満喫), `hcmc-mekong-3n4d` (3泊4日 ホーチミン＋メコンデルタ).
- **Guides (10)**: visa, money, sim, grab, tip, safety, hygiene, power, weather, manners.
- **Phrases (40)**: 5 nhóm × 8 câu — あいさつ, 食事, 移動（タクシー・Grab）, 買い物・値段交渉, 緊急. Katakana theo giọng miền Nam; quy ước ghi ở `src/content/README.md`.
- **Ảnh placeholder theo slug** (22 file, tự sinh bằng `sharp`: gradient + chữ "PLACEHOLDER").
- **i18n**: dịch `vi.json`, `en.json` (đúng bộ key của `ja.json`, đã kiểm tra bằng script).
- **`scripts/check-content.mjs`**: liệt kê TODO / verified:false / thiếu nguồn / thiếu alt / file ảnh không tồn tại / fixture; exit 1 nếu còn fixture hoặc thiếu nguồn/alt/ảnh; `--strict` fail cả cảnh báo.
- **`CREDITS.md`**, **`src/content/README.md`**, change request `docs/change-requests/agent-B.md`.

## Kết quả kiểm tra

- `npm run build`: pass (68 trang).
- `npm run lint`: pass.
- `npm run check:content`: pass — 29 bản ghi, 0 lỗi, **24 chỗ `TODO: 要確認`**, **15 bản ghi `verified: false`**, 5 ảnh fixture (cảnh báo).

## Thông tin đã kiểm chứng (nguồn chính)

- Visa: miễn thị thực 45 ngày cho công dân Nhật, 15/3/2025–14/3/2028 (Nghị quyết 44/NQ-CP); điều kiện hộ chiếu còn ≥ 6 tháng + vé ra khỏi VN (外務省 安全対策基礎データ, ĐSQ VN tại Nhật). e-Visa tối đa 90 ngày, 25 USD / 50 USD (evisa.gov.vn).
- Khai báo tiền mặt > 5.000 USD / 15 triệu đồng; cấm thuốc lá điện tử/nung nóng từ 1/1/2025; số khẩn cấp 113/114/115; số TLSQ Nhật tại HCM (外務省).
- Phố cổ Hội An: vé 120.000đ / 80.000đ, miễn phí dưới 16 tuổi, hiệu lực tối đa 3 ngày, giờ phố đi bộ (thông báo 29/01/2026 của Trung tâm Bảo tồn Di sản Hội An); UNESCO.
- Điện 220V, ổ A/C (地球の歩き方). Khí hậu (Wikipedia, nguồn VIBST/WMO). Bến Tre cách HCM ~2 giờ xe (vietnam.travel).

## Danh sách còn 要確認 (cần người thật kiểm tra lại)

### Spots

| Bản ghi                       | Mục cần kiểm tra                                                                                                                                                          |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ben-thanh-market`            | Giờ mở cửa (BQL chợ báo kéo dài tới 22h — ngày đăng không rõ; giờ trong chợ / chợ đêm)                                                                                    |
| `saigon-central-post-office`  | Giờ mở cửa (các nguồn mâu thuẫn); tình trạng tu sửa Nhà thờ Đức Bà                                                                                                        |
| `nguyen-hue-walking-street`   | Khung giờ / ngày phố đi bộ cấm xe                                                                                                                                         |
| `binh-tay-market`             | Giờ mở cửa; "buổi sáng đông vui hơn"                                                                                                                                      |
| `cu-chi-tunnels`              | Giờ 7:00–17:00 và giá 135.000đ (35.000 + 100.000 từ 1/2/2026) — chỉ thấy qua trang thứ cấp, **chưa đọc được thông báo gốc** trên diadaocuchi.com.vn (timeout); trường bắn |
| `landmark-81-skyview`         | Giờ mở cửa và giá vé (các nguồn chênh lệch lớn, `priceVnd: null`)                                                                                                         |
| `mekong-delta-my-tho-ben-tre` | Tên tỉnh mới sau sáp nhập 2025 (Mỹ Tho → Đồng Tháp, Bến Tre → Vĩnh Long)                                                                                                  |
| Tất cả spot                   | `toilet` / `cardPayment` / `wifi` đang là `unknown`; **tọa độ là gần đúng**, cần đối chiếu Google Maps                                                                    |

### Areas / courses

- `hcmc-center`: cách gọi phường mới sau khi bỏ cấp quận (7/2025); nguồn metro/sân bay là trang thứ cấp.
- `hcmc-2n3d`, `hcmc-mekong-3n4d`: chi phí ước tính `estimatedCostJpy` (chưa có cơ sở số liệu); thời gian di chuyển chỉ là ước lượng.

### Guides

- `money`: địa điểm đổi tiền nên dùng.
- `sim`: quy định đăng ký SIM bằng hộ chiếu; mức phủ Wi-Fi.
- `tip`: nguồn tin cậy về văn hóa tip; mức tip tham khảo.
- `hygiene`: nguồn chính thức về nước máy (外務省 / FORTH 厚生労働省検疫所).
- `manners`: thêm nguồn (vd. vietnam.travel).

### Phrases

- `verified: true` cho phần tiếng Việt; katakana là cách đọc gần đúng — **nên nhờ người bản xứ miền Nam nghe lại**.

## Ảnh / video cần chuẩn bị

Kích thước gợi ý: ảnh spot 1600×1200 (4:3), area/course 1600×900 (16:9), WebP. Ghi nguồn + giấy phép vào `CREDITS.md`, giữ nguyên tên file.

| File                                 | Cảnh cần chụp / mua                                |
| ------------------------------------ | -------------------------------------------------- |
| `ben-thanh-market.webp`              | Cổng chính có tháp đồng hồ, ban ngày               |
| `ben-thanh-market-2.webp`            | Lối đi trong chợ: quầy cà phê, đồ khô, đồ lưu niệm |
| `saigon-central-post-office.webp`    | Mặt tiền vàng + đồng hồ                            |
| `saigon-central-post-office-2.webp`  | Sảnh mái vòm bên trong, bản đồ cổ                  |
| `nguyen-hue-walking-street.webp`     | Phố đi bộ về đêm, UBND TP chiếu sáng phía cuối     |
| `nguyen-hue-walking-street-2.webp`   | Người dân dạo phố / chung cư cà phê 42 Nguyễn Huệ  |
| `binh-tay-market.webp`               | Tháp đồng hồ và sân trong chợ Bình Tây             |
| `binh-tay-market-2.webp`             | Hàng khô chất cao trong chợ                        |
| `cu-chi-tunnels.webp`                | Lối xuống địa đạo giữa rừng                        |
| `cu-chi-tunnels-2.webp`              | Đường hầm bên trong (có đèn)                       |
| `landmark-81-skyview.webp`           | Toà Landmark 81 nhìn từ bờ sông Sài Gòn            |
| `landmark-81-skyview-2.webp`         | Cảnh đêm nhìn từ đài quan sát                      |
| `mekong-delta-my-tho-ben-tre.webp`   | Xuồng chèo trong rạch dừa nước                     |
| `mekong-delta-my-tho-ben-tre-2.webp` | Sông Tiền rộng / vườn trái cây                     |
| `hoi-an-ancient-town.webp`           | Phố cổ Hội An về đêm với đèn lồng                  |
| `hoi-an-ancient-town-2.webp`         | Chùa Cầu / dãy nhà tường vàng ban ngày             |
| `area-hcmc-center.webp`              | Toàn cảnh trung tâm Q1                             |
| `area-cholon.webp`                   | Phố Chợ Lớn, hội quán người Hoa                    |
| `area-hcmc-suburbs.webp`             | Cảnh sông nước miền Tây                            |
| `area-central-vietnam.webp`          | Hội An / Đà Nẵng                                   |
| `course-hcmc-2n3d.webp`              | Sài Gòn về đêm                                     |
| `course-hcmc-mekong-3n4d.webp`       | Xuồng trên sông Mekong                             |

### Video nền (`public/media/`, giữ nguyên tên file)

Đang là placeholder do Lead tự vẽ (ghi trong `CREDITS.md`). Kịch bản quay đề xuất cho bản thật:

- **Độ dài 8–15 giây, vòng lặp liền mạch, không âm thanh**: cảnh cuối khớp cảnh đầu (cùng góc máy cố định hoặc time-lapse), tránh vật thể đi ra khỏi khung đúng lúc cắt.
- **Cảnh Sài Gòn về đêm**, gợi ý (chọn 1, hoặc ghép 2–3 cảnh ngắn có cross-fade ở điểm lặp):
  1. Time-lapse dòng xe máy vệt đèn ở vòng xoay / đại lộ trung tâm, máy đặt cao.
  2. Phố đi bộ Nguyễn Huệ nhìn về UBND TP, người dạo phố chuyển động chậm.
  3. Sông Sài Gòn và toà Landmark 81 phản chiếu mặt nước, thuyền chạy chậm.
- Máy cố định hoặc gimbal rất chậm; phơi sáng đủ, tránh cháy sáng biển hiệu; vùng 1/3 dưới tối hơn để chữ kính dễ đọc (sẽ có scrim).
- Hai bản: dọc 720×1280 (≤ 2.5MB) và ngang 1920×1080 (≤ 5MB); MP4 H.264 + WebM; poster WebP lấy từ khung đầu.
- Nếu dùng stock (Pexels, Pixabay…): kiểm tra giấy phép, ghi tác giả + URL vào `CREDITS.md`. Không quay người nhận diện được ở cận cảnh khi chưa có phép.

## Change request

Xem `docs/change-requests/agent-B.md`:

- **CR-B1**: Integrator đổi import ảnh trong `src/pages/dev/glass.astro` sang ảnh theo slug, rồi xóa 5 file `fixture-*.webp`.
- **CR-B2**: thêm `areaSlug?: string` vào schema spots để tách các area cùng `region: south` (trung tâm / Chợ Lớn / ngoại ô). Có sẵn bảng mapping.

## Quyết định / rủi ro

- Giá trị `priceVnd: 0` dùng cho nơi miễn phí vào cửa (chợ, bưu điện, phố đi bộ) — `formatPrice` sẽ hiện 無料.
- `priceVnd: null` khi chưa chắc (Landmark 81) hoặc giá phụ thuộc tour (Mekong).
- Vì sáp nhập hành chính 7/2025, nội dung vẫn dùng 「1区」「5区」 (cách gọi quen thuộc) kèm ghi chú.
- Spot Hội An giữ `verified: true` dựa trên thông báo chính thức 01/2026; một trang thứ cấp nói có thay đổi phí từng điểm từ 10/8/2026 nhưng vé trọn gói vẫn 120.000đ — nên kiểm tra lại định kỳ.
