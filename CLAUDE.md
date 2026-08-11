# CLAUDE.md — Rytek Platform

## Project Context

Day **khong phai mot CMS don le**. Muc tieu la mot **platform** de sinh ra
nhieu san pham (CMS/CRM/SaaS) tren cung mot nen: NestJS + Next.js + Prisma/
PostgreSQL + Redis, phat trien theo Spec-Driven Development.

Kien truc hien tai — **hai stack chay song song co chu dich**:

```
apps/api             NestJS  :4000   dang chay that: auth (login/me), user, role, file (upload/download), Product (CRUD, filter, CSV export/import, bulk action)
apps/admin-web       Next.js :3000   dang chay that: /login, /products, /users, /roles (list, new, detail, edit)
apps/api-legacy      Hono    :3001   khong con module nghiep vu nao chua migrate - chi con de phuc vu admin-web-legacy
apps/admin-web-legacy Vite   :5173   dang chay that: login, dashboard, module products (van goi api-legacy)
prisma/              schema.prisma - single source of truth cho DB (dung chung)
spec/                contract nghiep vu da duyet
docs/                roadmap platform
packages/            (chua co package nao - tao khi co consumer that)
```

`*-legacy` la **no ky thuat co han**: chi xoa khi module nghiep vu cuoi cung
da migrate sang `apps/api` + `apps/admin-web`. **Da xong het** — product, auth,
user, role, file deu da co o `apps/api`; `apps/api-legacy` khong con module
nghiep vu nao chua migrate. Diem chan cuoi cung la frontend:
`apps/admin-web-legacy` chua migrate them man hinh nao va van can `apps/api-legacy`
de chay — hai stack van song song cho den v0.5.

**Ca hai API deu ky JWT** bang chung `JWT_SECRET` va chung payload `{ userId }`
tren chung mot bang `User`, nen token dung lan nhau duoc. Day khong phai nguon
su that kep (chi 1 DB) va se bien mat khi xoa `apps/*-legacy`.

Ly do va cac phuong an da loai: `spec/decisions/ADR-0001-nestjs-nextjs-pnpm-monorepo.md`.

## Required Reading

Doc theo dung thu tu nay truoc khi code (roadmap §9.2):

1. File nay.
2. `spec/README.md` + spec cua entity dang lam
   (`spec/entities/*.yaml`, `spec/permissions/*.yaml`, `spec/acceptance/*.feature.md`).
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
pnpm test                        # node --test qua tsx
pnpm build                       # nest build + next build + vite build

pnpm dev:api                     # NestJS  :4000
pnpm dev:web                     # Next.js :3000
pnpm dev:legacy:api              # Hono    :3001
pnpm dev:legacy:web              # Vite    :5173
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
- Khong sua file trong `apps/*-legacy/src/**` tru khi dang migrate co chu dich.

## UI Rules

- Dung **semantic token** trong `apps/admin-web/app/globals.css`
  (`var(--primary)`, `var(--text-muted)`, ...). **Khong hard-code ma mau.**
- Tailwind + shadcn/ui hoan sang v0.4 — chua cai, dung tu them.
- Trang danh sach/chi tiet phai co du state: **loading, empty, error, no-permission**.
- Tai su dung component da co; khong tao wrapper chi de doi ten.
- Module frontend legacy (chi ap dung cho `apps/admin-web-legacy`, dang giu
  nguyen, khong migrate them) giu nguyen pattern cua
  `apps/admin-web-legacy/src/modules/products/`
  (`list.tsx`, `create.tsx`, `edit.tsx`, `detail.tsx`, `schema.ts`, `api.ts`, `permissions.ts`).
- Module frontend moi (`apps/admin-web`, Next.js App Router): vi tri file do
  URL route quyet dinh — `app/(app)/<entity>/{page.tsx, new/page.tsx, [id]/page.tsx,
  [id]/edit/page.tsx}`. Van giu du cac file "quan tam" tuong duong module cu trong
  cung thu muc: `schema.ts`, `api.ts`, `permissions.ts`, `actions.ts` (Server Actions
  cho write), `<entity>-table.tsx` / `<entity>-form.tsx` / `<entity>-filters.tsx`
  (Client Component cho phan tuong tac). Component dung chung nhieu entity
  (DataTable, PageHeader, Pagination, StatusBadge, ConfirmDialog, Sidebar, Header,
  Breadcrumb) nam o `apps/admin-web/components/`, khong lap lai trong tung module.

## Backend Rules

- **Validation:** moi input tu ngoai vao phai qua schema Zod + `ZodValidationPipe`
  — dung chung cho ca legacy va `apps/api`, **khong dung class-validator/DTO**
  (quyet dinh da chot: tranh 2 nguon su that validate lech nhau khi 2 stack chay
  song song, xem `spec/decisions/ADR-0001-nestjs-nextjs-pnpm-monorepo.md`).
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
  tra 503 khi DB down.
- Idempotency va queue (BullMQ): chua co. Khi lam, theo roadmap §7.7/§7.8.

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
- **v0.4.5 — Backend Hardening.** OpenAPI, Redis cache, BullMQ, idempotency.
- **v0.5 — Integrated.** Next.js admin thay the `admin-web-legacy`:
  Tailwind + shadcn/ui, TanStack Table, permission-aware navigation.
  Xoa `apps/*-legacy` khi module cuoi migrate xong.
- **v0.6 — Spec-Driven.** Template spec, prompt library, mapping
  acceptance criteria -> test, Definition of Ready/Done kiem tu dong mot phan.
- **v0.7 — CLI.** `pnpm create rytek-cms`, `rytek doctor`.
- **v0.8+ — Production hardening.** Security headers, backup/restore runbook,
  metrics/alerting/tracing, load test, deployment + rollback runbook.
