# Acceptance — <EntityName>

Mo ta **hanh vi that** cua `apps/api/src/modules/<module>/` tai thoi diem viet spec.
Dung lam moc doi chieu khi sua module nay: hanh vi moi phai khop, lech cho nao phai
la quyet dinh co chu dich (danh dau **[LECH]**).

Base path: `/<entity>`. Moi route deu qua `requireAuth`.

## [AC-<ENTITY>-01] Chung

**Test:** chua co, da verify thu cong qua curl luc migrate

- **Given** khong co header `Authorization: Bearer <token>` **Then** `401 {"error":"Unauthorized"}`
- **Given** token sai/het han **Then** `401 {"error":"Invalid token"}`
- **Given** hop le nhung thieu permission **Then** `403 {"error":"Forbidden"}`
- **Given** body khong hop le Zod **Then** `400 {"error":"Validation failed","issues":[...]}`
- **Given** record khong ton tai khi update/delete (P2025) **Then** `404 {"error":"Not found"}`

## [AC-<ENTITY>-02] GET /<entity> — danh sach (`<entity>.read`)
**Test:** chua co, da verify thu cong qua curl luc migrate
- **Then** chi tra record `deletedAt = null`, sap xep `<defaultOrder>`.

## [AC-<ENTITY>-03] GET /<entity>/:id — chi tiet (`<entity>.read`)
**Test:** chua co, da verify thu cong qua curl luc migrate
- **Given** id ton tai, `deletedAt=null` **Then** `200`. **Given** khong ton tai/da xoa **Then** `404`.

## [AC-<ENTITY>-04] POST /<entity> — tao (`<entity>.create`)
**Test:** chua co, da verify thu cong qua curl luc migrate
- **Given** body hop le **Then** `201`, `createdBy`/`updatedBy` = user hien tai.
- **Then** ghi AuditLog `<entity>.create`.

## [AC-<ENTITY>-05] PATCH /<entity>/:id — sua (`<entity>.update`)
**Test:** chua co, da verify thu cong qua curl luc migrate
- **Then** ghi AuditLog `<entity>.update`, `metadata={fields:[...]}`.

## [AC-<ENTITY>-06] DELETE /<entity>/:id — xoa mem (`<entity>.delete`)
**Test:** chua co, da verify thu cong qua curl luc migrate
- **Then** `200 {"ok":true}`, `deletedAt` set (khong xoa cung), ghi AuditLog `<entity>.delete`.

<!-- Them heading rieng cho action khac (export/import/bulk/upload...), GIU DUNG cau truc
     "## [AC-<ENTITY>-0N] <METHOD> <path> — <ten> (`<permission-key>`)" + dong "**Test:**". -->

## Out of scope (chua co, dung tu them khi khong duoc yeu cau)
- <liet ke ro nhung gi CHUA lam>
