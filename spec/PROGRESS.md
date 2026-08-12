# PROGRESS — trạng thái làm việc hiện tại

File này ghi tiến độ để session mới (khi session cũ hết context) đọc và
tiếp tục ngay, không phải dò lại từ đầu. Cập nhật ở mốc lớn — không cần
cho từng thay đổi nhỏ. Xem `@rules/session-continuity.md` (global).

## Đang làm

**v0.7 — CLI (`@rytek/cli`) — DONE.** Code xong, 4 lệnh kiểm tra xanh, đã
commit (`cd50ffd`) và push lên remote.

**v0.8 — Production hardening — mảng "security headers" DONE (chưa commit).**
`apps/api`:
- Helmet (`app.use(helmet(...))` trong `apps/api/src/main.ts`) — HSTS,
  X-Frame-Options, X-Content-Type-Options, CSP mặc định. CSP tắt khi
  `NODE_ENV !== "production"` vì Swagger UI (`/docs`) cần inline script/style
  và chỉ chạy ở dev; production giữ CSP mặc định (Swagger đã tắt ở đó).
- CORS: **không bật** — `app.enableCors()` không được gọi (giữ mặc định
  NestJS = tắt). Lý do: `apps/admin-web` gọi `apps/api` từ phía server
  (Server Component/Action đọc token từ cookie httpOnly), không có fetch
  trực tiếp từ browser JS tới `:4000` (xem comment trong
  `apps/admin-web/lib/api.ts`). Bật CORS whitelist origin lúc này là cấu
  hình cho use case chưa tồn tại — nếu sau này có client browser gọi thẳng
  API, quay lại bật `app.enableCors({ origin: [...] })` lúc đó.
- Rate limit: `@nestjs/throttler`, global 100 req/60s qua `APP_GUARD` trong
  `apps/api/src/app.module.ts`. `/health*` dùng `@SkipThrottle()`
  (`apps/api/src/modules/health/health.controller.ts`) để không chặn
  liveness/readiness probe. `POST /auth/login` siết riêng 5 req/60s qua
  `@Throttle()` (`apps/api/src/modules/auth/auth.controller.ts`) chống
  brute-force.
- Dependency mới: `helmet@^8.3.0`, `@nestjs/throttler@^6.5.0` trong
  `apps/api/package.json` — không có cách hợp lý làm đủ các header/rate
  limit này bằng 0 dependency; cả hai là chuẩn de-facto trong hệ NestJS/Express.
- Không thêm ADR: middleware chuẩn, không có tranh cãi thiết kế — quyết
  định CORS đã ghi rõ ở đây và comment trong `main.ts`.
- 4 lệnh kiểm tra (`lint`, `typecheck`, `test`, `build`) đều xanh.
- **Chưa commit** — chờ user duyệt.

## Việc còn lại

- [ ] v0.8 còn lại: backup/restore runbook, metrics/alerting/tracing, load
      test, deploy + rollback runbook — chưa làm.
- [ ] Chưa làm (ADR-0003 §5, không thuộc v0.7): publish
      `pnpm create rytek-cms` lên npm.
- [x] User đã xác nhận: giữ CORS tắt như hiện tại.

## Quyết định đã chốt liên quan

- ADR-0003: danh sách file copy = `git ls-files` (không viết lại exclude
  pattern song song với `.gitignore`); CLI chỉ sinh file + đổi tên + in
  hướng dẫn, không tự chạy lệnh nặng.
- `packages/cli` zero-dependency (đúng luật "không thêm dependency khi
  stdlib giải quyết được").
- Security headers v0.8: CORS giữ tắt (xem giải thích ở trên); helmet +
  throttler là dependency hợp lý (không có helper stdlib/đã cài thay thế
  được).
