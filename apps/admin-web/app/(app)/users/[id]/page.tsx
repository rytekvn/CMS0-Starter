import Link from "next/link";
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
    return (
      <p className="form-error">
        {error instanceof Error ? error.message : "Khong tim thay"}
      </p>
    );
  }

  return (
    <div>
      <PageHeader title={user.name} />
      <dl className="detail-list">
        <dt>Email</dt>
        <dd>{user.email}</dd>
        <dt>Role</dt>
        <dd>{user.roles.map((r) => r.role.name).join(", ") || "-"}</dd>
        <dt>Ngay tao</dt>
        <dd suppressHydrationWarning>{new Date(user.createdAt).toLocaleString("vi-VN")}</dd>
        <dt>Cap nhat</dt>
        <dd suppressHydrationWarning>{new Date(user.updatedAt).toLocaleString("vi-VN")}</dd>
      </dl>
      <Link href="/users">&larr; Ve danh sach</Link>
    </div>
  );
}
