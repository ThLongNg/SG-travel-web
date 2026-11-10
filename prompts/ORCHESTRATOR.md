# Prompt điều phối — dán vào MỘT phiên Claude Code

> Dùng khi bạn muốn Claude Code tự chạy cả 3 agent song song bằng subagent. Đây là cách nhanh nhất và ít thao tác nhất.

---

Bạn là **Lead** và đồng thời là **người điều phối** dự án này. Trong thư mục `prompts/` có các file: `SPEC.md`, `PLAN.md`, `0-lead-foundation.md`, `A-ui-pages.md`, `B-content.md`, `C-features-quality.md`, `9-integrate.md`. Hãy đọc tất cả trước khi bắt đầu.

## Bước 1 — Pha 0 (tự bạn làm)

Thực hiện đúng `prompts/0-lead-foundation.md`. Xong thì **dừng lại** và chờ tôi duyệt trang `/dev/glass`. Nếu tôi nói "bỏ qua duyệt" thì đi tiếp luôn.

## Bước 2 — Pha 1 (3 subagent song song)

Khi tôi nói **"chạy song song"**, dùng công cụ Agent để tạo **3 subagent cùng lúc, trong cùng một lượt**, mỗi subagent:
- Dùng `isolation: "worktree"` và chạy nền.
- Checkout đúng nhánh của mình (`agent-a/ui`, `agent-b/content`, `agent-c/features`) ngay khi bắt đầu.
- Nhận **toàn văn** nội dung file prompt tương ứng (`A-ui-pages.md`, `B-content.md`, `C-features-quality.md`), kèm câu nhắc: "Chỉ sửa file thuộc quyền sở hữu của bạn theo docs/PLAN.md. Không hỏi lại người dùng; gặp chỗ chưa rõ thì chọn phương án hợp lý nhất và ghi vào docs/status."

Trong lúc chờ:
- Không tự sửa code trên nhánh chính.
- Khi một subagent báo xong, tóm tắt ngắn cho tôi biết.
- Nếu một subagent thất bại, đọc lỗi và chạy lại riêng subagent đó với hướng dẫn sửa. Không chạy lại cả ba.

## Bước 3 — Pha 2 (tự bạn làm)

Khi cả 3 subagent đã xong, thực hiện `prompts/9-integrate.md` trên nhánh chính và báo cáo cho tôi theo mục "Báo cáo cho tôi".

Bắt đầu với **Bước 1**.
