// Service User - noi DUY NHAT goi Prisma cho entity nay (AuthModule cung di qua day).
// Audit log goi ngay sau moi lenh ghi.
import { Injectable } from "@nestjs/common";
import type { Prisma, User } from "@prisma/client";
import bcrypt from "bcryptjs";
import type { z } from "zod";
import { logAudit } from "../../common/audit";
import { invalidateUsers } from "../../common/auth/auth-cache";
import { logger } from "../../common/logging";
import { RedisService } from "../../infrastructure/cache/redis.service";
import { PrismaService } from "../../infrastructure/database/prisma.service";
import { NotificationService } from "../notifications/notification.service";
import type { createUserSchema, updateUserSchema } from "./user.schema";

const BCRYPT_ROUNDS = 10;

// Dung cho moi response co user: KHONG chon cot `password`.
const userSelect = {
  id: true,
  email: true,
  name: true,
  createdAt: true,
  updatedAt: true,
  createdBy: true,
  updatedBy: true,
  deletedAt: true,
  roles: {
    where: { deletedAt: null },
    select: { role: { select: { id: true, name: true } } },
  },
} satisfies Prisma.UserSelect;

export type UserResponse = Prisma.UserGetPayload<{ select: typeof userSelect }>;

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly notifications: NotificationService
  ) {}

  // Chi dung cho login: la cho duy nhat can doc password hash -> tra ca row User.
  findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findFirst({ where: { email, deletedAt: null } });
  }

  // orderBy la LECH CO CHU DICH so voi legacy (khong co ORDER BY): phan trang o
  // UI can thu tu on dinh. Xem spec/entities/user.yaml.
  list(): Promise<UserResponse[]> {
    return this.prisma.user.findMany({
      where: { deletedAt: null },
      select: userSelect,
      orderBy: { createdAt: "desc" },
    });
  }

  get(id: string): Promise<UserResponse | null> {
    return this.prisma.user.findFirst({ where: { id, deletedAt: null }, select: userSelect });
  }

  // requestId (do pino-http sinh, echo trong header x-request-id) di theo job de
  // log cua worker truy nguoc duoc ve request da tao user - roadmap §7.7.
  async create(
    data: z.infer<typeof createUserSchema>,
    actorId: string,
    requestId?: string
  ): Promise<UserResponse> {
    const { roleIds = [], password, ...rest } = data;
    const user = await this.prisma.user.create({
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

    await logAudit(this.prisma, {
      actorId,
      action: "user.create",
      entity: "User",
      entityId: user.id,
      metadata: { email: user.email },
    });

    // Enqueue KHONG duoc lam hong POST /users: user da nam trong DB roi. De loi
    // noi len -> Redis chet thi tra 500, client tuong that bai va retry -> 500
    // duplicate email. Bat + log error (co userId de enqueue lai tay), response
    // giu nguyen.
    try {
      await this.notifications.enqueueWelcome(user.id, requestId);
    } catch (err) {
      logger.error(
        { err: String(err), userId: user.id, requestId },
        "enqueue user.welcome failed"
      );
    }
    return user;
  }

  async update(
    id: string,
    data: z.infer<typeof updateUserSchema>,
    actorId: string
  ): Promise<UserResponse> {
    const { roleIds, password, ...rest } = data;
    const user = await this.prisma.user.update({
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

    await logAudit(this.prisma, {
      actorId,
      action: "user.update",
      entity: "User",
      entityId: user.id,
      // Chi ghi TEN field da gui, khong ghi gia tri -> khong co mat khau trong log.
      metadata: { fields: Object.keys(data) },
    });

    // Doi role/ten/email -> AuthUser trong cache da cu.
    await invalidateUsers(this.redis, [id]);
    return user;
  }

  async softDelete(id: string, actorId: string): Promise<UserResponse> {
    const user = await this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date(), updatedBy: actorId },
      select: userSelect,
    });

    await logAudit(this.prisma, {
      actorId,
      action: "user.delete",
      entity: "User",
      entityId: user.id,
    });

    // Khong invalidate = user da xoa mem van dang nhap duoc them 60s.
    await invalidateUsers(this.redis, [id]);
    return user;
  }
}
