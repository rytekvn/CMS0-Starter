// Service mau cho module CRUD - copy pattern nay khi tao module moi.
// Audit log goi ngay sau moi lenh ghi, actorId truyen tu route.
import type { Prisma } from "@prisma/client";
import type { z } from "zod";
import { prisma } from "../prisma";
// createProductSchema import as value: dung lai de validate tung dong CSV luc import.
import { createProductSchema } from "../schemas/product.schema";
import type {
  bulkActionSchema,
  productQuerySchema,
  updateProductSchema,
} from "../schemas/product.schema";
import { parseCsv, toCsv } from "../lib/csv";
import { logAudit } from "../logging/audit";

type ProductFilter = z.infer<typeof productQuerySchema>;

// Audit log cho hanh dong theo lo: khong gan voi 1 record cu the.
const BATCH_ENTITY_ID = "*";

function productWhere(f: ProductFilter): Prisma.ProductWhereInput {
  return {
    deletedAt: null,
    ...(f.status ? { status: f.status } : {}),
    ...(f.search ? { name: { contains: f.search, mode: "insensitive" } } : {}),
    ...(f.createdFrom || f.createdTo
      ? {
          createdAt: {
            ...(f.createdFrom ? { gte: f.createdFrom } : {}),
            ...(f.createdTo ? { lte: f.createdTo } : {}),
          },
        }
      : {}),
  };
}

// filter mac dinh {} -> goi khong tham so van giu nguyen hanh vi cu.
export function listProducts(filter: ProductFilter = {}) {
  return prisma.product.findMany({
    where: productWhere(filter),
    orderBy: { createdAt: "desc" },
  });
}

export function getProduct(id: string) {
  return prisma.product.findFirst({ where: { id, deletedAt: null } });
}

export async function createProduct(
  data: z.infer<typeof createProductSchema>,
  actorId: string
) {
  const product = await prisma.product.create({
    data: { ...data, createdBy: actorId, updatedBy: actorId },
  });

  await logAudit({
    actorId,
    action: "product.create",
    entity: "Product",
    entityId: product.id,
    metadata: { name: product.name },
  });
  return product;
}

export async function updateProduct(
  id: string,
  data: z.infer<typeof updateProductSchema>,
  actorId: string
) {
  const product = await prisma.product.update({
    where: { id },
    data: { ...data, updatedBy: actorId },
  });

  await logAudit({
    actorId,
    action: "product.update",
    entity: "Product",
    entityId: product.id,
    metadata: { fields: Object.keys(data) },
  });
  return product;
}

export async function softDeleteProduct(id: string, actorId: string) {
  const product = await prisma.product.update({
    where: { id },
    data: { deletedAt: new Date(), updatedBy: actorId },
  });

  await logAudit({
    actorId,
    action: "product.delete",
    entity: "Product",
    entityId: product.id,
  });
  return product;
}

export async function exportProductsCsv(filter: ProductFilter) {
  const rows = await listProducts(filter);
  return toCsv([
    ["id", "name", "status", "createdAt"],
    ...rows.map((p) => [p.id, p.name, p.status, p.createdAt.toISOString()]),
  ]);
}

export type ImportResult = {
  success: number;
  failed: number;
  errors: { row: number; message: string }[];
};

// Cot map theo ten o header (case-insensitive) -> file export ra import lai duoc,
// cac cot thua (id/createdAt) bi bo qua.
export async function importProductsCsv(
  csvText: string,
  actorId: string
): Promise<ImportResult> {
  const [header, ...rows] = parseCsv(csvText);
  if (!header || !header.some((h) => h.trim().toLowerCase() === "name"))
    return { success: 0, failed: 0, errors: [{ row: 1, message: "Missing `name` column" }] };

  const cols = header.map((h) => h.trim().toLowerCase());
  const valid: Prisma.ProductCreateManyInput[] = [];
  const errors: ImportResult["errors"] = [];

  rows.forEach((cells, i) => {
    if (cells.every((v) => v.trim() === "")) return; // bo qua dong trong
    const row = i + 2; // dong 1 la header

    const cell = (name: string) => cells[cols.indexOf(name)]?.trim() ?? "";
    const parsed = createProductSchema.safeParse({
      name: cell("name"),
      ...(cell("status") ? { status: cell("status") } : {}),
    });

    if (!parsed.success) {
      errors.push({
        row,
        message: parsed.error.issues
          .map((issue) => `${issue.path.join(".") || "row"}: ${issue.message}`)
          .join("; "),
      });
      return;
    }
    valid.push({ ...parsed.data, createdBy: actorId, updatedBy: actorId });
  });

  if (valid.length > 0) await prisma.product.createMany({ data: valid });

  await logAudit({
    actorId,
    action: "product.import",
    entity: "Product",
    entityId: BATCH_ENTITY_ID,
    metadata: { success: valid.length, failed: errors.length },
  });

  return { success: valid.length, failed: errors.length, errors };
}

export async function bulkProductAction(
  { ids, action }: z.infer<typeof bulkActionSchema>,
  actorId: string
) {
  const data: Prisma.ProductUpdateManyMutationInput =
    action === "delete"
      ? { deletedAt: new Date(), updatedBy: actorId }
      : { status: action === "activate" ? "active" : "inactive", updatedBy: actorId };

  // Loc deletedAt: null -> khong "hoi sinh" record da xoa mem.
  const { count } = await prisma.product.updateMany({
    where: { id: { in: ids }, deletedAt: null },
    data,
  });

  await logAudit({
    actorId,
    action: `product.bulk.${action}`,
    entity: "Product",
    entityId: BATCH_ENTITY_ID,
    metadata: { ids, action, count },
  });
  return { count };
}
