// Helper permission thong nhat: can(user, "product.create")
// Quyen den tu DB: User -> UserRole -> Role -> Permission (load san o JwtAuthGuard).
// ponytail: check tren mang da load, chua co cache - them khi so query thanh nut co chai
import type { AuthUser } from "./auth.types";

export function can(user: AuthUser, permissionKey: string): boolean {
  return user.roles.some(
    (ur) =>
      ur.role.deletedAt === null &&
      ur.role.permissions.some((p) => p.key === permissionKey)
  );
}

// Danh sach key phang (khong trung) cho GET /auth/me: frontend dung de an/hien UI
// ma khong phai goi them /roles. Cung phep duyet voi can() - role da soft delete
// khong con cap quyen -> hai ham khong the lech nhau.
export function permissionKeys(user: AuthUser): string[] {
  return [
    ...new Set(
      user.roles
        .filter((ur) => ur.role.deletedAt === null)
        .flatMap((ur) => ur.role.permissions.map((p) => p.key))
    ),
  ];
}
