import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().min(1),
  status: z.enum(["active", "inactive"]).default("active"),
});

export const updateProductSchema = createProductSchema.partial();

// Filter cho GET /products va GET /products/export. Tat ca optional -> khong truyen = khong loc.
// Ngay parse theo UTC; dang "yyyy-mm-dd" o createdTo hieu la HET ngay do (khong phai 00:00).
export const productQuerySchema = z.object({
  status: z.enum(["active", "inactive"]).optional(),
  search: z.string().min(1).optional(),
  createdFrom: z.coerce.date().optional(),
  createdTo: z.preprocess(
    (v) => (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) ? `${v}T23:59:59.999Z` : v),
    z.coerce.date().optional()
  ),
});

export const bulkActionSchema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(500),
  action: z.enum(["delete", "activate", "deactivate"]),
});
