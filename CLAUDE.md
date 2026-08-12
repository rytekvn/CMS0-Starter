# CLAUDE.md — Rytek Platform

## Project Context

Day **khong phai mot CMS don le**. Muc tieu la mot **platform** de sinh ra
nhieu san pham (CMS/CRM/SaaS) tren cung mot nen: NestJS + Next.js + Prisma/
PostgreSQL + Redis, phat trien theo Spec-Driven Development.

Kien truc hien tai — **mot stack duy nhat**:

```
apps/api             NestJS  :4000   dang chay that: auth (login/me), user, role, file (upload/download), Product (CRUD, filter, CSV export/import, bulk action); cache auth qua Redis + queue BullMQ (worker in-process)
apps/admin-web       Next.js :3000   dang chay that: /login, /products, /users, /roles (list, new, detail, edit)
prisma/              schema.prisma - single source of truth cho DB
spec/                contract nghiep vu da duyet
docs/                roadmap platform
packages/            (chua co package nao - tao khi co consumer that)
```

Hai app cu `apps/api-legacy` (Hono) va `apps/admin-web-legacy` (Vite) **da bi
xoa**: toan bo module nghiep vu (product, auth, user, role, file) da migrate
sang `apps/api` + `apps/admin-web`. Khong con hai stack chay song song, khong
con rang buoc "JWT phai khop giua hai API" — chi `apps/api` ky va verify token.

Ly do va cac phuong an da loai: `spec/decisions/ADR-0001-nestjs-nextjs-pnpm-monorepo.md`.

## Required Reading

Doc theo dung thu tu nay truoc khi code (roadmap §9.2):

1. File nay.
2. `spec/README.md` + spec cua entity dang lam
   (`spec/entities/*.yaml`, `spec/permissions/*.yaml`, `spec/acceptance/*.feature.md`).
   Entity moi: copy 4 file `spec/**/_template.*` (xem huong dan trong `spec/README.md`),
   hoac nhanh hon — chay skill `/new-entity` (`.claude/skills/new-entity/`) de sinh san
   3 file spec tu template. Kiem cau truc bang `pnpm spec:check [entity]` (cong cu tu
   kiem, khong phai CI gate) truoc khi coi spec la Ready.
3. `spec/decisions/` — ADR lien quan.
4. `docs/rytek_platform_roadmap.md` — §5 tech stack, §8 spec, §9 AI workflow, §18 quyet dinh da chot.
5. Module gan nhat da co + test cua no — module tham chieu chuan cho NestJS + Next.js:
   `apps/api/src/modules/products/` (`product.controller.ts`, `product.service.ts`,
   `product.schema.ts`, `product.schema.test.ts`) +
   `apps/admin-web/app/(app)/products/` (`page.tsx`, `new/`, `[id]/`, `[id]/edit/`,
   `schema.ts`, `api.ts`, `permissions.ts`, `actions.ts`).

## Commands

```bash
corepack enable pnpm
pnpm install                     # 1 lockfile cho ca workspace

docker compose up -d             # postgres 16 (:5432) + redis 7 (:6379)
cp apps/api/.env.example apps/api/.env                     # + 3 app con lai
pnpm db:generate                 # prisma generate
pnpm db:migrate                  # prisma migrate dev
pnpm db:seed                     # 4 role + permission + 1 super admin

pnpm lint                        # oxlint
pnpm typecheck                   # tsc --noEmit moi project
pnpm test                        # node --test qua tsx (+ test cua scripts/)
pnpm spec:check [entity]         # kiem cau truc spec (tu kiem, khong phai CI gate)
pnpm build                       # nest build + next build

pnpm dev:api                     # NestJS  :4000
pnpm dev:web                     # Next.js :3000
```

## Architecture Rules

- **Chi service goi Prisma.** Controller/route khong query truc tiep.
- **Khong them tang truu tuong tren Prisma** (repository/adapter/DB-agnostic
  layer). Prisma la nguon truy cap du lieu duy nhat — day la quyet dinh da chot.
- Module moi cua NestJS nam trong `apps/api/src/modules/<name>/`.
  Ha tang dung chung (Prisma, cache, queue) nam trong `apps/api/src/infrastructure/`.
- **Chieu phu thuoc mot huong:** `modules/*` -> `infrastructure/*` -> `common/*`.
  Khong bao gio nguoc lai, va module khong import truc tiep module khac —
  di qua service duoc export.
- **Khong tao thu muc rong "cho san"** (decorators/, guards/, interceptors/,
  filters/, packages/*). Tao khi co consumer that.
- Log la **structured JSON qua pino** (`apps/api/src/common/logging.ts`).
  Moi request co `x-request-id` (nhan tu client hoac tu sinh) va duoc echo lai
  trong response header. **Khong log secret, token, password.**

## UI Rules

- Dung **semantic token** trong `apps/admin-web/app/globals.css`
  (`var(--primary)`, `var(--muted-foreground)`, ...). **Khong hard-code ma mau.**
- **Tailwind v4 + shadcn/ui + TanStack Table da cai (v0.5).** Component dung chung
  la shadcn primitive (`components/ui/*`), khong tu ve component moi neu shadcn
  da co san.
- Trang danh sach/chi tiet phai co du state: **loading, empty, error, no-permission**.
- Tai su dung component da co; khong tao wrapper chi de doi ten.
- Module frontend (`apps/admin-web`, Next.js App Router): vi tri file do
  URL route quyet dinh — `app/(app)/<entity>/{page.tsx, new/page.tsx, [id]/page.tsx,
  [id]/edit/page.tsx}`. Van giu du cac file "quan tam" tuong duong module cu trong
  cung thu muc: `schema.ts`, `api.ts`, `permissions.ts`, `actions.ts` (Server Actions
  cho write), `<entity>-table.tsx` / `<entity>-form.tsx` / `<entity>-filters.tsx`
  (Client Component cho phan tuong tac). Component dung chung nhieu entity
  (DataTable, PageHeader, Pagination, StatusBadge, ConfirmDialog, Sidebar, Header,
  Breadcrumb) nam o `apps/admin-web/components/`, khong lap lai trong tung module.

## Backend Rules

- **Validation:** moi input tu ngoai vao phai qua schema Zod + `ZodValidationPipe`,
  **khong dung class-validator/DTO** (quyet dinh da chot, xem
  `spec/decisions/ADR-0001-nestjs-nextjs-pnpm-monorepo.md`). Zod cung la nguon
  sinh OpenAPI schema, nen them DTO song song se tao nguon su that thu hai.
  Khong tin body/query.
- **Auth:** moi route can auth (tru `/auth/login`, `/health*`).
- **Permission:** kiem tra bang key `"<entity>.<action>"` truoc moi hanh dong ghi;
  quyen den tu DB (Role -> Permission), khong hard-code trong code.
  Role da soft delete khong con cap quyen.
- **Audit:** moi hanh dong tao/sua/xoa phai ghi `AuditLog`
  (action, entity, entityId, actorId, metadata).
- **Soft delete:** moi model co `createdAt`, `updatedAt`, `createdBy`,
  `updatedBy`, `deletedAt`. Xoa = set `deletedAt`, khong xoa cung.
  **Moi query list/detail phai loc `deletedAt: null`.**
- **Transaction:** nhieu lenh ghi phai nhat quan -> `prisma.$transaction`.
- **Health:** `/health/live` khong duoc cham DB; `/health/ready` cham DB va
  tra 503 khi DB down. **Redis khong nam trong `/health/ready`** — auth van chay
  khi Redis chet.
- **Cache (Redis):** chi cache khi da do duoc la cham. Cho duy nhat dang cache la
  user+permissions cua `JwtAuthGuard` (`common/auth/auth-cache.ts`, key
  `auth:user:v1:<id>`, TTL 60s). Luat: **cache-aside + invalidate chu dong o moi
  duong ghi**; TTL chi la tran an toan. Redis chet -> degrade im lang ve DB
  (log `warn`), khong bao gio throw len guard. Khong dung `KEYS` de invalidate.
- **Queue (BullMQ):** job dat trong `modules/notifications/`, worker chay
  in-process (chua co `apps/worker`). Payload job phai co `v` (version) + `parse`
  bang Zod **trong processor**; payload sai -> `UnrecoverableError` (fail ngay,
  khong retry). Enqueue tu service sau khi ghi DB xong, bat `try/catch` +
  log `error` — **queue chet khong duoc doi hanh vi/response cua endpoint**.
  Truyen `requestId` (`req.id`) vao payload de log worker trace duoc.
  Xem `spec/decisions/ADR-0002-redis-cache-bullmq.md`.
- Idempotency: chua co use case cu the, chua lam. Khi lam, theo roadmap §7.8.

## Coding Convention

- TypeScript, **khong dung `any`**.
- Component React: function component, khong class.
- Comment giai thich **tai sao**, khong dien giai lai code.

## AI Guardrails

- **Khong sua spec da duyet mot cach tham lang.** Code lech spec -> **bao conflict**,
  khong sua spec cho khop code.
- **Khong them dependency** khi stdlib / platform hien tai da giai quyet duoc.
  Them thi phai noi ro vi sao.
- **Khong them abstraction** khi chua co it nhat mot use case that hoac
  pattern da lap lai. Khong interface cho mot implementation.
- Khong chia them layer neu controller/service da du.
- Chi sua thu can sua. Khong "tien tay" refactor/format code khong lien quan.
- Gap mau thuan hoac cho mo ho co anh huong lon -> **dung lai va hoi**, khong doan.
- Moi thay doi phai chay duoc `pnpm lint && pnpm typecheck && pnpm test && pnpm build`.

## Definition of Done

- [ ] Implementation khop spec da duyet; lech cho nao da duoc bao va duyet.
- [ ] Migration chay duoc (`pnpm db:migrate`).
- [ ] Permission duoc kiem o backend **va** phan anh o frontend.
- [ ] Co test tuong ung voi rui ro (it nhat 1 check chay duoc cho logic khong tam thuong).
- [ ] Loading / empty / error / no-permission states day du.
- [ ] Audit log va structured log can thiet da co; khong co secret trong log.
- [ ] `pnpm lint && pnpm typecheck && pnpm test && pnpm build` deu xanh.
- [ ] Spec/docs/ADR cap nhat neu quyet dinh thay doi.
- [ ] Acceptance criteria moi/sua da gan `[AC-...]` + `**Test:**`.
- [ ] Bao cao: file da doi, quyet dinh, gioi han, ket qua verify.

## Release Process

Danh so theo repo nay (khac voi danh so cua roadmap platform).

- **v0.1 — DONE.** Login, Dashboard, User, Role, Permission, Audit Log, 1 CRUD mau.
- **v0.2 — DONE.** Upload, Import/Export, Bulk Action, Advanced Filter.
- **v0.3 — Foundations. DONE.** pnpm monorepo, NestJS + Next.js skeleton,
  Docker Compose (Postgres + Redis), health + structured log + request ID,
  `spec/` + ADR, CI lint/typecheck/test/build.
- **v0.4 — Backend Starter. DONE.** Product, auth (login/me), user, role,
  file da migrate sang `apps/api` + `apps/admin-web`; `apps/admin-web` khong con goi
  `api-legacy` (bien `LEGACY_API_URL` da bo).
- **v0.4.5 — Backend Hardening.** OpenAPI/Swagger da xong (`/docs`, `/docs-json`,
  Zod schema sinh doc qua `zod-to-json-schema`, khong DTO class). Redis cache
  (auth user+permissions) va BullMQ (queue `notification`, job `user.welcome`)
  da xong — ADR-0002. Con lai: **idempotency** — chua co use case cu the,
  chua lam.
- **v0.5 — Integrated. DONE.** Next.js admin da thay the `admin-web-legacy`:
  Tailwind + shadcn/ui, TanStack Table, permission-aware navigation.
  `apps/api-legacy` + `apps/admin-web-legacy` da bi xoa khoi repo; seed script
  chuyen ve `apps/api/src/seed.ts`.
- **v0.6 — Spec-Driven. DONE.** Template spec (`spec/**/_template.*`), prompt library
  (skill `/new-entity`), mapping acceptance criteria -> test (AC-ID + dong `**Test:**`),
  Definition of Ready kiem tu dong mot phan (`pnpm spec:check`).
- **v0.7 — CLI.** `pnpm create rytek-cms`, `rytek doctor`.
- **v0.8+ — Production hardening.** Security headers, backup/restore runbook,
  metrics/alerting/tracing, load test, deployment + rollback runbook.
