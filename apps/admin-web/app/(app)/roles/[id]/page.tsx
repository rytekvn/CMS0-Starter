import Link from "next/link";
import { FormError } from "@/components/form-error";
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
    return <FormError>{error instanceof Error ? error.message : "Khong tim thay"}</FormError>;
  }

  return (
    <div>
      <PageHeader title={role.name} />
      <dl className="my-5 grid grid-cols-[140px_1fr] gap-2.5 [&_dd]:m-0 [&_dd]:text-foreground [&_dt]:text-[13px] [&_dt]:text-muted-foreground">
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
      <Link href="/roles" className="text-primary hover:underline">
        &larr; Ve danh sach
      </Link>
    </div>
  );
}
