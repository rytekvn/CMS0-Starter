// Ghi AuditLog cho hanh dong thay doi du lieu. Goi truc tiep trong service sau moi lenh ghi.
// ponytail: ghi truc tiep qua prisma, khong middleware/interceptor, chua co queue/batch
import type { Prisma } from "@prisma/client";
import { prisma } from "../prisma";

export function logAudit(params: {
  actorId?: string;
  action: string;
  entity: string;
  entityId: string;
  metadata?: Prisma.InputJsonValue;
}) {
  return prisma.auditLog.create({ data: params });
}
