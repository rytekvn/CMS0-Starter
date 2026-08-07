import { z } from "zod";

export const createRoleSchema = z.object({
  name: z.string().min(1),
  // Gan quyen bang key ("product.create"), Permission.key la unique.
  permissionKeys: z.array(z.string()).optional(),
});

export const updateRoleSchema = createRoleSchema.partial();
