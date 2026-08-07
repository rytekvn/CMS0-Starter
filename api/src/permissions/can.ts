// Helper permission thong nhat: can(user, "product.create")
// Quyen den tu DB: User -> UserRole -> Role -> Permission (load san o auth middleware).
// ponytail: check tren mang da load, chua co cache - them khi so query thanh nut co chai
import type { AuthUser } from "../types";

export function can(user: AuthUser, permissionKey: string): boolean {
  return user.roles.some(
    (ur) =>
      ur.role.deletedAt === null &&
      ur.role.permissions.some((p) => p.key === permissionKey)
  );
}
