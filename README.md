# Rytek CMS Starter

Template CMS toi gian de tai su dung cho nhieu du an. Da co san: Login,
Dashboard, User/Role/Permission, Audit Log, va 1 module CRUD mau
(`products`).

## Cau truc

```
admin-web/   React frontend
api/         Hono backend
prisma/      schema.prisma
docs/        tai lieu bo sung
```

## Cach dung

1. Copy thu muc nay sang du an moi.
2. Doc `CLAUDE.md` de biet convention va rule.
3. Yeu cau Claude Code tao module moi theo dung pattern cua
   `admin-web/src/modules/products/` (list/create/edit/detail/schema/api/permissions).
4. Copy `api/.env.example` sang `api/.env`, dien `DATABASE_URL` +
   `JWT_SECRET`, chinh `prisma/schema.prisma` theo domain.

```bash
cd api
npm install
npm run db:migrate   # prisma migrate dev (schema o ../prisma)
npm run db:seed      # 4 role mac dinh + permission mau + 1 super admin
npm run dev          # http://localhost:3001
```

## Trang thai v0.1

Backend da chay that: login bcrypt + JWT, RBAC qua DB (`can()`),
User/Role/Product CRUD (soft delete) co check quyen va ghi AuditLog.
Frontend `admin-web/` van con la khung.
