// Khop voi model Product ben prisma (field audit tra ve duoi dang chuoi ISO).
export type Product = {
  id: string;
  name: string;
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
};

export type ProductInput = Pick<Product, "name" | "status">;

// Query cua GET /products va GET /products/export. Ngay dang "yyyy-mm-dd" (value cua <input type="date">).
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
