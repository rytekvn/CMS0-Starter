# Rytek Platform

Nen tang de bat dau nhieu san pham (CMS/CRM/SaaS) tren cung mot stack:
**NestJS + Next.js + Prisma/PostgreSQL + Redis**, phat trien theo
Spec-Driven Development. Tam nhin day du: `docs/rytek_platform_roadmap.md`.

Toan bo nghiep vu da chay tren stack NestJS + Next.js. Hai app cu
(`apps/api-legacy` Hono, `apps/admin-web-legacy` Vite) da bi xoa sau khi module
cuoi cung migrate xong — xem `spec/decisions/ADR-0001-nestjs-nextjs-pnpm-monorepo.md`.

## Cau truc

```
apps/api                NestJS  :4000   auth, user, role, product, file
apps/admin-web          Next.js :3000   login, products, users, roles
prisma/                 schema.prisma - single source of truth cho DB
spec/                   contract nghiep vu da duyet + ADR
docs/                   roadmap platform
```

## Chay lan dau

```bash
corepack enable pnpm
pnpm install

docker compose up -d          # postgres 16 (:5432) + redis 7 (:6379)

cp apps/api/.env.example       apps/api/.env
cp apps/admin-web/.env.example apps/admin-web/.env

pnpm db:generate
pnpm db:migrate
pnpm db:seed                  # in ra super admin: admin@rytek.local / admin123
```

> Neu may da chay san PostgreSQL/Redis cai truc tiep tren host, chung se chiem
> `localhost:5432` / `localhost:6379` va che mat container. Tat chung truoc,
> hoac doi port publish trong `docker-compose.yml`.

## Chay dev

```bash
pnpm dev:api   # NestJS  http://localhost:4000
pnpm dev:web   # Next.js http://localhost:3000  <- login + CRUD Product/User/Role
```

Kiem tra nhanh chuoi web -> api -> db:

```bash
curl -s localhost:4000/health/ready   # {"status":"ok","db":"up"}
```

## Quality gates

```bash
pnpm lint        # oxlint
pnpm typecheck   # tsc --noEmit moi project
pnpm test        # node --test
pnpm build       # nest build + next build
```

Cung 4 lenh nay chay trong CI (`.github/workflows/ci.yml`).

## Lam viec voi AI

Doc `CLAUDE.md` truoc (luat kien truc, convention, guardrail, Definition of Done),
sau do doc spec cua entity dang lam trong `spec/`.
