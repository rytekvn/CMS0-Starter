// List Products - copy pattern nay khi tao module moi (vd Hotels).
// Server Component that: filter/search/page nam trong URL nen F5 hay chia se
// link deu ra dung ket qua, khong can state o client.
import { Pagination } from "@/components/pagination";
import { requireUser } from "@/lib/session";
import { listProducts } from "./api";
import { productPermissions } from "./permissions";
import { ProductFilters } from "./product-filters";
import { ProductTable } from "./product-table";
import { PAGE_SIZE, toQueryString, type ProductFilter } from "./schema";

type SearchParams = Record<string, string | string[] | undefined>;

const one = (value: string | string[] | undefined): string =>
  (Array.isArray(value) ? value[0] : value) ?? "";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const filter: ProductFilter = {
    status: one(params.status),
    search: one(params.search),
    createdFrom: one(params.createdFrom),
    createdTo: one(params.createdTo),
  };

  const user = await requireUser();

  // Vao thang URL ma khong co quyen: backend cung chan (403), o day chan som de
  // hien thong bao ro rang thay vi mot trang loi.
  if (!user.permissions.includes(productPermissions.read))
    return (
      <p className="py-6 text-muted-foreground">Ban khong co quyen xem danh sach product.</p>
    );

  const products = await listProducts(filter);

  // Endpoint chua ho tro phan trang (spec: Out of scope) -> cat o day.
  const totalPages = Math.max(1, Math.ceil(products.length / PAGE_SIZE));
  const page = Math.min(Math.max(1, Number(one(params.page)) || 1), totalPages);
  const rows = products.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // An o UI chi la UX; backend van la cho quyet dinh (PermissionsGuard).
  const has = (key: string) => user.permissions.includes(key);

  return (
    <div>
      <ProductTable
        rows={rows}
        filters={<ProductFilters filter={filter} />}
        exportHref={`/api/products/export${toQueryString({ ...filter })}`}
        can={{
          create: has(productPermissions.create),
          update: has(productPermissions.update),
          delete: has(productPermissions.delete),
          import: has(productPermissions.import),
          export: has(productPermissions.export),
          bulk: has(productPermissions.bulk),
        }}
      />
      <Pagination
        page={page}
        totalPages={totalPages}
        hrefFor={(p) => `/products${toQueryString({ ...filter, page: String(p) })}`}
      />
    </div>
  );
}
