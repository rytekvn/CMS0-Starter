// Service mau cho module CRUD - copy pattern nay khi tao module moi.
// Noi DUY NHAT goi Prisma cho entity nay. Audit log goi ngay sau moi lenh ghi.
import { Injectable } from "@nestjs/common";
import type { Prisma, Product } from "@prisma/client";
import type { z } from "zod";
import { logAudit } from "../../common/audit";
import { parseCsv, toCsv } from "../../common/csv";
import { PrismaService } from "../../infrastructure/database/prisma.service";
// createProductSchema import as value: dung lai de validate tung dong CSV luc import.
import { createProductSchema } from "./product.schema";
import type {
  bulkActionSchema,
  ProductFilter,
  updateProductSchema,
} from "./product.schema";

export type ImportResult = {
  success: number;
  failed: number;
  errors: { row: number; message: string }[];
};

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

@Injectable()
export class ProductService {
  constructor(private readonly prisma: PrismaService) {}

  // filter mac dinh {} -> goi khong tham so van giu nguyen hanh vi cu.
  list(filter: ProductFilter = {}): Promise<Product[]> {
    return this.prisma.product.findMany({
      where: productWhere(filter),
      orderBy: { createdAt: "desc" },
    });
  }

  get(id: string): Promise<Product | null> {
    return this.prisma.product.findFirst({ where: { id, deletedAt: null } });
  }

  async create(
    data: z.infer<typeof createProductSchema>,
    actorId: string
  ): Promise<Product> {
    const product = await this.prisma.product.create({
      data: { ...data, createdBy: actorId, updatedBy: actorId },
    });

    await logAudit(this.prisma, {
      actorId,
      action: "product.create",
      entity: "Product",
      entityId: product.id,
      metadata: { name: product.name },
    });
    return product;
  }

  async update(
    id: string,
    data: z.infer<typeof updateProductSchema>,
    actorId: string
  ): Promise<Product> {
    const product = await this.prisma.product.update({
      where: { id },
      data: { ...data, updatedBy: actorId },
    });

    await logAudit(this.prisma, {
      actorId,
      action: "product.update",
      entity: "Product",
      entityId: product.id,
      metadata: { fields: Object.keys(data) },
    });
    return product;
  }

  async softDelete(id: string, actorId: string): Promise<Product> {
    const product = await this.prisma.product.update({
      where: { id },
      data: { deletedAt: new Date(), updatedBy: actorId },
    });

    await logAudit(this.prisma, {
      actorId,
      action: "product.delete",
      entity: "Product",
      entityId: product.id,
    });
    return product;
  }

  async exportCsv(filter: ProductFilter): Promise<string> {
    const rows = await this.list(filter);
    return toCsv([
      ["id", "name", "status", "createdAt"],
      ...rows.map((p) => [p.id, p.name, p.status, p.createdAt.toISOString()]),
    ]);
  }

  // Cot map theo ten o header (case-insensitive) -> file export ra import lai duoc,
  // cac cot thua (id/createdAt) bi bo qua.
  async importCsv(csvText: string, actorId: string): Promise<ImportResult> {
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

    if (valid.length > 0) await this.prisma.product.createMany({ data: valid });

    await logAudit(this.prisma, {
      actorId,
      action: "product.import",
      entity: "Product",
      entityId: BATCH_ENTITY_ID,
      metadata: { success: valid.length, failed: errors.length },
    });

    return { success: valid.length, failed: errors.length, errors };
  }

  async bulkAction(
    { ids, action }: z.infer<typeof bulkActionSchema>,
    actorId: string
  ): Promise<{ count: number }> {
    const data: Prisma.ProductUpdateManyMutationInput =
      action === "delete"
        ? { deletedAt: new Date(), updatedBy: actorId }
        : { status: action === "activate" ? "active" : "inactive", updatedBy: actorId };

    // Loc deletedAt: null -> khong "hoi sinh" record da xoa mem.
    const { count } = await this.prisma.product.updateMany({
      where: { id: { in: ids }, deletedAt: null },
      data,
    });

    await logAudit(this.prisma, {
      actorId,
      action: `product.bulk.${action}`,
      entity: "Product",
      entityId: BATCH_ENTITY_ID,
      metadata: { ids, action, count },
    });
    return { count };
  }
}
