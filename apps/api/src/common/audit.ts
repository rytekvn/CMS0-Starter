// Ghi AuditLog cho hanh dong thay doi du lieu. Goi truc tiep trong service sau moi lenh ghi.
// ponytail: ham thuong nhan prisma, khong bocc thanh AuditService - 1 ham thi chua can DI;
// ghi truc tiep, khong interceptor/queue/batch.
import type { Prisma } from "@prisma/client";
import type { PrismaService } from "../infrastructure/database/prisma.service";

export function logAudit(
  prisma: PrismaService,
  params: {
    actorId?: string;
    action: string;
    entity: string;
    entityId: string;
    metadata?: Prisma.InputJsonValue;
  }
): Promise<unknown> {
  return prisma.auditLog.create({ data: params });
}
