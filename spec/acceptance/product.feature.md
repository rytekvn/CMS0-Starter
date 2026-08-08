# Acceptance — Product

Mo ta **hanh vi that** cua `apps/api-legacy` (`routes/product.routes.ts` +
`services/product.service.ts`) tai thoi diem viet spec. Dung lam moc doi chieu
khi migrate module nay sang NestJS (`apps/api`): hanh vi moi phai khop, lech
cho nao phai la quyet dinh co chu dich.

Base path: `/products`. Moi route deu qua `requireAuth`.

## Chung

- **Given** request khong co header `Authorization: Bearer <token>`
  **When** goi bat ky route `/products/*`
  **Then** tra `401 {"error":"Unauthorized"}`
- **Given** token sai hoac het han
  **Then** tra `401 {"error":"Invalid token"}`
- **Given** user hop le nhung khong co permission tuong ung
  **Then** tra `403 {"error":"Forbidden"}`
- **Given** body khong hop le Zod
  **Then** tra `400 {"error":"Validation failed","issues":[...]}`
- **Given** record khong ton tai khi update/delete (Prisma P2025)
  **Then** tra `404 {"error":"Not found"}`

## GET /products — danh sach (`product.read`)

- **Then** chi tra record co `deletedAt = null`, sap xep `createdAt` giam dan.
- **Given** query `status=active|inactive` **Then** loc dung trang thai do.
- **Given** query `search=<text>` **Then** loc `name` chua `<text>`,
  **khong phan biet hoa thuong**.
- **Given** query `createdFrom=2026-01-01` **Then** loc `createdAt >= 2026-01-01T00:00:00Z`.
- **Given** query `createdTo=2026-01-31` (dang `yyyy-mm-dd`)
  **Then** hieu la **het ngay** `2026-01-31T23:59:59.999Z`, khong phai 00:00.
- **Given** query rong (`?status=`) — form gui khi chua chon gi
  **Then** coi nhu khong loc, khong bao loi.

## GET /products/:id — chi tiet (`product.read`)

- **Given** id ton tai va `deletedAt = null` **Then** `200` + object product.
- **Given** id khong ton tai **hoac** da soft delete
  **Then** `404 {"error":"Not found"}`.

## POST /products — tao (`product.create`)

- **Given** body `{"name":"Ao thun"}` **Then** `201`, `status` mac dinh `"active"`,
  `createdBy` va `updatedBy` = id user dang dang nhap.
- **Given** `name` rong **Then** `400`.
- **Given** `status` khong thuoc `active|inactive` **Then** `400`.
- **Then** ghi AuditLog `product.create`, `entity="Product"`,
  `entityId=<product.id>`, `metadata={ name }`.

## PATCH /products/:id — sua (`product.update`)

- **Given** body chi co mot phan field (vd `{"name":"..."}`)
  **Then** `200`, chi field do doi, `updatedBy` = user hien tai.
- **Then** ghi AuditLog `product.update`, `metadata={ fields: [<ten field da gui>] }`.

## DELETE /products/:id — xoa mem (`product.delete`)

- **Then** `200 {"ok":true}`, record **khong bi xoa cung**: `deletedAt` duoc set,
  `updatedBy` = user hien tai.
- **Then** record bien mat khoi `GET /products` va `GET /products/:id`.
- **Then** ghi AuditLog `product.delete` (khong metadata).

## GET /products/export — xuat CSV (`product.export`)

- **Then** `200`, `Content-Type: text/csv; charset=utf-8`,
  `Content-Disposition: attachment; filename="products.csv"`.
- **Then** header CSV la `id,name,status,createdAt`; `createdAt` dang ISO 8601.
- **Then** ap dung **cung bo filter** nhu `GET /products`.
- **Then** route nay duoc khai bao truoc `/:id` de khong bi route param nuot mat.

## POST /products/import — nhap CSV (`product.import`)

- Request la `multipart/form-data`, field ten `file`.
- **Given** thieu field `file` **Then** `400 {"error":"Missing \`file\` field"}`.
- **Given** file > 5MB **Then** `413 {"error":"File too large (max 5MB)"}`.
- **Given** header CSV khong co cot `name` (so khop khong phan biet hoa thuong)
  **Then** `{"success":0,"failed":0,"errors":[{"row":1,"message":"Missing \`name\` column"}]}`.
- **Then** cot thua (`id`, `createdAt`) bi bo qua -> file export ra **import lai duoc**.
- **Then** dong trong hoan toan bi bo qua, khong tinh la loi.
- **Then** moi dong duoc validate bang dung `createProductSchema`; dong loi
  duoc bao theo so dong that (`row`, tinh tu 2 vi dong 1 la header) va
  **khong** chan cac dong hop le khac duoc ghi.
- **Then** tra `{ success, failed, errors[] }` va ghi AuditLog `product.import`
  voi `entityId="*"`, `metadata={ success, failed }`.

## POST /products/bulk — hanh dong hang loat (`product.bulk`)

- Body: `{ "ids": string[], "action": "delete" | "activate" | "deactivate" }`.
- **Given** `ids` rong hoac > 500 phan tu **Then** `400`.
- **Given** `action="delete"` **Then** set `deletedAt` cho cac id (soft delete).
- **Given** `action="activate"|"deactivate"` **Then** set `status` tuong ung.
- **Then** chi tac dong len record `deletedAt = null` — **khong "hoi sinh"**
  record da xoa mem.
- **Then** tra `{ "count": <so record that su doi> }`.
- **Then** ghi AuditLog `product.bulk.<action>` voi `entityId="*"`,
  `metadata={ ids, action, count }`.

## Out of scope (chua co, dung tu them khi khong duoc yeu cau)

- Pagination cho `GET /products` (hien tra toan bo ket qua sau filter).
- Restore record da soft delete.
- Enum `status` cuong che o tang database.
