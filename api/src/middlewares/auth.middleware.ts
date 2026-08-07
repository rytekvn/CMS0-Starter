// Middleware xac thuc: doc Bearer token, load user + role/permission, gan vao context.
// ponytail: query user moi request, chua cache - them khi do duoc la cham
import type { MiddlewareHandler } from "hono";
import { verifyToken } from "../auth/jwt";
import { prisma } from "../prisma";
import { userWithPermissions, type AppEnv } from "../types";

export const requireAuth: MiddlewareHandler<AppEnv> = async (c, next) => {
  const token = c.req.header("Authorization")?.replace("Bearer ", "");
  if (!token) return c.json({ error: "Unauthorized" }, 401);

  let userId: string;
  try {
    userId = verifyToken(token).userId;
  } catch {
    return c.json({ error: "Invalid token" }, 401);
  }

  const user = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null },
    include: userWithPermissions,
  });
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  c.set("user", user);
  await next();
};
