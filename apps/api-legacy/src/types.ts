// Kieu dung chung cho Hono context + shape user chuan.
import type { Prisma } from "@prisma/client";

// Dung cho auth middleware: can day du permission keys de `can()` chay duoc.
// Chua kem `password` -> KHONG duoc tra thang shape nay ra response.
export const userWithPermissions = {
  roles: {
    where: { deletedAt: null },
    include: { role: { include: { permissions: { where: { deletedAt: null } } } } },
  },
} satisfies Prisma.UserInclude;

// Dung cho moi response co user: bo `password`.
export const userSelect = {
  id: true,
  email: true,
  name: true,
  createdAt: true,
  updatedAt: true,
  createdBy: true,
  updatedBy: true,
  deletedAt: true,
  roles: {
    where: { deletedAt: null },
    select: { role: { select: { id: true, name: true } } },
  },
} satisfies Prisma.UserSelect;

export type AuthUser = Prisma.UserGetPayload<{ include: typeof userWithPermissions }>;

export type AppEnv = { Variables: { user: AuthUser } };
