import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { getRole } from "../api";

export default async function RoleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let role;
  try {
    role = await getRole(id);
  } catch (error) {
    return (
      <p className="form-error">
        {error instanceof Error ? error.message : "Khong tim thay"}
      </p>
    );
  }

  return (
    <div>
      <PageHeader title={role.name} />
      <dl className="detail-list">
        <dt>So quyen</dt>
        <dd>{role.permissions.length}</dd>
        <dt>Quyen</dt>
        <dd>
          {role.permissions.length === 0
            ? "-"
            : role.permissions.map((p) => p.key).sort().join(", ")}
        </dd>
        <dt>Ngay tao</dt>
        <dd suppressHydrationWarning>{new Date(role.createdAt).toLocaleString("vi-VN")}</dd>
        <dt>Cap nhat</dt>
        <dd suppressHydrationWarning>{new Date(role.updatedAt).toLocaleString("vi-VN")}</dd>
      </dl>
      <Link href="/roles">&larr; Ve danh sach</Link>
    </div>
  );
}
