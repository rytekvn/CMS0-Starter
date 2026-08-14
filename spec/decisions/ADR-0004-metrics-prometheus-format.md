# ADR-0004 — Metrics dang Prometheus text format, chua lam tracing/alerting

- **Trang thai:** Accepted
- **Ngay:** 2026-08-13
- **Nguoi quyet dinh:** Ryan
- **Tham chieu:** `docs/rytek_platform_roadmap.md` (observability); `CLAUDE.md`
  (Release Process v0.8, Backend Rules); ADR-0001; ADR-0002

## Boi canh

v0.8 "Production hardening" con mang **metrics/alerting/tracing**. Hien app moi
co structured log (pino) + `x-request-id`: tra loi duoc "request nay xay ra gi",
nhung khong tra loi duoc "endpoint nao cham", "ty le loi bao nhieu", "heap co
phinh khong".

Rang buoc quyet dinh ca ADR nay: **chua chot ha tang deploy** — chua biet
self-host VPS hay managed cloud. Nghia la chua biet ai se nhan so lieu. Xay
dashboard/alerting bay gio la xay cho mot he thong chua ton tai; nhung khong lam
gi ca thi den luc chot ha tang lai phai bo sung instrumentation vao tung route.

Cho tach duoc: **instrumentation** (nam trong code app, doi sau nay dat) va
**backend + dashboard + alert** (nam ngoai app, thay doi theo noi deploy). Lam
cai thu nhat bay gio, hoan cai thu hai.

## Quyet dinh

### 1. `prom-client` + endpoint `GET /metrics` (Prometheus text format)

`apps/api/src/common/metrics.ts` + `apps/api/src/modules/metrics/`. Format
Prometheus la **chuan de-facto**, khong phai chon mot vendor: Prometheus,
Grafana Alloy/Cloud, Datadog agent (`openmetrics` check), New Relic,
VictoriaMetrics, OpenTelemetry Collector (receiver `prometheus`) deu scrape
duoc **cung mot endpoint nay** ma khong sua mot dong code.

Do ngay ca khi sau nay chon SaaS: tich hop thang SDK cua mot SaaS cu the
(`dd-trace`, `newrelic`) se khoa app vao vendor do va phai go ra neu doi y —
dung luc chua chot ha tang la luc **khong duoc** khoa.

### 2. Do gi: 1 histogram + default process metrics

| Metric | Nguon |
|---|---|
| `http_request_duration_seconds{method,route,status}` | Histogram tu viet |
| `http_request_duration_seconds_count` (= request count), `_sum` | Di kem histogram, khong phai code them |
| CPU, heap, event loop lag, GC, file descriptor | `collectDefaultMetrics()` cua prom-client |

**Khong** them Counter rieng cho request count: `_count` cua histogram da la
chinh no. Hai series noi cung mot dieu la cho de lech nhau.

Bucket dung mac dinh cua prom-client (0.005s → 10s) — dung dai do cho HTTP API.

### 3. Label `route` lay tu `req.route.path`, khong khop route thi la `"unknown"`

Day la rui ro that duy nhat cua dot nay. Dan URL that (`/products/abc-123`) vao
label se sinh **mot time series moi cho moi id** — no bo nho cua ca app lan
backend metrics (cardinality explosion). Nen chi dung path DA DANG KY
(`/products/:id`); request khong khop route nao (404, request bi chan truoc
routing) gom het vao `"unknown"`. Co test khoa cho nay
(`apps/api/src/common/metrics.test.ts`).

### 4. Middleware Express dat truoc routing, khong phai Nest interceptor

Nest interceptor chay **sau** guard → se bo sot 429 cua `ThrottlerGuard`, 401
cua `JwtAuthGuard` va toan bo 404. Ma do chinh la nhung con so can nhin nhat khi
co su co. Middleware `app.use(metrics)` trong `main.ts` (ngay sau `logging`) do
duoc het.

### 5. `/metrics` khong co auth, co `@SkipThrottle()`

- **Khong auth:** scraper khong cam JWT. Day la thong le chuan cua Prometheus —
  `/metrics` mo trong **mang noi bo**, chan o tang ingress/firewall/security
  group, khong phai o tang app. Ghi ro o day de sau nay khong bi doc nham la lo
  hong: **viec bat buoc khi deploy la khong publish `/metrics` ra internet**
  (xem §"Xem lai khi nao").
- **`@SkipThrottle()`:** giong `/health*`. Scraper goi dinh ky 15–60s, khong
  phai traffic can chan; bi 429 se lam thung du lieu do.

Endpoint khong lo du lieu nghiep vu: chi co ten route, ma status, so dem, va so
lieu process. Khong co email, id ban ghi, token.

### 6. Registry rieng, khong dung global `register`

Registry global la singleton toan process — `pnpm test` import file nay nhieu
lan se cham vao cung mot state. Registry rieng cung khien `metricsRegistry`
la thu duy nhat controller phu thuoc vao.

### 7. **KHONG** lam tracing (OpenTelemetry) o dot nay

Da can nhac `@opentelemetry/sdk-node` + auto-instrumentation, export OTLP, tat
khi khong co `OTEL_EXPORTER_OTLP_ENDPOINT`. Loai, vi:

- **Chua co noi nhan trace.** Khac voi metrics, trace khong co gia tri "de danh":
  metrics scrape ra van doc duoc bang mat/curl, con trace khong co collector thi
  khong ai nhin duoc gi.
- **Chi phi khong nho:** 5–6 package, va SDK **bat buoc phai khoi tao truoc moi
  import khac** de patch module — dung cho `main.ts` da co rang buoc thu tu
  import kho tinh (`./common/env` phai dung dau, xem comment trong file do).
  Them mot rang buoc thu tu nua vao chinh cho do la cach de tao bug im lang.
- **Hoan lai khong dat gi.** Them tracing sau la **cong them**: mot file
  `tracing.ts` + mot dong import dau `main.ts`, khong sua route, khong sua
  service. Ngay ca lua chon format cung khong bi khoa — OTel Collector nhan
  duoc endpoint `/metrics` o §1, nen hai duong nay khong dam nhau.

Doi lai, cai **bi khoa** neu chon sai bay gio la format metrics (§1) — nen dot
nay bo cong vao do.

Trong khi chua co tracing, duong truy vet la `x-request-id` cua pino (co san,
xuyen ca sang worker BullMQ — ADR-0002 §4).

### 8. **KHONG** dung Prometheus/Grafana container va **khong** lam alerting

- `docker-compose.yml` giu nguyen (postgres + redis). Them Prometheus + Grafana
  vao day la dung sai cho: compose nay la **moi truong dev cuc bo**, con
  monitoring la thu cua **moi truong that** — dev khong ai ngoi xem dashboard
  cua chinh may minh. Va cau hinh scrape/dashboard/retention phu thuoc noi
  deploy (k8s service discovery? static target? managed?), viet bay gio la doan.
- **Alert khong co gi de dinh nghia khi chua co backend nhan so lieu.** Alert
  con can kenh nhan (email/Slack/PagerDuty) va nguoi truc — deu chua co. Lam
  bay gio = mot file YAML khong ai chay.

Muon xem so lieu luc dev: `curl localhost:4000/metrics`.

## Cac phuong an da can nhac va loai

| Phuong an | Ly do loai |
|---|---|
| Tich hop thang SDK cua mot SaaS (`dd-trace`, `newrelic`) | Khoa app vao vendor **truoc khi** chot ha tang — dung dieu phai tranh nhat o dot nay. |
| `@willsoto/nestjs-prometheus` | Wrapper mong quanh `prom-client` (chi la mot Module + provider). Them 1 dependency + 1 tang de tiet kiem ~15 dong; ma phan kho (label `route`, do ca 404/429) no khong lam ho. |
| Nest interceptor thay middleware | Chay sau guard → mat 401/429/404, dung nhung con so can nhat luc su co. |
| Counter rieng cho request count | `http_request_duration_seconds_count` da la no. Hai series noi cung mot dieu. |
| Label `route` = `req.originalUrl` | Cardinality explosion: moi id sinh mot time series. |
| Them `@nestjs/terminus` cho health + metrics | Health hien tai 2 route, 15 dong, chay dung. Doi sang terminus la refactor khong ai yeu cau. |
| Bao ve `/metrics` bang JWT | Scraper khong cam token duoc. Bao ve dung cho la mang, khong phai app. |
| Bao ve `/metrics` bang basic auth/token qua env | Config cho use case chua ton tai (chua biet scraper la ai). Them khi chot ha tang neu ha tang do that su can lo `/metrics` ra ngoai. |
| OpenTelemetry SDK ngay bay gio | §7. |
| Prometheus + Grafana trong `docker-compose.yml` | §8. |
| Push metrics (Pushgateway / OTLP push) | Push can biet **truoc** dia chi dich — dung thu ta chua co. Scrape (pull) de dich tu tim den, doi dich khong phai sua app. |

## He qua

**Duoc:**
- Tra loi duoc "endpoint nao cham / ty le loi / heap co phinh khong" ngay tu
  luc dev, bang `curl localhost:4000/metrics`.
- Ngay ngay chot ha tang: chi can tro scraper vao endpoint nay — **khong sua
  code app**.
- Khong khoa vao vendor nao.

**Phai chap nhan:**
- **Chua co dashboard, chua co alert.** Co so lieu khong co nghia la co nguoi
  biet khi hong. Day la viec con no, ghi ro o duoi.
- **Chua co tracing** → request cham xuyen nhieu service van phai lan bang
  `x-request-id` trong log.
- Metrics nam trong bo nho **cua tung process**: chay nhieu instance thi moi
  instance mot bo so, phai cong o tang backend (Prometheus lam san). Restart la
  mat — dung de danh gia lich su tu day.
- Them 1 dependency truc tiep (`prom-client@^15.1.3`) + 3 package transitive
  (`tdigest`, `bintrees`, `@opentelemetry/api` — ban API rong, khong keo theo
  SDK).
- Chua do cai gi ngoai HTTP: chua co metric cho queue BullMQ (job cho/that bai)
  hay Prisma. Them khi co nhu cau that.

## Xem lai khi nao

- **Ngay khi chot ha tang deploy** — day la viec con no cua v0.8:
  1. Chan `/metrics` khong cho ra internet (ingress/firewall/security group).
  2. Dung scraper (Prometheus self-host / Grafana Alloy / agent cua SaaS) tro
     vao `/metrics`.
  3. Dinh nghia alert dau tien theo so lieu da co: ty le 5xx, p95 latency,
     `/health/ready` fail — kem kenh nhan va nguoi truc.
- Khi he chay **>1 service** (vd tach `apps/worker` theo ADR-0002 §5) va bat dau
  co request xuyen service: lam tracing OTel — luc do trace moi tra tien.
- Khi queue co job that (khong con chi log): them metric so job cho/that bai.
- Khi mot endpoint co cardinality cao lot vao label `route` (vd route dong):
  xem lai cach dat label.
