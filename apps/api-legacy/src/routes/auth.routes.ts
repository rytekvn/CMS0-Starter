import { Hono } from "hono";
import bcrypt from "bcryptjs";
import { loginSchema } from "../schemas/user.schema";
import { findUserByEmail, getUser } from "../services/user.service";
import { signToken } from "../auth/jwt";
import { requireAuth } from "../middlewares/auth.middleware";
import type { AppEnv } from "../types";

const auth = new Hono<AppEnv>();

auth.post("/login", async (c) => {
  const body = loginSchema.parse(await c.req.json());
  const user = await findUserByEmail(body.email);

  if (!user || !(await bcrypt.compare(body.password, user.password)))
    return c.json({ error: "Invalid credentials" }, 401);

  return c.json({ token: signToken({ userId: user.id }) });
});

// Kem `permissions` (danh sach key phang) de frontend dung cho PermissionGuard,
// khoi phai goi them /roles. Loc role da xoa - cung dieu kien voi can().
auth.get("/me", requireAuth, async (c) => {
  const user = c.get("user");
  const permissions = [
    ...new Set(
      user.roles
        .filter((ur) => ur.role.deletedAt === null)
        .flatMap((ur) => ur.role.permissions.map((p) => p.key))
    ),
  ];
  return c.json({ ...(await getUser(user.id)), permissions });
});

export default auth;
