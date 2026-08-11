import Link from "next/link";
import { FormError } from "@/components/form-error";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { getProduct } from "../api";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let product;
  try {
    product = await getProduct(id);
  } catch (error) {
    return <FormError>{error instanceof Error ? error.message : "Khong tim thay"}</FormError>;
  }

  return (
    <div>
      <PageHeader title={product.name} />
      <dl className="my-5 grid grid-cols-[140px_1fr] gap-2.5 [&_dd]:m-0 [&_dd]:text-foreground [&_dt]:text-[13px] [&_dt]:text-muted-foreground">
        <dt>Trang thai</dt>
        <dd>
          <StatusBadge status={product.status} />
        </dd>
        <dt>Ngay tao</dt>
        <dd>{new Date(product.createdAt).toLocaleString("vi-VN")}</dd>
        <dt>Cap nhat</dt>
        <dd>{new Date(product.updatedAt).toLocaleString("vi-VN")}</dd>
      </dl>
      <Link href="/products" className="text-primary hover:underline">
        &larr; Ve danh sach
      </Link>
    </div>
  );
}
