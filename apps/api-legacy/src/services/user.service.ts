// Service User - noi duy nhat goi Prisma cho entity nay. Audit log goi ngay sau moi lenh ghi.
import bcrypt from "bcryptjs";
import type { z } from "zod";
import { prisma } from "../prisma";
import type { createUserSchema, updateUserSchema } from "../schemas/user.schema";
import { logAudit } from "../logging/audit";
import { userSelect } from "../types";

const BCRYPT_ROUNDS = 10;

// Chi dung cho login: la cho duy nhat can doc password hash.
export function findUserByEmail(email: string) {
  return prisma.user.findFirst({ where: { email, deletedAt: null } });
}

export function listUsers() {
  return prisma.user.findMany({ where: { deletedAt: null }, select: userSelect });
}

export function getUser(id: string) {
  return prisma.user.findFirst({ where: { id, deletedAt: null }, select: userSelect });
}

export async function createUser(
  data: z.infer<typeof createUserSchema>,
  actorId: string
) {
  const { roleIds = [], password, ...rest } = data;
  const user = await prisma.user.create({
    data: {
      ...rest,
      password: await bcrypt.hash(password, BCRYPT_ROUNDS),
      createdBy: actorId,
      updatedBy: actorId,
      roles: {
        create: roleIds.map((roleId) => ({
          role: { connect: { id: roleId } },
          createdBy: actorId,
          updatedBy: actorId,
        })),
      },
    },
    select: userSelect,
  });

  await logAudit({
    actorId,
    action: "user.create",
    entity: "User",
    entityId: user.id,
    metadata: { email: user.email },
  });
  return user;
}

export async function updateUser(
  id: string,
  data: z.infer<typeof updateUserSchema>,
  actorId: string
) {
  const { roleIds, password, ...rest } = data;
  const user = await prisma.user.update({
    where: { id },
    data: {
      ...rest,
      ...(password ? { password: await bcrypt.hash(password, BCRYPT_ROUNDS) } : {}),
      updatedBy: actorId,
      // ponytail: gan lai role = xoa cung row UserRole roi tao lai (bang noi, khong can soft delete)
      ...(roleIds
        ? {
            roles: {
              deleteMany: {},
              create: roleIds.map((roleId) => ({
                role: { connect: { id: roleId } },
                createdBy: actorId,
                updatedBy: actorId,
              })),
            },
          }
        : {}),
    },
    select: userSelect,
  });

  await logAudit({
    actorId,
    action: "user.update",
    entity: "User",
    entityId: user.id,
    metadata: { fields: Object.keys(data) },
  });
  return user;
}

export async function softDeleteUser(id: string, actorId: string) {
  const user = await prisma.user.update({
    where: { id },
    data: { deletedAt: new Date(), updatedBy: actorId },
    select: userSelect,
  });

  await logAudit({ actorId, action: "user.delete", entity: "User", entityId: user.id });
  return user;
}
