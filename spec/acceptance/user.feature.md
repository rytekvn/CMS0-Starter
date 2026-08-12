# Acceptance — Auth + User

Mo ta **hanh vi that** cua stack Hono cu (da xoa; `routes/auth.routes.ts`,
`routes/user.routes.ts` + `services/user.service.ts`) tai thoi diem viet spec.
Dung lam moc doi chieu khi migrate sang NestJS (`apps/api`): hanh vi moi phai
khop, lech cho nao phai la quyet dinh co chu dich (danh dau **[LECH]**).

Base path: `/auth`, `/users`. Moi route `/users/*` deu qua `requireAuth`.

## Chung

- **Given** request khong co header `Authorization: Bearer <token>`
  **When** goi bat ky route `/users/*` hoac `/auth/me`
  **Then** tra `401 {"error":"Unauthorized"}`
- **Given** token sai hoac het han
  **Then** tra `401 {"error":"Invalid token"}`
- **Given** token hop le nhung user da soft delete (hoac khong con ton tai)
  **Then** tra `401 {"error":"Unauthorized"}`
- **Given** user hop le nhung khong co permission tuong ung
  **Then** tra `403 {"error":"Forbidden"}`
- **Given** body khong hop le Zod
  **Then** tra `400 {"error":"Validation failed","issues":[...]}`
- **Given** record khong ton tai khi update/delete (Prisma P2025)
  **Then** tra `404 {"error":"Not found"}`
- **Given** email da ton tai (Prisma P2002)
  **Then** tra `409 {"error":"Duplicate value"}`
- **Then** field `password` **khong bao gio** xuat hien trong bat ky response nao
  (moi query doc di qua `userSelect`).

## POST /auth/login — dang nhap (public, khong can token)

- Body: `{ "email": string(email), "password": string(min 6) }`.
- **Given** email + mat khau dung **Then** `200 {"token":"<jwt>"}`,
  JWT payload `{ userId }`, `expiresIn: "7d"`, ky bang `JWT_SECRET`.
- **Given** email khong ton tai **hoac** user da soft delete **hoac** sai mat khau
  **Then** `401 {"error":"Invalid credentials"}` — **cung mot message** cho ca ba
  truong hop (khong tiet lo email nao co that).
- **Given** body thieu field / email sai dinh dang / password < 6 ky tu
  **Then** `400 {"error":"Validation failed","issues":[...]}`.
- **Then** **khong** ghi AuditLog (parity voi legacy).
- **[LECH]** `apps/api` cung ky token bang chinh `JWT_SECRET` va payload `{ userId }`
  nhu legacy -> token cua hai stack **dung lan nhau duoc**. Day la chu dich trong
  giai doan chay song song; se bien mat khi xoa `apps/*-legacy` o v0.5.

## GET /auth/me — user hien tai (chi can token hop le, khong can permission key)

- **Then** `200` + object user (`userSelect`: `id`, `email`, `name`,
  `createdAt`, `updatedAt`, `createdBy`, `updatedBy`, `deletedAt`,
  `roles: [{ role: { id, name } }]`) + `permissions: string[]`.
- **Then** `permissions` la danh sach key **phang, khong trung lap**, gom quyen
  cua moi role co `deletedAt = null` — cung phep duyet voi `can()`.
- **Given** user co role da bi soft delete
  **Then** quyen cua role do **khong** xuat hien trong `permissions`.
- **Then** `roles` chi gom `UserRole` co `deletedAt = null`.

## GET /users — danh sach (`user.read`)

- **Then** chi tra record co `deletedAt = null`.
- **Then** khong nhan query param nao (khong co filter/search/pagination).
- **[LECH]** `apps/api` sap xep `createdAt` giam dan; legacy khong co ORDER BY
  (thu tu khong on dinh). Ly do: phan trang o UI can thu tu on dinh.

## GET /users/:id — chi tiet (`user.read`)

- **Given** id ton tai va `deletedAt = null` **Then** `200` + object user.
- **Given** id khong ton tai **hoac** da soft delete
  **Then** `404 {"error":"Not found"}`.

## POST /users — tao (`user.create`)

- Body: `{ "email", "password", "name", "roleIds"?: string[] }`.
- **Given** body hop le **Then** `201`, password duoc hash bcrypt (rounds 10),
  `createdBy` va `updatedBy` = id user dang dang nhap.
- **Given** `roleIds` co gia tri **Then** tao kem row `UserRole` cho tung role,
  `createdBy`/`updatedBy` cua row noi = actor. Bo qua `roleIds` -> user khong co role nao.
- **Given** `roleIds` chua id role khong ton tai **Then** `404` (P2025 tu `connect`).
- **Given** email da ton tai **Then** `409 {"error":"Duplicate value"}`.
- **Then** ghi AuditLog `user.create`, `entity="User"`, `entityId=<user.id>`,
  `metadata={ email }`.

## PATCH /users/:id — sua (`user.update`)

- Body la ban `.partial()` cua schema tao: moi field deu tuy chon.
- **Given** body chi co mot phan field **Then** `200`, chi field do doi,
  `updatedBy` = user hien tai.
- **Given** co `password` **Then** hash lai bang bcrypt rounds 10.
  **Khong** doi hoi mat khau hien tai (parity voi legacy).
- **Given** **khong** gui `password` **Then** mat khau cu giu nguyen
  (frontend de trong o form = bo han key nay khoi payload).
- **Given** co `roleIds` **Then** **thay the toan bo** danh sach role:
  xoa cung moi row `UserRole` cu roi tao lai theo danh sach moi (khong cong don).
  `roleIds: []` -> user khong con role nao.
- **Given** **khong** gui `roleIds` **Then** danh sach role giu nguyen.
- **Then** ghi AuditLog `user.update`, `metadata={ fields: [<ten field da gui>] }`
  (ke ca `password` — chi ghi **ten** field, khong ghi gia tri).

## DELETE /users/:id — xoa mem (`user.delete`)

- **Then** `200 {"ok":true}`, record **khong bi xoa cung**: `deletedAt` duoc set,
  `updatedBy` = user hien tai.
- **Then** record bien mat khoi `GET /users` va `GET /users/:id`,
  va **khong dang nhap duoc nua** (`findUserByEmail` loc `deletedAt: null`).
- **Then** ghi AuditLog `user.delete` (khong metadata).
- **Given** user tu xoa chinh minh **Then** van thanh cong (khong bi chan) —
  parity voi legacy, token cua chinh ho tu do tra `401 Unauthorized`.

## Out of scope (chua co, dung tu them khi khong duoc yeu cau)

- Pagination / filter / search cho `GET /users` (hien tra toan bo).
- Doi mat khau bang mat khau hien tai, quen mat khau, refresh token, dang xuat
  phia server (logout chi la xoa cookie o `apps/admin-web`).
- Chan tu xoa minh / tu bo het quyen cua minh.
- Restore user da soft delete.
- Ghi AuditLog cho dang nhap.
