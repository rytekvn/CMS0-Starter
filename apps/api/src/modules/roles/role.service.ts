// Service Role - noi DUY NHAT goi Prisma cho entity nay. Gan quyen bang Permission.key (unique).
// Audit log goi ngay sau moi lenh ghi.
import { Injectable } from "@nestjs/common";
import type { Permission, Prisma } from "@prisma/client";
import type { z } from "zod";
import { logAudit } from "../../common/audit";
import { PrismaService } from "../../infrastructure/database/prisma.service";
import type { createRoleSchema, updateRoleSchema } from "./role.schema";

const roleInclude = { permissions: { where: { deletedAt: null } } } satisfies Prisma.RoleInclude;

export type RoleResponse = Prisma.RoleGetPayload<{ include: typeof roleInclude }>;

@Injectable()
export class RoleService {
  constructor(private readonly prisma: PrismaService) {}

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
    return role;
  }
}
