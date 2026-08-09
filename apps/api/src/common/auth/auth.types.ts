// Shape user chuan cho auth. Copy tu apps/api-legacy/src/types.ts (phan auth).
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
