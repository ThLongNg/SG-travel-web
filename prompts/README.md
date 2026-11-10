# Bộ prompt — Web du lịch cho người Nhật (Saigon × Liquid Glass)

## Các file

| File | Dùng cho | Khi nào |
|---|---|---|
| `SPEC.md` | Đặc tả chung (tính năng, nội dung, thiết kế, mobile, chất lượng) | Mọi agent đều đọc |
| `PLAN.md` | Kế hoạch 3 pha + **bảng sở hữu file** để các agent không giẫm chân nhau | Mọi agent đều đọc |
| `0-lead-foundation.md` | Pha 0: dựng khung, token, component kính, schema, hợp đồng | Chạy trước, 1 agent |
| `A-ui-pages.md` | Agent A: video hero, trang chủ, chi tiết/danh sách địa điểm, khu vực, lịch trình | Pha 1, song song |
| `B-content.md` | Agent B: nội dung tiếng Nhật đã kiểm chứng, bản dịch, ảnh/video, script kiểm tra | Pha 1, song song |
| `C-features-quality.md` | Agent C: sổ tay hội thoại, đổi tiền, liên hệ, SEO, PWA, encode video, test/CI | Pha 1, song song |
| `9-integrate.md` | Pha 2: gộp nhánh, sửa lỗi, Lighthouse, README | Chạy cuối, 1 agent |
| `ORCHESTRATOR.md` | Một prompt để Claude Code tự điều phối cả 3 pha | Cách 1 bên dưới |

## Chuẩn bị chung

```bash
mkdir saigon-travel && cd saigon-travel
mkdir prompts && cp /đường-dẫn/prompts/*.md prompts/
```

## Cách 1 — Nhanh và ít thao tác nhất: một phiên Claude Code tự chia việc

```bash
claude
```

Dán nội dung `ORCHESTRATOR.md`. Claude Code sẽ làm pha 0 rồi dừng cho bạn duyệt. Sau khi bạn gõ **"chạy song song"**, nó tự tạo 3 subagent, mỗi subagent làm trong một git worktree riêng. Cuối cùng nó tự gộp và báo cáo.

## Cách 2 — Dùng nhiều công cụ AI khác nhau trên máy (mỗi agent một terminal)

Các prompt A/B/C được viết trung lập, nên chạy được trong bất kỳ AI coding agent nào đọc được file trong repo: Claude Code, Codex CLI, Gemini CLI, Cursor Agent…

1. Mở `claude` và dán: `Hãy thực hiện prompts/0-lead-foundation.md`. Duyệt `/dev/glass`.
2. Tạo 3 worktree từ các nhánh mà pha 0 đã tạo:
   ```bash
   git worktree add ../wt-a agent-a/ui
   git worktree add ../wt-b agent-b/content
   git worktree add ../wt-c agent-c/features
   (cd ../wt-a && npm install) & (cd ../wt-b && npm install) & (cd ../wt-c && npm install) & wait
   ```
3. Mở 3 terminal, mỗi terminal `cd` vào một worktree, chạy một AI agent và dán câu tương ứng:
   - `../wt-a`: "Hãy thực hiện prompts/A-ui-pages.md"
   - `../wt-b`: "Hãy thực hiện prompts/B-content.md". **Agent này cần tìm kiếm web để kiểm chứng thông tin**, nên dùng công cụ có quyền truy cập web.
   - `../wt-c`: "Hãy thực hiện prompts/C-features-quality.md"
4. Khi cả 3 xong, quay lại thư mục chính, mở `claude` và dán: "Hãy thực hiện prompts/9-integrate.md".

## Mẹo để chạy nhanh

- Pha 0 là nút thắt duy nhất. Nếu muốn nhanh hơn, hãy bỏ bước duyệt `/dev/glass` (nói "bỏ qua duyệt"), nhưng bạn sẽ phải chỉnh giao diện kính sau khi gộp.
- Agent B tốn thời gian nhất vì phải kiểm chứng thông tin. Hãy giao B cho công cụ mạnh nhất về tìm kiếm web.
- Nếu một agent bị kẹt vì thiếu thứ thuộc agent khác, nó sẽ ghi change request rồi làm tiếp. Integrator sẽ xử lý ở pha 2, nên **không cần dừng các agent khác**.
- Không để 2 agent mở cùng một worktree.
