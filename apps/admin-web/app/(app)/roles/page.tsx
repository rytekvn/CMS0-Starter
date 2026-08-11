// List Roles - Server Component that. Khong phan trang: tap role nho va co dinh.
import { requireUser } from "@/lib/session";
import { listRoles } from "./api";
import { rolePermissions } from "./permissions";
import { RoleTable } from "./role-table";

export default async function RolesPage() {
  const user = await requireUser();
  const has = (key: string) => user.permissions.includes(key);

  // Vao thang URL ma khong co quyen: backend cung chan (403), o day chan som
  // de hien thong bao ro rang thay vi mot dong loi.
  if (!has(rolePermissions.read))
    return <p className="py-6 text-muted-foreground">Ban khong co quyen xem danh sach role.</p>;

  const roles = await listRoles();

  return (
    <RoleTable
      rows={roles}
      // An o UI chi la UX; backend van la cho quyet dinh (PermissionsGuard).
      can={{
        create: has(rolePermissions.create),
        update: has(rolePermissions.update),
        delete: has(rolePermissions.delete),
      }}
    />
  );
}
