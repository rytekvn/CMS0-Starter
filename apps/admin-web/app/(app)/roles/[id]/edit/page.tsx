import { FormError } from "@/components/form-error";
import { PageHeader } from "@/components/page-header";
import { getRole, listPermissions } from "../../api";
import { RoleForm } from "../../role-form";

export default async function RoleEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let role;
  try {
    role = await getRole(id);
  } catch (error) {
    return <FormError>{error instanceof Error ? error.message : "Khong tim thay"}</FormError>;
  }

  const permissions = await listPermissions();

  return (
    <div>
      <PageHeader title="Edit Role" />
      <RoleForm
        id={id}
        defaultValues={{
          name: role.name,
          permissionKeys: role.permissions.map((p) => p.key),
        }}
        permissions={permissions}
        cancelHref={`/roles/${id}`}
      />
    </div>
  );
}
