import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().min(1),
  status: z.enum(["active", "inactive"]).default("active"),
});

export const updateProductSchema = createProductSchema.partial();

// Form thuong gui "?status=" khi chua chon gi -> coi nhu khong loc.
// Legacy loc o route; o day gom vao schema de test duoc ma khong can dung server.
const stripEmpty = (value: unknown): unknown =>
  value && typeof value === "object" && !Array.isArray(value)
    ? Object.fromEntries(
        Object.entries(value as Record<string, unknown>).filter(([, v]) => v !== "")
      )
    : value;

// Filter cho GET /products va GET /products/export. Tat ca optional -> khong truyen = khong loc.
// Ngay parse theo UTC; dang "yyyy-mm-dd" o createdTo hieu la HET ngay do (khong phai 00:00).
export const productQuerySchema = z.preprocess(
  stripEmpty,
  z.object({
    status: z.enum(["active", "inactive"]).optional(),
    search: z.string().min(1).optional(),
    createdFrom: z.coerce.date().optional(),
    createdTo: z.preprocess(
      (v) => (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) ? `${v}T23:59:59.999Z` : v),
      z.coerce.date().optional()
    ),
  })
);

export const bulkActionSchema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(500),
  action: z.enum(["delete", "activate", "deactivate"]),
});

export type ProductFilter = z.infer<typeof productQuerySchema>;
