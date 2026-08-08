import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { PageHeader } from "../../components/PageHeader";
import { StatusBadge } from "../../components/StatusBadge";
import { PermissionGuard } from "../../components/PermissionGuard";
import { getProduct } from "./api";
import { productPermissions } from "./permissions";
import type { Product } from "./schema";

export function ProductDetail() {
  const { id = "" } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getProduct(id)
      .then(setProduct)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p className="page-loading">Dang tai...</p>;
  if (error || !product) return <p className="form-error">{error || "Khong tim thay"}</p>;

  return (
    <div>
      <PageHeader
        title={product.name}
        actions={
          <PermissionGuard permission={productPermissions.update}>
            <Link className="button" to={`/products/${product.id}/edit`}>
              Sua
            </Link>
          </PermissionGuard>
        }
      />
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
      <Link to="/products">&larr; Ve danh sach</Link>
    </div>
  );
}
