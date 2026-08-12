// Shape user chuan cho auth. Khop voi shape cua stack Hono cu truoc khi migrate.
import type { Prisma } from "@prisma/client";

// Dung cho JwtAuthGuard: can day du permission keys de `can()` chay duoc.
// Chua kem `password` -> KHONG duoc tra thang shape nay ra response.
export const userWithPermissions = {
  roles: {
    where: { deletedAt: null },
    include: { role: { include: { permissions: { where: { deletedAt: null } } } } },
  },
} satisfies Prisma.UserInclude;

export type AuthUser = Prisma.UserGetPayload<{ include: typeof userWithPermissions }>;
