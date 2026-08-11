import { FormError } from "@/components/form-error";
import { PageHeader } from "@/components/page-header";
import { getUser, listRoleOptions } from "../../api";
import { UserForm } from "../../user-form";

export default async function UserEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let user;
  try {
    user = await getUser(id);
  } catch (error) {
    return <FormError>{error instanceof Error ? error.message : "Khong tim thay"}</FormError>;
  }

  const roles = await listRoleOptions();

  return (
    <div>
      <PageHeader title="Edit User" />
      <UserForm
        id={id}
        defaultValues={{
          email: user.email,
          name: user.name,
          // Luon rong: mat khau khong bao gio tra ve tu API. De trong = giu nguyen.
          password: "",
          roleIds: user.roles.map((r) => r.role.id),
        }}
        roles={roles}
        cancelHref={`/users/${id}`}
      />
    </div>
  );
}
