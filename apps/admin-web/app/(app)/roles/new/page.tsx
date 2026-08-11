import { PageHeader } from "@/components/page-header";
import { listPermissions } from "../api";
import { RoleForm } from "../role-form";

export default async function RoleCreatePage() {
  const permissions = await listPermissions();

  return (
    <div>
      <PageHeader title="New Role" />
      <RoleForm
        defaultValues={{ name: "", permissionKeys: [] }}
        permissions={permissions}
        cancelHref="/roles"
      />
    </div>
  );
}
