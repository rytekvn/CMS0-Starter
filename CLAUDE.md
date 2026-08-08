# CLAUDE.md — Rytek Platform

## Project Context

Day **khong phai mot CMS don le**. Muc tieu la mot **platform** de sinh ra
nhieu san pham (CMS/CRM/SaaS) tren cung mot nen: NestJS + Next.js + Prisma/
PostgreSQL + Redis, phat trien theo Spec-Driven Development.

Kien truc hien tai — **hai stack chay song song co chu dich**:

```
apps/api             NestJS  :4000   skeleton moi (health, logging, PrismaService)
apps/admin-web       Next.js :3000   skeleton moi (1 trang trang thai end-to-end)
apps/api-legacy      Hono    :3001   dang chay that: auth, user, role, product, file
apps/admin-web-legacy Vite   :5173   dang chay that: login, dashboard, module products
prisma/              schema.prisma - single source of truth cho DB (dung chung)
spec/                contract nghiep vu da duyet
docs/                roadmap platform
packages/            (chua co package nao - tao khi co consumer that)
```

`*-legacy` la **no ky thuat co han**: chi xoa khi module nghiep vu cuoi cung
da migrate sang `apps/api` + `apps/admin-web`. Chua migrate nghiep vu nao.

Ly do va cac phuong an da loai: `spec/decisions/ADR-0001-nestjs-nextjs-pnpm-monorepo.md`.

## Required Reading

Doc theo dung thu tu nay truoc khi code (roadmap §9.2):

1. File nay.
2. `spec/README.md` + spec cua entity dang lam
   (`spec/entities/*.yaml`, `spec/permissions/*.yaml`, `spec/acceptance/*.feature.md`).
3. `spec/decisions/` — ADR lien quan.
4. `docs/rytek_platform_roadmap.md` — §5 tech stack, §8 spec, §9 AI workflow, §18 quyet dinh da chot.
5. Module gan nhat da co + test cua no (mau: `apps/api-legacy/src/{routes,services,schemas}/product.*`).

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
- Module frontend legacy giu nguyen pattern cua
  `apps/admin-web-legacy/src/modules/products/`
  (`list.tsx`, `create.tsx`, `edit.tsx`, `detail.tsx`, `schema.ts`, `api.ts`, `permissions.ts`).

## Backend Rules

- **Validation:** moi input tu ngoai vao phai qua schema (Zod o legacy,
  DTO + ValidationPipe khi lam tren NestJS). Khong tin body/query.
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
- **v0.3 — Foundations (dot hien tai).** pnpm monorepo, NestJS + Next.js skeleton,
  Docker Compose (Postgres + Redis), health + structured log + request ID,
  `spec/` + ADR, CI lint/typecheck/test/build.
- **v0.4 — Backend Starter.** Migrate auth/user/role/product sang NestJS:
  guard, DTO, error contract, OpenAPI, Redis cache, BullMQ, idempotency.
- **v0.5 — Integrated.** Next.js admin thay the `admin-web-legacy`:
  Tailwind + shadcn/ui, TanStack Table, permission-aware navigation.
  Xoa `apps/*-legacy` khi module cuoi migrate xong.
- **v0.6 — Spec-Driven.** Template spec, prompt library, mapping
  acceptance criteria -> test, Definition of Ready/Done kiem tu dong mot phan.
- **v0.7 — CLI.** `pnpm create rytek-cms`, `rytek doctor`.
- **v0.8+ — Production hardening.** Security headers, backup/restore runbook,
  metrics/alerting/tracing, load test, deployment + rollback runbook.
