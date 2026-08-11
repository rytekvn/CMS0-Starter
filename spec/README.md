# spec/ — Spec-Driven Development

Spec la **contract da duoc review** giua product, engineering, QA va AI.
AI khong tu suy dien yeu cau quan trong tu mot cau mo ta ngan: cai gi khong
co trong spec thi phai hoi, khong duoc doan.

Cau truc day du tham chieu `docs/rytek_platform_roadmap.md` §8.2. Repo nay
**chi tao thu muc khi da co noi dung that** — khong tao thu muc rong de "cho
san". Cac thu muc con thieu (`product/`, `features/`, `workflows/`, `api/`,
`ui/`, `non-functional/`) se duoc tao khi feature dau tien can den.

## Dang co

```text
spec/
├── README.md                      <- file nay
├── entities/                      <- data model + field + validation + audit event
│   ├── product.yaml
│   ├── user.yaml
│   ├── role.yaml
│   └── file.yaml
├── permissions/                   <- ma tran role x permission
│   ├── product.yaml
│   ├── user.yaml
│   ├── role.yaml
│   └── file.yaml
├── acceptance/                    <- acceptance criteria kiem thu duoc
│   ├── product.feature.md
│   ├── user.feature.md            <- gom ca /auth/login + /auth/me
│   ├── role.feature.md
│   └── file.feature.md
└── decisions/
    └── ADR-0001-nestjs-nextjs-pnpm-monorepo.md
```

## Nguon su that cua spec hien tai

Moi spec deu duoc map **1:1 tu code dang chay** (`apps/api-legacy`), khong
phai thiet ke moi:

| Spec | Map tu |
|---|---|
| `entities/product.yaml` | `prisma/schema.prisma` (model `Product`) + `apps/api-legacy/src/schemas/product.schema.ts` |
| `permissions/product.yaml` | `apps/api-legacy/src/seed.ts` (`ROLE_PERMISSIONS`) |
| `acceptance/product.feature.md` | `apps/api-legacy/src/routes/product.routes.ts` + `services/product.service.ts` |
| `entities/user.yaml` | `prisma/schema.prisma` (model `User`, `UserRole`) + `apps/api-legacy/src/schemas/user.schema.ts` + `types.ts` (`userSelect`) |
| `permissions/user.yaml` | `apps/api-legacy/src/seed.ts` (`ROLE_PERMISSIONS`) |
| `acceptance/user.feature.md` | `apps/api-legacy/src/routes/{auth,user}.routes.ts` + `services/user.service.ts` |
| `entities/role.yaml` | `prisma/schema.prisma` (model `Role`, `Permission`) + `apps/api-legacy/src/schemas/role.schema.ts` |
| `permissions/role.yaml` | `apps/api-legacy/src/seed.ts` (`ROLE_PERMISSIONS`) |
| `acceptance/role.feature.md` | `apps/api-legacy/src/routes/role.routes.ts` + `services/role.service.ts` |
| `entities/file.yaml` | `prisma/schema.prisma` (model `FileAsset`) + `apps/api-legacy/src/schemas/file.schema.ts` |
| `permissions/file.yaml` | `apps/api-legacy/src/seed.ts` (`ROLE_PERMISSIONS`) |
| `acceptance/file.feature.md` | `apps/api-legacy/src/routes/file.routes.ts` + `services/file.service.ts` |

Vi vay day la **spec mo ta hien trang**, dung lam mau va lam moc doi chieu khi
migrate module sang NestJS (`apps/api`). Khi hanh vi that va spec lech
nhau: **bao conflict, khong sua spec cho khop code**.

Cho nao `apps/api` co y lam khac legacy deu duoc danh dau **[LECH]** ngay trong
spec (vd `orderBy: createdAt desc` cho `GET /users` va `GET /roles`,
endpoint moi `GET /roles/permissions`) — day la quyet dinh co chu dich, khong
phai bug.

## Quy tac

- Feature chi san sang trien khai khi dat Definition of Ready (roadmap §8.4).
- Spec da duyet **khong duoc AI sua tham lang**; moi thay doi phai la mot
  thay doi co chu dich, co nguoi duyet.
- Moi entity moi can toi thieu: `entities/<name>.yaml`,
  `permissions/<name>.yaml`, `acceptance/<name>.feature.md`.
- Quyet dinh kien truc co anh huong lau dai -> them ADR trong `decisions/`.
