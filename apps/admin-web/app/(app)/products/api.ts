// Goi API cho module Products - copy pattern nay khi tao module moi.
// Chay o server (Server Component / Server Action), token lay tu cookie httpOnly.
import { api } from "@/lib/api";
import {
  toQueryString,
  type BulkAction,
  type ImportResult,
  type Product,
  type ProductFilter,
  type ProductInput,
} from "./schema";

const BASE_URL = "/products";

// Loc lam o server (status/search/createdFrom/createdTo); phan trang van cat o
// tang nay vi endpoint chua ho tro `page` (xem spec Out of scope).
export function listProducts(filter: ProductFilter = {}): Promise<Product[]> {
  return api<Product[]>(BASE_URL + toQueryString(filter));
}

export function getProduct(id: string): Promise<Product> {
  return api<Product>(`${BASE_URL}/${id}`);
}

export function createProduct(data: ProductInput): Promise<Product> {
  return api<Product>(BASE_URL, { method: "POST", body: JSON.stringify(data) });
}

export function updateProduct(id: string, data: Partial<ProductInput>): Promise<Product> {
  return api<Product>(`${BASE_URL}/${id}`, { method: "PATCH", body: JSON.stringify(data) });
}

export function deleteProduct(id: string): Promise<void> {
  return api<{ ok: true }>(`${BASE_URL}/${id}`, { method: "DELETE" }).then(() => undefined);
}

export function importProducts(file: File): Promise<ImportResult> {
  const body = new FormData();
  body.append("file", file);
  return api<ImportResult>(`${BASE_URL}/import`, { method: "POST", body });
}

export function bulkProducts(ids: string[], action: BulkAction): Promise<{ count: number }> {
  return api<{ count: number }>(`${BASE_URL}/bulk`, {
    method: "POST",
    body: JSON.stringify({ ids, action }),
  });
}
