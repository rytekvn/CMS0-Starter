# CLAUDE.md — Rytek CMS Starter

## Folder Structure

```
admin-web/   React frontend (layout, auth, components, pages, modules)
api/         Hono backend (routes, services, schemas, middlewares, auth, permissions, logging)
prisma/      schema.prisma - single source of truth cho DB
docs/        tai lieu bo sung
```

Module moi trong `admin-web/src/modules/<name>/` copy dung pattern cua
`products/`: `list.tsx`, `create.tsx`, `edit.tsx`, `detail.tsx`, `schema.ts`,
`api.ts`, `permissions.ts`. Khong doi cau truc file.

## Coding Convention

- TypeScript, khong dung `any`.
- Component React: function component, khong class.
- Service layer (`api/src/services`) la noi duy nhat goi Prisma; route
  khong query truc tiep.

## API Rules

- Moi route can auth (tru `/auth/login`) di qua `requireAuth` middleware.
- Kiem tra quyen bang `can(user, "entity.action")` truoc khi thuc hien
  hanh dong ghi.
- Validate input bang Zod schema trong `api/src/schemas`.
- Hanh dong tao/sua/xoa phai ghi `AuditLog` qua `logging/audit.ts`.

## Database Rules

- Moi model co: `createdAt`, `updatedAt`, `createdBy`, `updatedBy`,
  `deletedAt`.
- Xoa la soft delete (`deletedAt`), khong xoa cung.
- Query list phai loc `deletedAt: null`.

## Release Process

- v0.1: Login, Dashboard, User, Role, Permission, Audit Log, 1 CRUD mau.
- v0.2: Upload, Import/Export, Bulk Action, Advanced Filter.
- v0.3: CLI khoi tao du an (`pnpm create rytek-cms`).
