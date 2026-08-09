import { PageHeader } from "@/components/page-header";
import { getProduct } from "../../api";
import { ProductForm } from "../../product-form";

export default async function ProductEditPage({
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
      <PageHeader title="Edit Product" />
      <ProductForm
        id={id}
        defaultValues={{ name: product.name, status: product.status }}
        cancelHref={`/products/${id}`}
      />
    </div>
  );
}
