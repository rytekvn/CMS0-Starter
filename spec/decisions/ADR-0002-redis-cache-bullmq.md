# ADR-0002 — Redis cache cho auth + BullMQ cho job nen

- **Trang thai:** Accepted
- **Ngay:** 2026-08-12
- **Nguoi quyet dinh:** Ryan
- **Tham chieu:** `docs/rytek_platform_roadmap.md` §7.6 (cache), §7.7 (queue), §7.8;
  `CLAUDE.md` (Release Process v0.4.5); ADR-0001

## Boi canh

v0.4.5 con 3 muc chua lam: Redis cache, BullMQ, idempotency. Redis da khai bao
trong `docker-compose.yml` tu v0.3 nhung **chua app nao connect** — ha tang co
san ma khong co consumer.

Hai cho co nhu cau THAT, do duoc, khong phai lam cho du roadmap:

1. `JwtAuthGuard` query `user` + toan bo `roles -> permissions` **moi request co
   token**. Cho nay da co comment `ponytail:` danh dau la no ky thuat co chu dich
   tu dot migrate Auth ("them cache khi do duoc la cham").
2. Chua co duong nao chay viec **ngoai request** (gui email/thong bao). Roadmap
   §7.7 liet ke day la use case dau tien cua queue.

**Idempotency KHONG lam o dot nay** — chua co use case cu the (khong co endpoint
thanh toan / tao don). Lam khi co.

## Quyet dinh

### 1. Hai connection Redis rieng, cung mot Redis server

| | Cache (`RedisService`) | BullMQ (`BullModule.forRoot`) |
|---|---|---|
| `maxRetriesPerRequest` | `1` | `null` (BAT BUOC) |
| `enableOfflineQueue` | `false` | mac dinh |
| Muc tieu | fail nhanh, degrade ve DB | cho vo han, khong duoc mat job |

Day la ly do **quan trong nhat** cua ca ADR nay: worker BullMQ bat buoc phai
dung `maxRetriesPerRequest: null` vi no chay blocking command doi job. Neu cache
dung chung client do, Redis chet -> `cache.get()` trong `JwtAuthGuard` treo vo
han -> **moi request co token dung hinh**. Cache phai nguoc lai: reject ngay de
guard rot ve DB.

BullMQ tu namespace key theo ten queue (`bull:notification:*`), khong dung
`auth:user:v1:*`.

### 2. Cache auth: cache-aside, key co version, TTL 60s

- Key: `auth:user:v1:<userId>` (namespace + version theo §7.6). Doi shape
  `AuthUser` -> tang `v2`, key cu tu het han.
- Gia tri: `JSON.stringify(AuthUser)` **nguyen ban, co ca `password`**. Day la
  cache noi bo server, cung muc rui ro voi row dang nam trong Postgres. Strip
  `password` se lam nhanh cache-hit va cache-miss tra shape khac nhau — bug kho
  tim hon nhieu so voi rui ro no tranh duoc.
- TTL **60 giay** la **tran an toan**, khong phai co che chinh: moi duong ghi da
  biet deu invalidate chu dong. TTL chi phu duong khong kiem soat duoc (sua DB
  tay, `pnpm db:seed`). Hang so trong code, khong dua ra env — chua co ly do gi
  de moi moi truong mot gia tri.
- Redis chet -> `getCachedUser` tra `null`, `cacheUser`/`invalidateUsers` nuot
  loi + log `warn`. Auth van chay (cham hon). **Khong** them Redis vao
  `/health/ready`: `ready` chi cham DB (giu nguyen luat cu).

### 3. Invalidate chu dong

| Su kien | Cach xu ly |
|---|---|
| `UserService.update` / `softDelete` | Xoa dung `auth:user:v1:<id>` |
| `RoleService.update` / `softDelete` | Query `userRole.findMany({ roleId, deletedAt: null })` -> xoa dung tung key cua thanh vien role do |

**Khong dung `KEYS auth:user:v1:*`**: lenh blocking O(N) tren toan keyspace VA
xoa nham cache cua user khong lien quan. Query `UserRole` co index
(`@@unique([userId, roleId])`), chay tren hanh dong admin hiem — chinh xac hon
va re hon.

### 4. Job `user.welcome`: thuan cong them, khong doi hanh vi `POST /users`

- Producer: `NotificationService` (module `modules/notifications/`).
  `UserModule` import `NotificationModule`, `UserService` inject
  `NotificationService` — dung luat "module khong import truc tiep module khac,
  di qua service duoc export".
- Enqueue nam trong `UserService.create()`, **sau** khi Prisma create + audit log
  xong: service la noi biet "user da tao thanh cong".
- `await queue.add(...)` **co `try/catch`**, log `error` kem `userId`, van tra
  user binh thuong. Neu de loi noi len: Redis chet -> `POST /users` tra 500 sau
  khi user DA ghi vao DB -> client tuong that bai, retry -> 500 duplicate email.
  Day khong phai nuot loi im lang: co log error du de enqueue lai tay.
- Payload `{ v: 1, userId, requestId? }`. `requestId` la `req.id` do `pino-http`
  sinh (echo trong header `x-request-id`) -> log cua worker truy nguoc duoc ve
  request da tao user (§7.7). Chi doi signature noi bo `UserService.create`,
  **khong doi request/response HTTP**.
- Processor `parse` payload bang Zod (khong phai input HTTP nen khong qua
  `ZodValidationPipe`). Sai shape / sai version -> `UnrecoverableError` (co that
  trong bullmq 5) de fail ngay, khong dot 3 lan retry cho payload hong vinh vien.

### 5. Worker chay in-process, khong co `apps/worker`

`@Processor` chay ngay trong `apps/api`. Job hien chi log — chua co nhu cau do
duoc de tach process. Dung ADR-0001 (tach khi co nhu cau do duoc).

### 6. Khong tao dead-letter queue rieng

Dung set `failed` san co cua BullMQ + `removeOnFail: { count: 1000 }` +
`@OnWorkerEvent("failed")` log. Them mot queue nua la abstraction thua.

## Cac phuong an da can nhac va loai

| Phuong an | Ly do loai |
|---|---|
| Mot connection Redis chung cho cache va BullMQ | `maxRetriesPerRequest` cua hai ben nguoc nhau; dung chung = Redis chet lam treo moi request co token. |
| `@nestjs/cache-manager` + `cache-manager-redis-store` | 2-3 dependency + mot tang truu tuong nua cho **1** cho can cache. `ioredis` da co san (bullmq hard-depend dung `ioredis@5.11.1`, khong sinh ban thu hai trong tree). |
| `bullmq@6` | Ra 13 ngay, 11 patch trong 12 ngay ke ca 1 hotfix; breaking change cua v6 khong lien quan toi ta. Nang len sau chi la doi 1 dong version. |
| `KEYS auth:user:v1:*` khi role doi | Blocking O(N) toan keyspace + xoa nham cache user khong lien quan. |
| Cache ca ket qua `GET /users`, `GET /products` | Chua do duoc la cham, va invalidate danh sach kho hon nhieu lan invalidate mot user. YAGNI. |
| Strip `password` truoc khi cache | Nhanh cache-hit va cache-miss tra shape khac nhau. |
| Them Redis vao `/health/ready` | Auth van chay khi Redis chet -> Redis khong phai dieu kien "san sang". Se lam ready that bai gia. |
| `apps/worker` process rieng | Chua co job nang. Job chi log. |
| Queue DLQ rieng | Set `failed` cua BullMQ da la dead-letter. |
| Cau hinh `timeout` cho job | **Khong ton tai** trong bullmq 5 (`BaseJobOptions` khong co field nay — do la Bull 3 cu). Co che that la lock renewal + `stalledInterval`/`maxStalledCount` o Worker. |

## He qua

**Duoc:**
- `JwtAuthGuard` het query DB moi request; cho `ponytail:` danh dau tu dot migrate
  Auth da tra xong.
- Co mot duong chuan de chay viec ngoai request, kem correlation ID va retry.
- Redis trong `docker-compose.yml` gio co consumer that.

**Phai chap nhan:**
- **Quyen bi thu hoi van dung duoc toi da 60s** neu co duong ghi nao sot
  invalidate. Duong da biet deu da phu; duong khong phu la sua DB tay / `db:seed`.
- Cache luu ca `password` hash trong Redis.
- Job chiem CPU chung voi HTTP (chap nhan duoc vi job chi log; duong thoat la
  tach `apps/worker`).
- Log co the noi khi Redis down: `ioredis` phat `error` moi lan retry ket noi,
  moi lan la mot dong `warn`.
- Them 3 dependency: `ioredis`, `bullmq`, `@nestjs/bullmq`.

## Xem lai khi nao

- Khi co endpoint can **idempotency** that (thanh toan, tao don): lam not muc con
  lai cua v0.4.5.
- Khi job nang len (gui email that, xu ly file): danh gia tach `apps/worker`.
- Khi so job/queue > 1: xem lai co can queue rieng theo do uu tien khong.
- Khi `bullmq@6` da on dinh vai thang: nang version.
- Khi TTL 60s gay phien (quyen thu hoi cham): xem lai co can invalidate qua
  pub/sub khong.
