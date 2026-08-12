# {{name}}

Sinh tu **Rytek starter**: NestJS + Next.js + Prisma/PostgreSQL + Redis,
phat trien theo Spec-Driven Development. Luat kien truc va Definition of Done:
`CLAUDE.md`. Tam nhin nen tang: `docs/rytek_platform_roadmap.md`.

Module mau (auth, user, role, file, product) di kem la **vi du song** — sua hoac
xoa theo nghiep vu that cua du an.

## Cau truc

```
apps/api                NestJS  :4000   auth, user, role, product, file
apps/admin-web          Next.js :3000   login, products, users, roles
prisma/                 schema.prisma - single source of truth cho DB
spec/                   contract nghiep vu da duyet + ADR
```

## Chay lan dau

```bash
corepack enable pnpm
pnpm install

docker compose up -d          # postgres 16 (:5432) + redis 7 (:6379), db {{db}}

cp apps/api/.env.example       apps/api/.env
cp apps/admin-web/.env.example apps/admin-web/.env

pnpm db:generate
pnpm db:migrate
pnpm db:seed                  # in ra super admin: admin@rytek.local / admin123
```

> Neu may da chay san PostgreSQL/Redis tren host — hoac dang chay mot du an
> Rytek khac — chung se chiem `localhost:5432` / `6379` / `3000` / `4000`.
> Tat chung truoc, hoac doi port trong `docker-compose.yml` va `.env`.

## Chay dev

```bash
pnpm dev:api   # NestJS  http://localhost:4000  (OpenAPI: /docs)
pnpm dev:web   # Next.js http://localhost:3000
```

## Quality gates

```bash
pnpm lint        # oxlint
pnpm typecheck   # tsc --noEmit moi project
pnpm test        # node --test
pnpm build       # nest build + next build
pnpm spec:check  # kiem cau truc spec
```
