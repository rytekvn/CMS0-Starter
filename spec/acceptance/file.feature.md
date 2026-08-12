# Acceptance — File

Mo ta **hanh vi that** cua stack Hono cu (da xoa; `routes/file.routes.ts` +
`services/file.service.ts`) tai thoi diem viet spec, va cua `apps/api`
(`modules/files/`) sau khi migrate. Hai stack da duoc doi chieu bang curl tren
cung mot file: JSON tra ve (bo `id`/`url`/`createdAt`/`updatedAt`) va **moi
status code + body loi deu trung nhau**.

Base path: `/files`. Ca 2 route deu qua `requireAuth` / `JwtAuthGuard`.

## Chung

- **Given** request khong co header `Authorization: Bearer <token>`
  **Then** `401 {"error":"Unauthorized"}`
- **Given** token sai hoac het han **Then** `401 {"error":"Invalid token"}`
- **Given** user hop le nhung khong co permission tuong ung
  **Then** `403 {"error":"Forbidden"}`
- **Given** metadata file khong hop le Zod
  **Then** `400 {"error":"Validation failed","issues":[...]}`

## POST /files — tai len (`file.upload`)

- Body: `multipart/form-data`, field **`file`**.
- **Given** khong co field ten `file` (sai ten hoac khong gui gi)
  **Then** `400 {"error":"Missing `file` field"}` — **mot loi duy nhat cho ca 2 case**.
- **Given** `mimeType` khong thuoc whitelist **Then** `400` `issues[0].path = ["mimeType"]`,
  message `"Unsupported file type"`.
- **Given** mimeType co charset (`"text/csv; charset=utf-8"`) **Then** van hop le,
  va gia tri luu vao DB da bi cat con `"text/csv"`.
- **Given** file lon hon 5 MB
  **Then** `400 {"error":"Validation failed",...}` voi `message = "File too large (max 5MB)"`.
  **KHONG phai 413** — khac `POST /products/import` (route do check size bang tay
  rieng nen tra 413). Day la nguon nham lan da tung xay ra; dung copy nhanh 413 sang.
- **Given** hop le **Then** `201` + object `FileAsset` day du
  (`id`, `url`, `filename`, `mimeType`, `size`, `createdAt`, `updatedAt`,
  `createdBy`, `updatedBy`, `deletedAt`), `createdBy`/`updatedBy` = user dang dang nhap.
- **Then** file duoc ghi vao `apps/api/uploads/<uuid>.<ext>`; `<ext>` lay tu bang
  `EXT_BY_MIME`, khong bao gio lay tu ten file user gui.
- **Then** `filename` giu nguyen unicode (`"anh mau.png"` co dau van dung).
  Rieng `apps/api`: multer mac dinh decode ten field bang `latin1` -> phai bat
  `AnyFilesInterceptor({ defParamCharset: "utf8" })`, khong thi mojibake.
- **Then** ghi AuditLog `file.upload`, `entity="FileAsset"`, `entityId=<asset.id>`,
  `metadata={ filename, size }`.

## GET /files/:id — tai ve (`file.read`)

- **Given** id ton tai, `deletedAt = null`, file con tren disk **Then** `200` + noi
  dung file **nguyen ven tung byte** (da verify bang `shasum -a 256`).
- **Then** header:
  - `Content-Type` = `mimeType` cua record
  - `Content-Length` = so byte that
  - `Content-Disposition` = `attachment; filename*=UTF-8''<encodeURIComponent(filename)>`
    (RFC 5987 — ten co unicode / dau nhay khong pha header)
- **Given** id khong ton tai **hoac** da soft delete **Then** `404 {"error":"Not found"}`.
- **Given** record con trong DB nhung file khong con tren disk
  **Then** `404 {"error":"File missing on disk"}` (khong duoc ra 500).
- **Then** duong dan doc file di qua `path.basename(url)` -> du du lieu DB bi sua tay
  cung khong doc ra ngoai thu muc uploads.

## Frontend (`apps/admin-web`)

- `components/file-uploader.tsx` — **da co san, chua trang nao dung**, dung parity
  voi component FileUploader cua stack Vite cu (da xoa; o do cung chua ai dung).
  Chon file -> upload ngay (khong co nut submit); hien `Dang tai len...` khi cho,
  `form-error` khi loi, ten + dung luong + nut `Tai ve` khi xong.
- Upload di qua **Server Action** `components/file-uploader.actions.ts` -> token
  cookie httpOnly khong bao gio ra client.
- Tai ve di qua **Route Handler** `app/api/files/[id]/route.ts`: forward
  `upstream.body` (stream) chu **khong** `.text()` — `.text()` decode UTF-8 se
  hong moi file nhi phan. Loi thi forward nguyen status + JSON cua API.

## Out of scope (chua co, dung tu them khi khong duoc yeu cau)

- `GET /files` (danh sach), `DELETE /files/:id` (xoa), sua metadata file.
- Owner check: ai co `file.read` deu tai duoc bat ky file nao neu biet id.
- Quan he giua `FileAsset` va entity khac (khong co foreign key nao).
- Doc noi dung file de xac minh mime that (chi tin `Content-Type` browser gui).
- Chong trung file (hash), quota, don file mo coi.
- Storage ngoai local disk (S3), stream that thay vi doc ca file vao RAM.
