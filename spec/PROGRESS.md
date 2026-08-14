# PROGRESS — trạng thái làm việc hiện tại

File này ghi tiến độ để session mới (khi session cũ hết context) đọc và
tiếp tục ngay, không phải dò lại từ đầu. Cập nhật ở mốc lớn — không cần
cho từng thay đổi nhỏ. Xem `@rules/session-continuity.md` (global).

## Đang làm

**v0.7 — CLI (`@rytek/cli`) — DONE.** Code xong, 4 lệnh kiểm tra xanh, đã
commit (`cd50ffd`) và push lên remote.

**v0.8 — Production hardening — mảng "security headers" DONE, đã commit
(`2944ff4`) và push.**
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
- Đã commit (`2944ff4`) và push.

**v0.8 — mảng "backup/restore runbook" DONE, đã commit (`b564977`) và push.**
- `scripts/db-backup.sh`: `pg_dump -Fc` (custom format, nén sẵn + chọn bảng
  khi restore), đọc `DATABASE_URL` từ env hoặc fallback `apps/api/.env`.
  Output `backups/<db>_<timestamp>.dump` (`backups/` đã thêm vào
  `.gitignore`, không commit file backup).
- `scripts/db-restore.sh <file.dump>`: `pg_restore --clean --if-exists`,
  bắt buộc gõ đúng tên database để xác nhận trước khi ghi đè — không âm
  thầm drop data.
- `docs/runbooks/backup-restore.md`: khi nào backup, cách backup/restore
  thủ công, cách verify (`\dt` + count row + thử chạy app), gợi ý retention
  đơn giản (giữ 7 bản gần nhất), lý do không tự động hoá cron/không tích
  hợp cloud storage lúc này (ghi trong chính runbook, không tạo ADR riêng
  — không phải quyết định kiến trúc lớn có tranh cãi).
- Đã test thực tế: backup DB dev (`cms_starter`) qua Postgres đang chạy
  sẵn ở :5432, restore vào DB tạm `cms_starter_verify`, verify `\dt` +
  `SELECT count(*) FROM "User"` đúng, sau đó dọn DB tạm + file backup test.
- Không tự động hoá cron/systemd — user đã xác nhận: chạy thủ công trước,
  chưa cần cron.
- 4 lệnh kiểm tra (`lint`, `typecheck`, `test`, `build`) đều xanh.
- **Chưa commit** — chờ user duyệt.

**v0.8 — mảng "metrics" DONE (alerting + tracing cố ý hoãn). Chưa commit.**
- `apps/api/src/common/metrics.ts`: `prom-client` registry riêng +
  `collectDefaultMetrics()` (CPU/heap/event loop/GC) + 1 histogram
  `http_request_duration_seconds{method,route,status}`. `_count` của histogram
  đã là request count nên **không** thêm Counter riêng.
- Middleware Express (`app.use(metrics)` trong `main.ts`, ngay sau `logging`)
  chứ **không** dùng Nest interceptor: interceptor chạy sau guard nên sẽ bỏ sót
  429 (Throttler), 401 (JwtAuthGuard) và toàn bộ 404.
- Label `route` = `req.route.path` (path ĐÃ ĐĂNG KÝ, vd `/products/:id`);
  không khớp route nào → `"unknown"`. Dán URL thật vào label = nổ cardinality.
  Đã verify express 5 set đúng `req.route.path` bằng script rời (trả
  `["/products/:id","unknown"]`), và có test khoá chỗ này
  (`apps/api/src/common/metrics.test.ts`).
- `GET /metrics` (`apps/api/src/modules/metrics/`): **không auth** (scraper
  không cầm token — chặn ở tầng mạng, không publish ra internet) +
  `@SkipThrottle()` giống `/health*`.
- Dependency mới: `prom-client@^15.1.3` (+3 transitive: `tdigest`, `bintrees`,
  `@opentelemetry/api` — bản API rỗng, không kéo SDK).
- **Không làm tracing (OTel)** lúc này: chưa có nơi nhận trace, SDK bắt buộc
  init trước mọi import (đụng ràng buộc thứ tự import đã có ở `main.ts`), và
  thêm sau chỉ là 1 file + 1 dòng import — hoãn không đắt. Ngược lại **format
  metrics mới là thứ bị khoá** nếu chọn sai nên dồn công vào đó.
- **Không làm alerting**, không dựng Prometheus/Grafana container: chưa chốt
  hạ tầng deploy nên chưa có backend nhận số liệu, chưa có kênh nhận alert.
- ADR: `spec/decisions/ADR-0004-metrics-prometheus-format.md`.
  `CLAUDE.md` cập nhật: Backend Rules (mục Metrics + `/metrics` vào danh sách
  route không cần auth) và dòng v0.8 của Release Process.
- 4 lệnh kiểm tra (`lint`, `typecheck`, `test`, `build`) đều xanh.
- **Chưa verify endpoint bằng cách chạy app** (luật global: không tự start
  server). User verify bằng: `pnpm dev:api` rồi
  `curl -s localhost:4000/metrics | head -30`.

**v0.8 — mảng "load test" — DONE, có baseline thật. Chưa commit.**
- `scripts/load-test.mjs`: dùng `autocannon` (Node API, không cần binary
  ngoài, 1 devDependency npm — ưu tiên hơn k6 vì hợp "0 cài thêm ngoài
  `pnpm install`" của monorepo pnpm). `TARGET=products` (mặc định, `GET
  /products` — endpoint đọc nhiều nhất trong CMS), `TARGET=health` (`GET
  /health/live`, đường nền không chạm DB/auth để so sánh), `TARGET=auth-throttle`
  (check riêng, ngắn — xác nhận `@Throttle 5/60s` của `POST /auth/login` hoạt
  động đúng, KHÔNG đo throughput vì route đó bị siết riêng).
- Quyết định login/throttle: **`POST /auth/login` không đưa vào bài đo
  throughput chính** — route bị `@Throttle({limit:5, ttl:60_000})` riêng nên
  load test bình thường chỉ đo được lúc nào rate limiter trả 429, không đo
  được business logic thật (bcrypt.compare/signToken), dễ gây hiểu nhầm "API
  chậm". Thay bằng `TARGET=auth-throttle` — 5 connections x 5s, chỉ để xác
  nhận throttle hoạt động đúng.
- Script tách hàm thuần `resolveTarget()` (chọn path + có cần auth không) ra
  khỏi phần gọi mạng, test bằng `scripts/load-test.test.mjs` (không gọi
  network — pattern giống `scripts/check-spec.mjs` +
  `scripts/check-spec.test.mjs`), tự nhặt bởi `node --test "scripts/*.test.mjs"`
  đã có sẵn trong `test` script gốc.
- Auth cho script: nhận `TOKEN` (JWT có sẵn) hoặc `EMAIL`+`PASSWORD` (script tự
  login **đúng một lần** trước khi bắt đầu vòng lặp tải, không lặp lại — tránh
  đụng throttle của `/auth/login`).
- Dependency mới: `autocannon@^8.0.0` (devDependency ở root `package.json`,
  vì đây là công cụ chạy bằng `node scripts/load-test.mjs` từ gốc repo, không
  gắn với app cụ thể nào — giống cách `check-spec.mjs` cũng ở root). Thêm
  script gốc `"load-test": "node scripts/load-test.mjs"`.
- `docs/runbooks/load-test.md`: cách chuẩn bị (`docker compose up -d`,
  `pnpm db:migrate`, `pnpm db:seed`, `pnpm dev:api` — **ghi rõ đây là bước
  USER TỰ CHẠY**), cách lấy JWT (script tự login hoặc `curl` thủ công), cách
  chạy script + đọc bảng kết quả của `autocannon` (latency p2.5/p50/p97.5/p99
  — có ghi chú autocannon không có sẵn p95, dùng p97.5 thay thế, đủ dùng),
  bảng ngưỡng tham khảo (chưa có baseline thật nên chỉ là gợi ý hợp lý, không
  phải số đo được), và lưu ý quan trọng: rate limiter global (100 req/60s,
  `ThrottlerModule` trong `app.module.ts`) sẽ tạo ra 429 xen giữa nếu tải vượt
  ngưỡng — đây là hành vi ĐÚNG chủ đích, không phải bug hay server quá tải.
- 4 lệnh kiểm tra (`lint`, `typecheck`, `test`, `build`) đều xanh. `pnpm test`
  chạy `scripts/load-test.test.mjs` (2 test, không gọi mạng).
- **User đã tự chạy `TARGET=products` (dev, local).** Kết quả: 8.538 req/s
  trung bình, latency avg 0.91ms (p99 2ms) — nhưng chỉ 100/170.751 request là
  `200`, còn lại `429`. Đây KHÔNG phải app chậm hay lỗi: global throttler
  (100 req/60s) hết hạn mức ngay trong ~1 giây đầu vì autocannon bắn
  ~8.500 req/s, nên 19s còn lại toàn bộ bị chặn ở tầng guard trước khi chạm
  `ProductController`/DB. Bài test này xác nhận **rate limiter enforce đúng
  ngưỡng 100 req/60s**, nhưng KHÔNG đo được khả năng chịu tải thật của
  query DB `/products` (vì hầu hết request chưa từng tới đó).
- User xác nhận: **đủ, không cần đo thêm** khả năng chịu tải không qua
  throttle (vd tăng limit tạm để đo capacity DB) — 100 req/60s được coi là
  trần thiết kế thật của app, không cần biết thêm phía sau nó chịu được
  bao nhiêu. Mảng load test coi như xong.
- **Chưa commit** — chờ user duyệt.

**v0.8 — mảng "deploy + rollback runbook" — DONE (mảng CUỐI của v0.8).
Chưa commit.**
- User chốt hạ tầng: **self-host 1 VPS đơn giản**, chưa chọn nhà cung cấp,
  không K8s/PaaS.
- **Quyết định: hướng A — KHÔNG Docker hoá app** (ADR-0005). Deploy =
  `git checkout <tag>` → `pnpm install --frozen-lockfile` → `pnpm db:generate`
  → `pnpm db:deploy` → `pnpm build` → `systemctl restart` → health check.
  Postgres/Redis giữ nguyên `docker-compose.yml` hiện có (Docker dùng đúng
  chỗ của nó: 2 stateful service chuẩn, không phải code thay đổi mỗi lần
  deploy). Process manager = **systemd** (native, 0 dependency, không PM2).
- Lý do loại Docker hoá app: repo chưa có Dockerfile nào; viết 2 Dockerfile
  multi-stage cho pnpm workspace (pnpm deploy/fetch, Prisma engine khớp
  glibc/musl, Next standalone) + `.dockerignore` + compose prod là ~150 dòng
  **không có lệnh nào trong repo kiểm tra được** (`lint/typecheck/test/build`
  không chạm tới), đổi lấy lợi ích của nhiều-máy trong khi chỉ có 1 VPS. Nếu
  sau này chuyển K8s/PaaS thì Dockerfile viết bây giờ cũng phải viết lại.
  Với 1 VPS, "artifact bất biến" thay bằng **git tag**.
- **Thay đổi code duy nhất: thêm script `db:deploy`** (root
  `package.json` → `pnpm --filter @rytek/api db:deploy`; `apps/api/package.json`
  → `prisma migrate deploy --schema ../../prisma/schema.prisma`, cùng pattern
  với `db:migrate` sẵn có nên Prisma CLI nạp đúng `apps/api/.env`). Lý do:
  `pnpm db:migrate` là `prisma migrate dev` — lệnh của máy dev, khi gặp drift
  **có thể reset toàn bộ DB**. Chạy nhầm trên production = mất dữ liệu. 1 dòng
  chặn đúng một lỗi thật.
- `docs/runbooks/deploy.md`: yêu cầu máy (2GB RAM + swap vì `next build` chạy
  ngay trên VPS, Node 22 giống CI), chuẩn bị lần đầu (clone, `.env` tạo từ
  `.env.example` — **không commit secret**, `JWT_SECRET` bằng `openssl rand`,
  compose production phải đổi password + bind `127.0.0.1` cho 5432/6379),
  2 unit file systemd (`rytek-api.service` chạy `node dist/main.js` với
  `WorkingDirectory=apps/api` để `process.loadEnvFile()` nạp đúng `.env`;
  `rytek-web.service` chạy `next start -p 3000`) — **để trong runbook dạng
  code block, không tạo thư mục `deploy/`** vì unit file phụ thuộc đường
  dẫn/user của từng máy.
- **TLS là BẮT BUỘC, không phải lời khuyên chung**: cookie phiên set
  `secure: NODE_ENV === "production"` (`apps/admin-web/app/login/actions.ts`)
  → chạy production trên `http://` thuần thì browser không lưu cookie →
  **không ai đăng nhập được**. Runbook nêu Caddy 3 dòng (tự Let's Encrypt),
  không viết nginx/certbot đầy đủ. Chỉ expose `admin-web` (:3000);
  `apps/api` gọi qua localhost; **`/metrics` không được ra internet**
  (ADR-0004 §5).
- **Rollback tách làm 2**: (1) rollback code = `git checkout <tag-cũ>` +
  install + build + restart, KHÔNG chạy `db:deploy`; (2) rollback DB = chỉ khi
  migration phá tương thích ngược, và **không có cơ chế tự động** — Prisma
  không sinh down migration (đã kiểm `prisma/migrations/`: chỉ có
  `migration.sql`), repo cố ý không tự viết down script. Cách an toàn duy nhất:
  stop service → `scripts/db-restore.sh <backup>` → start, **chấp nhận mất dữ
  liệu ghi trong khoảng giữa**. Vì vậy runbook bắt buộc `./scripts/db-backup.sh`
  TRƯỚC khi migrate, và khuyến nghị migration expand-contract (thêm cột
  nullable trước, xoá cột ở bản sau) để rollback code không cần đụng DB.
- Smoke test sau deploy: `/health/live`, `/health/ready` (chạm DB — mục quan
  trọng nhất), `/metrics` (xác nhận process chạy thật, không chỉ port mở),
  `GET /login` của web; và **một lần đăng nhập thật qua domain HTTPS** vì
  curl localhost không kiểm được chuỗi proxy → TLS → cookie `secure`.
- Cố ý không làm: deploy tự động khi push, zero-downtime (restart = downtime
  vài giây), nginx/certbot đầy đủ, monitoring stack.
- 4 lệnh kiểm tra (`lint`, `typecheck`, `test`, `build`) đều xanh.
- **Chưa commit** — chờ user duyệt.

## Việc còn lại

- [x] v0.8 coi như **DONE** (đã cập nhật Release Process trong `CLAUDE.md`):
      security headers, backup/restore, metrics, load test, deploy + rollback
      runbook. Còn nợ có chủ đích: **alerting + tracing** — hoãn đến khi có
      máy thật (ADR-0004 §7, §8).
- [x] Load test: xong, có baseline thật (xem trên) — user xác nhận đủ.
- [ ] Khi chốt hạ tầng deploy: chặn `/metrics` không cho ra internet, trỏ
      scraper vào, định nghĩa alert đầu tiên (5xx rate, p95 latency,
      `/health/ready` fail) — ADR-0004 §"Xem lai khi nao".
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
- ADR-0005: deploy 1 VPS bằng git checkout tag + build tại chỗ + systemd,
  **không Docker hoá app** (Postgres/Redis vẫn Docker). `pnpm db:deploy`
  (`migrate deploy`) là lệnh migration của production — không bao giờ chạy
  `pnpm db:migrate` ở đó. Rollback code ≠ rollback DB; rollback schema chỉ có
  đường backup/restore.
- ADR-0004: metrics dùng format Prometheus chuẩn (vendor-neutral) thay vì SDK
  của một SaaS cụ thể — vì **chưa chốt hạ tầng deploy**, đây đúng là lúc không
  được khoá vào vendor. Tracing/alerting hoãn có chủ đích, không phải bỏ quên.
