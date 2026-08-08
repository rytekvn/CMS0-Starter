// Goi API cho module Products - copy pattern nay khi tao module moi.
import { api, download } from "../../api/client";
import type { Product, ProductFilter, ProductInput, ImportResult, BulkAction } from "./schema";

const BASE_URL = "/products";

// Bo qua field rong -> "?status=" khong bi coi la filter.
function query(filter: ProductFilter): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filter)) if (value) params.set(key, value);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

// Loc lam o server (status/search/createdFrom/createdTo); phan trang van o client.
export function listProducts(filter: ProductFilter = {}): Promise<Product[]> {
  return api<Product[]>(BASE_URL + query(filter));
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

export function exportProducts(filter: ProductFilter): Promise<void> {
  return download(`${BASE_URL}/export${query(filter)}`, "products.csv");
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
