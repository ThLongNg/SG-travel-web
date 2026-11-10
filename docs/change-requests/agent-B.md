# Change requests — Agent B

## CR-B1: `/dev/glass` vẫn import ảnh fixture

- **File**: `src/pages/dev/glass.astro` (Lead → Integrator)
- **Lý do**: trang import trực tiếp `src/assets/content/fixture-spot-1.webp`, `fixture-spot-2.webp`, `fixture-area-1.webp`, `fixture-area-2.webp`, `fixture-course-1.webp`. B đã xóa mọi bản ghi fixture và `fixture-course-2.webp`, nhưng **giữ 5 ảnh này** để build không lỗi.
- **Đề xuất**: ở pha 2, Integrator đổi import trong `/dev/glass` sang ảnh thật theo slug, ví dụ:
  - `fixture-spot-1.webp` → `ben-thanh-market.webp`
  - `fixture-spot-2.webp` → `nguyen-hue-walking-street.webp`
  - `fixture-area-1.webp` → `area-hcmc-center.webp`
  - `fixture-area-2.webp` → `area-central-vietnam.webp`
  - `fixture-course-1.webp` → `course-hcmc-2n3d.webp`

  rồi xóa 5 file `fixture-*.webp`. `npm run check:content` hiện báo chúng ở mức cảnh báo.

## CR-B2: Liên kết spot ↔ area chi tiết hơn `region`

- **File**: `src/content.config.ts` (Lead)
- **Lý do**: theo CONTRACT, spot thuộc area khi `spot.area === area.region`. B có 3 area cùng `region: south` (`hcmc-center`, `cholon`, `hcmc-suburbs`), nên trang `/areas/cholon/` sẽ hiện cả 7 spot miền Nam. Lọc thêm theo `city` cũng không tách được trung tâm và Chợ Lớn (đều là `ホーチミン`).
- **Đề xuất**: thêm trường tùy chọn vào schema spots: `areaSlug: z.string().optional()` (id trong collection `areas`). Trang area: nếu spot có `areaSlug` thì so khớp theo nó, không thì rơi về `region`.
- **Giá trị B sẽ điền** (khi schema được duyệt):
  - `hcmc-center`: `ben-thanh-market`, `saigon-central-post-office`, `nguyen-hue-walking-street`, `landmark-81-skyview`
  - `cholon`: `binh-tay-market`
  - `hcmc-suburbs`: `cu-chi-tunnels`, `mekong-delta-my-tho-ben-tre`
  - `central-vietnam`: `hoi-an-ancient-town`
- **Tạm thời**: Agent A có thể dùng bảng trên (hard-code) hoặc chỉ lọc theo `region`.
