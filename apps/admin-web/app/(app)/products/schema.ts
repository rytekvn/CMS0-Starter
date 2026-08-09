// Khop voi model Product ben prisma (field audit tra ve duoi dang chuoi ISO).
export type Product = {
  id: string;
  name: string;
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
};

export type ProductInput = Pick<Product, "name" | "status">;

// Query cua GET /products va GET /products/export. Ngay dang "yyyy-mm-dd"
// (value cua <input type="date">), cung la dang nam trong URL searchParams.
export type ProductFilter = {
  status?: string;
  search?: string;
  createdFrom?: string;
  createdTo?: string;
};

export type BulkAction = "delete" | "activate" | "deactivate";

export type ImportResult = {
  success: number;
  failed: number;
  errors: { row: number; message: string }[];
};

export const PAGE_SIZE = 10;

// Bo qua field rong -> "?status=" khong bi coi la filter.
export function toQueryString(filter: Record<string, string | undefined>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filter)) if (value) params.set(key, value);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}
