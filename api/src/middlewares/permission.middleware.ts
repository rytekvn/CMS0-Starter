// Chan request khi user khong du quyen. Dung sau requireAuth.
import type { MiddlewareHandler } from "hono";
import { can } from "../permissions/can";
import type { AppEnv } from "../types";

export const requirePermission =
  (permissionKey: string): MiddlewareHandler<AppEnv> =>
  async (c, next) => {
    if (!can(c.get("user"), permissionKey))
      return c.json({ error: "Forbidden" }, 403);
    await next();
  };
