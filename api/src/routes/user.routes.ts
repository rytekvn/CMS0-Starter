import { Hono } from "hono";
import { requireAuth } from "../middlewares/auth.middleware";
import { requirePermission } from "../middlewares/permission.middleware";
import { createUserSchema, updateUserSchema } from "../schemas/user.schema";
import {
  listUsers,
  getUser,
  createUser,
  updateUser,
  softDeleteUser,
} from "../services/user.service";
import type { AppEnv } from "../types";

const users = new Hono<AppEnv>();

users.use("*", requireAuth);

users.get("/", requirePermission("user.read"), async (c) => c.json(await listUsers()));

users.get("/:id", requirePermission("user.read"), async (c) => {
  const user = await getUser(c.req.param("id"));
  if (!user) return c.json({ error: "Not found" }, 404);
  return c.json(user);
});

users.post("/", requirePermission("user.create"), async (c) => {
  const data = createUserSchema.parse(await c.req.json());
  return c.json(await createUser(data, c.get("user").id), 201);
});

users.patch("/:id", requirePermission("user.update"), async (c) => {
  const data = updateUserSchema.parse(await c.req.json());
  return c.json(await updateUser(c.req.param("id"), data, c.get("user").id));
});

users.delete("/:id", requirePermission("user.delete"), async (c) => {
  await softDeleteUser(c.req.param("id"), c.get("user").id);
  return c.json({ ok: true });
});

export default users;
