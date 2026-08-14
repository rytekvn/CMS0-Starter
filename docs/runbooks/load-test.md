# Runbook — Load Test `apps/api`

Ap dung script `scripts/load-test.mjs`, dung `autocannon` (Node API, chi la 1
devDependency npm, khong can cai binary ngoai nhu k6) — hop voi
"0 cai dat them ngoai `pnpm install`" cua monorepo pnpm nay.

## Endpoint duoc chon

| Endpoint | Co test khong | Ly do |
|---|---|---|
| `GET /products` | **Co, endpoint chinh** (`TARGET=products`, mac dinh) | Doc nhieu nhat trong mot CMS: list + filter, admin-web goi lien tuc o trang danh sach. |
| `GET /health/live` | Co, duong nen (`TARGET=health`) | Khong cham DB, khong qua auth guard — do "tran cua ha tang" (Node/network thuan tuy) de so sanh voi so cua `/products` (co DB + JwtAuthGuard + PermissionsGuard). |
| `POST /auth/login` | **Khong dua vao load test chinh** — co check rieng (`TARGET=auth-throttle`) | Route nay bi siet `@Throttle({ limit: 5, ttl: 60_000 })` rieng (chong brute-force, xem `apps/api/src/modules/auth/auth.controller.ts`). Load test binh thuong (vd 10 connections x 20s) chi do duoc luc nao rate limiter tra 429, khong do duoc thoi gian bcrypt.compare/signToken thuc su — con so se gay hieu lam "API cham" trong khi thuc ra la rate limit dang lam dung viec. Quyet dinh: **bo login khoi bai do throughput chinh**, thay bang mot check rieng, ngan (5 connections x 5s) chi de xac nhan throttle hoat dong dung (vai request 401 dau, sau do 429). |

`GET /products/:id`, `POST/PATCH/DELETE /products` khong co trong script nay:
`GET /products` da dai dien du cho duong doc (pattern truy cap chinh), va ghi
lien tuc voi `bulkAction`/CSV import se ghi rac vao DB dev — ngoai pham vi
"chuan bi cong cu load test toi thieu". Them target khi co nhu cau that.

## Chuan bi (USER TU CHAY — script khong tu start server)

```bash
docker compose up -d              # Postgres + Redis, neu chua chay san
cp apps/api/.env.example apps/api/.env   # neu chua co
pnpm db:migrate
pnpm db:seed                      # tao super admin: admin@rytek.local / admin123 (mac dinh)
pnpm dev:api                      # NestJS :4000 — CHAY O MOT TERMINAL RIENG, giu no song
```

## Lay JWT token

Cach 1 — de script tu login (khuyen nghi cho lan chay dau, don gian):

```bash
EMAIL=admin@rytek.local PASSWORD=admin123 pnpm load-test
```

Script chi goi `POST /auth/login` **dung mot lan** truoc khi bat dau vong lap
tai, khong lap lai trong luc do (tranh dinh throttle 5/60s cua chinh route do).

Cach 2 — tu lay token roi truyen thang (khi muon chay nhieu lan lien tiep,
khoi login lai moi lan):

```bash
TOKEN=$(curl -s -X POST localhost:4000/auth/login \
  -H 'content-type: application/json' \
  -d '{"email":"admin@rytek.local","password":"admin123"}' | jq -r .token)

TOKEN=$TOKEN pnpm load-test
```

## Chay load test

```bash
# Mac dinh: GET /products, 10 connections, 20 giay
EMAIL=admin@rytek.local PASSWORD=admin123 pnpm load-test

# Tuy chinh tai
EMAIL=admin@rytek.local PASSWORD=admin123 \
CONNECTIONS=50 DURATION=30 pnpm load-test

# Loc theo status (giong query cua GET /products that)
TOKEN=$TOKEN PRODUCTS_QUERY="?status=active" pnpm load-test

# Duong nen — khong can token
TARGET=health pnpm load-test

# Xac nhan throttle /auth/login hoat dong dung (KHONG phai do throughput)
TARGET=auth-throttle pnpm load-test
```

Bien moi truong: `API_URL` (mac dinh `http://localhost:4000`), `TARGET`
(`products` | `health` | `auth-throttle`), `CONNECTIONS`, `DURATION` (giay),
`PRODUCTS_QUERY` (query string noi vao `/products`, vd `?status=active`),
`TOKEN` hoac `EMAIL`+`PASSWORD`.

## Doc ket qua

Script in bang cua `autocannon` gom:

- **Latency**: `2.5% / 50% / 97.5% / 99% / Avg / Stdev / Max` (mili giay).
  `autocannon` bao p97.5 chu khong co san p95 — du dung cho muc dich nay,
  khong them thu vien rieng chi de tinh p95.
- **Req/Sec**, **Bytes/Sec**.
- Bang status code (`renderStatusCodes: true`) — nhin `2xx` vs con lai de tinh
  error rate: `non-2xx / tong so request`.

## Nguong tham khao (chua co baseline that — se dien sau khi user chay)

Chua chay load test that (luat: khong tu start server dai han), nen chua co so
lieu baseline cua may nay. Goi y nguong hop ly cho mot CMS backend nho (self-host,
so nguoi dung dong thoi thap, endpoint co DB + Redis + Nest guard):

| Chi so | Chap nhan duoc | Can xem lai |
|---|---|---|
| p50 latency (`/products`) | < 50ms | > 200ms |
| p99 latency (`/products`) | < 300ms | > 1000ms |
| Error rate (khong tinh 429 co chu dich) | 0% | > 0.1% |
| Req/Sec o 10-20 connections | Khong quan trong bang latency on dinh khi tang connections | Req/Sec giam manh khi tang connections (dau hieu nghen — pool Prisma, event loop) |

Day chi la diem khoi dau de xet doan — khi co so lieu that, dien lai bang nay
bang con so do duoc va giai thich neu lech nhieu.

## Luu y quan trong: rate limiter global se anh huong ket qua

`apps/api` co `ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }])` ap dung
**toan cuc** cho moi route tru `/health*` va `/metrics` (`@SkipThrottle()`) —
xem `apps/api/src/app.module.ts`. Neu chay `CONNECTIONS`/`DURATION` du lon de
mot IP vuot **100 request/60 giay**, ket qua se xuat hien `429 Too Many
Requests` xen giua cac response 200. **Day la hanh vi dung chu dich (rate
limit chong spam), khong phai bug hay API bi qua tai** — dung nham lan khi
doc bang status code. Muon do throughput thuan (khong bi throttle chan) thi
giu tai duoi nguong 100 req/60s, hoac chap nhan 429 nhu mot phan ket qua va
bao cao rieng ty le no.
