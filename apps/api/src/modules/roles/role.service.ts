// Service Role - noi DUY NHAT goi Prisma cho entity nay. Gan quyen bang Permission.key (unique).
// Audit log goi ngay sau moi lenh ghi.
import { Injectable } from "@nestjs/common";
import type { Permission, Prisma } from "@prisma/client";
import type { z } from "zod";
import { logAudit } from "../../common/audit";
import { invalidateUsers } from "../../common/auth/auth-cache";
import { RedisService } from "../../infrastructure/cache/redis.service";
import { PrismaService } from "../../infrastructure/database/prisma.service";
import type { createRoleSchema, updateRoleSchema } from "./role.schema";

const roleInclude = { permissions: { where: { deletedAt: null } } } satisfies Prisma.RoleInclude;

export type RoleResponse = Prisma.RoleGetPayload<{ include: typeof roleInclude }>;

@Injectable()
export class RoleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService
  ) {}

  // Doi/xoa role lam cache auth cua MOI user dang giu role do bi cu.
  // Query dung danh sach userId thay vi `KEYS auth:user:v1:*`: KEYS la lenh
  // blocking O(N) tren toan keyspace VA se xoa nham cache cua user khong lien
  // quan. Day la hanh dong admin hiem, co index (@@unique userId+roleId).
  private async invalidateRoleMembers(roleId: string): Promise<void> {
    const members = await this.prisma.userRole.findMany({
      where: { roleId, deletedAt: null },
      select: { userId: true },
    });
    await invalidateUsers(this.redis, members.map((m) => m.userId));
  }

  // orderBy la LECH CO CHU DICH so voi legacy (khong co ORDER BY): thu tu on dinh
  // giua cac lan goi. Xem spec/entities/role.yaml.
  list(): Promise<RoleResponse[]> {
    return this.prisma.role.findMany({
      where: { deletedAt: null },
      include: roleInclude,
      orderBy: { createdAt: "desc" },
    });
  }

  // Du lieu tham chieu do seed so huu - chi doc, khong co CRUD.
  listPermissions(): Promise<Permission[]> {
    return this.prisma.permission.findMany({
      where: { deletedAt: null },
      orderBy: { key: "asc" },
    });
  }

  get(id: string): Promise<RoleResponse | null> {
    return this.prisma.role.findFirst({ where: { id, deletedAt: null }, include: roleInclude });
  }

  async create(
    data: z.infer<typeof createRoleSchema>,
    actorId: string
  ): Promise<RoleResponse> {
    const { permissionKeys = [], name } = data;
    const role = await this.prisma.role.create({
      data: {
        name,
        createdBy: actorId,
        updatedBy: actorId,
        permissions: { connect: permissionKeys.map((key) => ({ key })) },
      },
      include: roleInclude,
    });

    await logAudit(this.prisma, {
      actorId,
      action: "role.create",
      entity: "Role",
      entityId: role.id,
      metadata: { name: role.name },
    });
    return role;
  }

  async update(
    id: string,
    data: z.infer<typeof updateRoleSchema>,
    actorId: string
  ): Promise<RoleResponse> {
    const { permissionKeys, name } = data;
    const role = await this.prisma.role.update({
      where: { id },
      data: {
        ...(name ? { name } : {}),
        updatedBy: actorId,
        // `set` = thay the toan bo danh sach quyen, khong cong don.
        ...(permissionKeys
          ? { permissions: { set: permissionKeys.map((key) => ({ key })) } }
          : {}),
      },
      include: roleInclude,
    });

    await logAudit(this.prisma, {
      actorId,
      action: "role.update",
      entity: "Role",
      entityId: role.id,
      metadata: { fields: Object.keys(data) },
    });

    await this.invalidateRoleMembers(id);
    return role;
  }

  async softDelete(id: string, actorId: string): Promise<RoleResponse> {
    const role = await this.prisma.role.update({
      where: { id },
      data: { deletedAt: new Date(), updatedBy: actorId },
      include: roleInclude,
    });

    await logAudit(this.prisma, {
      actorId,
      action: "role.delete",
      entity: "Role",
      entityId: role.id,
    });

    // Role soft delete khong con cap quyen -> phai day cache di ngay.
    await this.invalidateRoleMembers(id);
    return role;
  }
}
