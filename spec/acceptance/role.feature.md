# Acceptance — Role

Mo ta **hanh vi that** cua stack Hono cu (da xoa; `routes/role.routes.ts` +
`services/role.service.ts`) tai thoi diem viet spec. Dung lam moc doi chieu khi
migrate sang NestJS (`apps/api`): hanh vi moi phai khop, lech cho nao phai la
quyet dinh co chu dich (danh dau **[LECH]**).

Base path: `/roles`. Moi route deu qua `requireAuth`.

## [AC-ROLE-01] Chung
**Test:** chua co, da verify thu cong qua curl luc migrate
(lien quan gian tiep `apps/api/src/common/auth/can.test.ts` + `apps/api/src/common/auth/auth-cache.test.ts` — logic dung chung, khong test endpoint truc tiep)

- **Given** request khong co header `Authorization: Bearer <token>`
  **Then** `401 {"error":"Unauthorized"}`
- **Given** token sai hoac het han **Then** `401 {"error":"Invalid token"}`
- **Given** user hop le nhung khong co permission tuong ung
  **Then** `403 {"error":"Forbidden"}`
- **Given** body khong hop le Zod
  **Then** `400 {"error":"Validation failed","issues":[...]}`
- **Given** record khong ton tai khi update/delete (Prisma P2025)
  **Then** `404 {"error":"Not found"}`
- **Given** ten role da ton tai (Prisma P2002)
  **Then** `409 {"error":"Duplicate value"}`
- **Then** moi response role deu `include` mang `permissions` day du
  (chi Permission co `deletedAt = null`).

## [AC-ROLE-02] GET /roles — danh sach (`role.read`)
**Test:** chua co, da verify thu cong qua curl luc migrate

- **Then** chi tra record co `deletedAt = null`, kem `permissions`.
- **Then** khong nhan query param nao.
- **[LECH]** `apps/api` sap xep `createdAt` giam dan; legacy khong co ORDER BY.

## [AC-ROLE-03] GET /roles/permissions — danh sach permission co the gan (`role.read`)
**Test:** chua co, da verify thu cong qua curl luc migrate

- **[LECH] Endpoint moi, chi co o `apps/api`** — legacy khong co. Ly do: form gan
  quyen o `apps/admin-web` can danh sach key de render checkbox; khong tao
  module/CRUD Permission rieng vi day la du lieu tham chieu do seed so huu.
- **Then** `200` + `Permission[]` (chi record `deletedAt = null`), hien tai 17 key
  do `apps/api/src/seed.ts` tao ra.
- **Then** route nay duoc khai bao **truoc** `/:id` de khong bi route param nuot mat
  (khong duoc tra `404 {"error":"Not found"}`).

## [AC-ROLE-04] GET /roles/:id — chi tiet (`role.read`)
**Test:** chua co, da verify thu cong qua curl luc migrate

- **Given** id ton tai va `deletedAt = null` **Then** `200` + object role kem `permissions`.
- **Given** id khong ton tai **hoac** da soft delete **Then** `404 {"error":"Not found"}`.

## [AC-ROLE-05] POST /roles — tao (`role.create`)
**Test:** chua co, da verify thu cong qua curl luc migrate

- Body: `{ "name": string(min 1), "permissionKeys"?: string[] }`.
- **Then** `201`, `createdBy`/`updatedBy` = id user dang dang nhap,
  cac `Permission` co `key` tuong ung duoc `connect` vao role.
- **Given** bo qua `permissionKeys` **Then** role duoc tao nhung khong co quyen nao.
- **Given** `permissionKeys` chua key khong ton tai **Then** `404` (P2025 tu `connect`).
- **Given** `name` da ton tai **Then** `409 {"error":"Duplicate value"}`.
- **Then** ghi AuditLog `role.create`, `entity="Role"`, `entityId=<role.id>`,
  `metadata={ name }`.

## [AC-ROLE-06] PATCH /roles/:id — sua (`role.update`)
**Test:** chua co, da verify thu cong qua curl luc migrate

- Body la ban `.partial()` cua schema tao.
- **Given** co `permissionKeys` **Then** dung `set` — **thay the toan bo** danh sach
  quyen, **khong cong don**. `permissionKeys: []` -> role khong con quyen nao.
- **Given** **khong** gui `permissionKeys` **Then** danh sach quyen giu nguyen.
- **Given** co `name` **Then** doi ten; `updatedBy` = user hien tai.
- **Then** ghi AuditLog `role.update`, `metadata={ fields: [<ten field da gui>] }`.
- **Then** thay doi quyen cua role co hieu luc **ngay o request ke tiep** cua moi
  user dang gan role do (guard load lai quyen tu DB moi request, khong cache).

## [AC-ROLE-07] DELETE /roles/:id — xoa mem (`role.delete`)
**Test:** chua co, da verify thu cong qua curl luc migrate

- **Then** `200 {"ok":true}`, `deletedAt` duoc set, `updatedBy` = user hien tai.
- **Then** role bien mat khoi `GET /roles` va `GET /roles/:id`.
- **Given** role dang duoc gan cho user **Then** van xoa duoc (khong bi chan) —
  parity voi legacy. Row `UserRole` van con, nhung user do **mat ngay** cac quyen
  den tu role nay (`can()` loc `role.deletedAt === null`), va role bien mat khoi
  `permissions` cua `GET /auth/me`.
- **Then** ghi AuditLog `role.delete` (khong metadata).

## Out of scope (chua co, dung tu them khi khong duoc yeu cau)

- CRUD cho `Permission` (17 key do seed so huu, chi doc).
- Pagination / filter cho `GET /roles` (tap nho co dinh).
- Chan xoa role dang duoc gan, chan xoa role he thong (`super_admin`...).
- Restore role da soft delete (seed chay lai se set `deletedAt = null` cho 4 role mac dinh).
