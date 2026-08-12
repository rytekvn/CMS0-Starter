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
    ├── ADR-0001-nestjs-nextjs-pnpm-monorepo.md
    └── ADR-0002-redis-cache-bullmq.md
```

## Nguon su that cua spec hien tai

Moi spec deu duoc map **1:1 tu code dang chay**, khong phai thiet ke moi.
Spec viet ra tu `apps/api-legacy` (Hono) khi do la code dang chay; sau khi
migrate xong va xoa legacy, nguon su that la `apps/api` (NestJS):

| Spec | Map tu |
|---|---|
| `entities/product.yaml` | `prisma/schema.prisma` (model `Product`) + `apps/api/src/modules/products/product.schema.ts` |
| `permissions/product.yaml` | `apps/api/src/seed.ts` (`ROLE_PERMISSIONS`) |
| `acceptance/product.feature.md` | `apps/api/src/modules/products/product.controller.ts` + `product.service.ts` |
| `entities/user.yaml` | `prisma/schema.prisma` (model `User`, `UserRole`) + `apps/api/src/modules/users/user.schema.ts` + `users/user.service.ts` (`userSelect`) |
| `permissions/user.yaml` | `apps/api/src/seed.ts` (`ROLE_PERMISSIONS`) |
| `acceptance/user.feature.md` | `apps/api/src/modules/{auth/auth.controller.ts,users/user.controller.ts}` + `users/user.service.ts` |
| `entities/role.yaml` | `prisma/schema.prisma` (model `Role`, `Permission`) + `apps/api/src/modules/roles/role.schema.ts` |
| `permissions/role.yaml` | `apps/api/src/seed.ts` (`ROLE_PERMISSIONS`) |
| `acceptance/role.feature.md` | `apps/api/src/modules/roles/role.controller.ts` + `role.service.ts` |
| `entities/file.yaml` | `prisma/schema.prisma` (model `FileAsset`) + `apps/api/src/modules/files/file.schema.ts` |
| `permissions/file.yaml` | `apps/api/src/seed.ts` (`ROLE_PERMISSIONS`) |
| `acceptance/file.feature.md` | `apps/api/src/modules/files/file.controller.ts` + `file.service.ts` |

Vi vay day la **spec mo ta hien trang**, dung lam mau va lam moc doi chieu khi
them module moi. Khi hanh vi that va spec lech nhau: **bao conflict, khong sua
spec cho khop code**.

Cac cho danh dau **[LECH]** trong spec la noi `apps/api` co y lam khac hanh vi
legacy khi migrate (vd `orderBy: createdAt desc` cho `GET /users` va `GET /roles`,
endpoint moi `GET /roles/permissions`) — quyet dinh co chu dich, khong phai bug.
Giu lai de doi chieu lich su; hanh vi dung la hanh vi cua `apps/api`.

## Quy tac

- Feature chi san sang trien khai khi dat Definition of Ready (roadmap §8.4).
- Spec da duyet **khong duoc AI sua tham lang**; moi thay doi phai la mot
  thay doi co chu dich, co nguoi duyet.
- Moi entity moi can toi thieu: `entities/<name>.yaml`,
  `permissions/<name>.yaml`, `acceptance/<name>.feature.md`.
- Quyet dinh kien truc co anh huong lau dai -> them ADR trong `decisions/`.

## Dung template cho entity moi

Khi them entity moi, copy 4 file `_template.*` sang ten entity that va dien
theo huong dan comment trong tung file — khong tu bo sung hay bot cau truc:

- `entities/_template.yaml` -> `entities/<name>.yaml`
- `permissions/_template.yaml` -> `permissions/<name>.yaml`
- `acceptance/_template.feature.md` -> `acceptance/<name>.feature.md`
- `decisions/_template.md` -> `decisions/ADR-<NNNN>-<slug>.md` (chi khi co
  quyet dinh kien truc that su can luu lai, khong phai moi entity deu can ADR)

Template rut tu doi chieu ca 4 entity that dang co (`product`, `user`, `role`,
`file`) — field/muc chi dung khi can (writeOnly, readOnly, relations,
referenceData, ...) duoc ghi ro trong comment, khong bat buoc dien het.

## Quy uoc AC-ID va mapping test

Moi heading `##` trong `acceptance/*.feature.md` (tru "Out of scope") bat dau
bang mot ID dang `[AC-<ENTITY>-NN]` (2 chu so, vd `[AC-PRODUCT-01]`), va co
mot dong `**Test:**` ngay duoi heading tro toi file test lien quan:

- Tro cap **file**, khong cap dong, de tranh rã theo so dong doi.
- Neu chi cover mot phan hanh vi (vd chi test Zod schema, chua test route
  HTTP that), ghi ro "mot phan — <duong dan file test>" kem ly do ngan.
- Neu chua co test tu dong, ghi `**Test:** chua co, da verify thu cong qua
  curl luc migrate`.

Repo nay **khong dung `test()`/`describe()` cua `node:test`** — toan bo file
test la script `assert` thuan (`node:assert/strict`, top-level). Vi vay AC-ID
gan vao **heading spec**, khong gan vao ten ham test (khong ton tai).

Dong "chua co test" phan anh **hien trang that**, khong phai backlog bat
buoc phai lam ngay — dung tu them test chi de lap day dong nay khi khong
duoc yeu cau.
