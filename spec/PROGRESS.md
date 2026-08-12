# PROGRESS — trạng thái làm việc hiện tại

File này ghi tiến độ để session mới (khi session cũ hết context) đọc và
tiếp tục ngay, không phải dò lại từ đầu. Cập nhật ở mốc lớn — không cần
cho từng thay đổi nhỏ. Xem `@rules/session-continuity.md` (global).

## Đang làm

**v0.7 — CLI (`@rytek/cli`)** — code đã xong, 4 lệnh kiểm tra đã xanh, **vẫn CHƯA commit** (chờ user yêu cầu).

Working tree hiện tại (`git status --short`):
```
 M CLAUDE.md          # v0.7 CLI section + release note DONE + packages/ table
 M README.md          # section "Tao du an moi tu starter"
 M package.json        # script "cli", lint mo rong sang packages/
 M pnpm-lock.yaml
?? packages/           # packages/cli/{index.mjs,index.test.mjs,package.json,templates/}
?? spec/PROGRESS.md
?? spec/decisions/ADR-0003-cli-sinh-du-an-moi.md
```
(`.claude/skills/.DS_Store` đã xoá khỏi filesystem — không còn trong status.)

Đã xong theo ADR-0003:
- `pnpm cli create <path>` — sinh dự án mới từ `git ls-files` (chỉ file đã
  commit), đổi tên theo bảng `REWRITES` trong `packages/cli/index.mjs`,
  không tự chạy install/git/docker/db.
- `pnpm cli doctor` — kiểm Node/pnpm/Docker/đĩa/git.
- Test: `packages/cli/index.test.mjs`.

## Việc còn lại trước khi commit v0.7

- [x] Chạy `pnpm lint && pnpm typecheck && pnpm test && pnpm build` — đã chạy
      lại, cả 4 lệnh đều PASS, không phát sinh lỗi, không cần sửa gì.
- [x] Xoá `.claude/skills/.DS_Store` (rác macOS, không phải phần của thay
      đổi này) — đã xoá khỏi filesystem, không `git add`/commit.
- [ ] Sau khi xanh: hỏi user trước khi `git add` + commit (rule: chỉ commit
      khi được yêu cầu). **Sẵn sàng commit, đang chờ user xác nhận.**
- [ ] Chưa làm (ADR-0003 §5, không thuộc v0.7 lần này): publish
      `pnpm create rytek-cms` lên npm.

## Quyết định đã chốt liên quan

- ADR-0003: danh sách file copy = `git ls-files` (không viết lại exclude
  pattern song song với `.gitignore`); CLI chỉ sinh file + đổi tên + in
  hướng dẫn, không tự chạy lệnh nặng.
- `packages/cli` zero-dependency (đúng luật "không thêm dependency khi
  stdlib giải quyết được").

## Ngoài phạm vi v0.7 (không đụng vào trừ khi user yêu cầu)

- v0.8+ Production hardening (security headers, backup/restore runbook,
  metrics/alerting/tracing, load test, deploy runbook) — chưa bắt đầu.
