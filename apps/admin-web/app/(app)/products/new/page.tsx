import { PageHeader } from "@/components/page-header";
import { ProductForm } from "../product-form";

export default function ProductCreatePage() {
  return (
    <div>
      <PageHeader title="New Product" />
      <ProductForm defaultValues={{ name: "", status: "active" }} cancelHref="/products" />
    </div>
  );
}
