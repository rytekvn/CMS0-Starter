import { Hono } from "hono";
import { requireAuth } from "../middlewares/auth.middleware";
import { requirePermission } from "../middlewares/permission.middleware";
import { createRoleSchema, updateRoleSchema } from "../schemas/role.schema";
import {
  listRoles,
  getRole,
  createRole,
  updateRole,
  softDeleteRole,
} from "../services/role.service";
import type { AppEnv } from "../types";

const roles = new Hono<AppEnv>();

roles.use("*", requireAuth);

roles.get("/", requirePermission("role.read"), async (c) => c.json(await listRoles()));

roles.get("/:id", requirePermission("role.read"), async (c) => {
  const role = await getRole(c.req.param("id"));
  if (!role) return c.json({ error: "Not found" }, 404);
  return c.json(role);
});

roles.post("/", requirePermission("role.create"), async (c) => {
  const data = createRoleSchema.parse(await c.req.json());
  return c.json(await createRole(data, c.get("user").id), 201);
});

roles.patch("/:id", requirePermission("role.update"), async (c) => {
  const data = updateRoleSchema.parse(await c.req.json());
  return c.json(await updateRole(c.req.param("id"), data, c.get("user").id));
});

roles.delete("/:id", requirePermission("role.delete"), async (c) => {
  await softDeleteRole(c.req.param("id"), c.get("user").id);
  return c.json({ ok: true });
});

export default roles;
