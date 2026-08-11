import { PageHeader } from "@/components/page-header";
import { listRoleOptions } from "../api";
import { UserForm } from "../user-form";

export default async function UserCreatePage() {
  const roles = await listRoleOptions();

  return (
    <div>
      <PageHeader title="New User" />
      <UserForm
        defaultValues={{ email: "", name: "", password: "", roleIds: [] }}
        roles={roles}
        cancelHref="/users"
      />
    </div>
  );
}
