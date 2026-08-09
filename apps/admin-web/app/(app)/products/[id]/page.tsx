import Link from "next/link";
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
    return <p className="form-error">{error instanceof Error ? error.message : "Khong tim thay"}</p>;
  }

  return (
    <div>
      <PageHeader title={product.name} />
      <dl className="detail-list">
        <dt>Trang thai</dt>
        <dd>
          <StatusBadge status={product.status} />
        </dd>
        <dt>Ngay tao</dt>
        <dd>{new Date(product.createdAt).toLocaleString("vi-VN")}</dd>
        <dt>Cap nhat</dt>
        <dd>{new Date(product.updatedAt).toLocaleString("vi-VN")}</dd>
      </dl>
      <Link href="/products">&larr; Ve danh sach</Link>
    </div>
  );
}
