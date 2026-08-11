import Link from "next/link";
import { FormError } from "@/components/form-error";
import { PageHeader } from "@/components/page-header";
import { getUser } from "../api";

export default async function UserDetailPage({
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

  return (
    <div>
      <PageHeader title={user.name} />
      <dl className="my-5 grid grid-cols-[140px_1fr] gap-2.5 [&_dd]:m-0 [&_dd]:text-foreground [&_dt]:text-[13px] [&_dt]:text-muted-foreground">
        <dt>Email</dt>
        <dd>{user.email}</dd>
        <dt>Role</dt>
        <dd>{user.roles.map((r) => r.role.name).join(", ") || "-"}</dd>
        <dt>Ngay tao</dt>
        <dd suppressHydrationWarning>{new Date(user.createdAt).toLocaleString("vi-VN")}</dd>
        <dt>Cap nhat</dt>
        <dd suppressHydrationWarning>{new Date(user.updatedAt).toLocaleString("vi-VN")}</dd>
      </dl>
      <Link href="/users" className="text-primary hover:underline">
        &larr; Ve danh sach
      </Link>
    </div>
  );
}
