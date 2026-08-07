// Service Role - gan quyen bang Permission.key (unique). Audit log goi ngay sau moi lenh ghi.
import type { z } from "zod";
import { prisma } from "../prisma";
import type { createRoleSchema, updateRoleSchema } from "../schemas/role.schema";
import { logAudit } from "../logging/audit";

const roleInclude = { permissions: { where: { deletedAt: null } } };

export function listRoles() {
  return prisma.role.findMany({ where: { deletedAt: null }, include: roleInclude });
}

export function getRole(id: string) {
  return prisma.role.findFirst({ where: { id, deletedAt: null }, include: roleInclude });
}

export async function createRole(
  data: z.infer<typeof createRoleSchema>,
  actorId: string
) {
  const { permissionKeys = [], name } = data;
  const role = await prisma.role.create({
    data: {
      name,
      createdBy: actorId,
      updatedBy: actorId,
      permissions: { connect: permissionKeys.map((key) => ({ key })) },
    },
    include: roleInclude,
  });

  await logAudit({
    actorId,
    action: "role.create",
    entity: "Role",
    entityId: role.id,
    metadata: { name: role.name },
  });
  return role;
}

export async function updateRole(
  id: string,
  data: z.infer<typeof updateRoleSchema>,
  actorId: string
) {
  const { permissionKeys, name } = data;
  const role = await prisma.role.update({
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

  await logAudit({
    actorId,
    action: "role.update",
    entity: "Role",
    entityId: role.id,
    metadata: { fields: Object.keys(data) },
  });
  return role;
}

export async function softDeleteRole(id: string, actorId: string) {
  const role = await prisma.role.update({
    where: { id },
    data: { deletedAt: new Date(), updatedBy: actorId },
    include: roleInclude,
  });

  await logAudit({ actorId, action: "role.delete", entity: "Role", entityId: role.id });
  return role;
}
