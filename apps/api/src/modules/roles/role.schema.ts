// Hanh vi khop role.schema cua stack Hono cu truoc khi migrate (Zod, khong class-validator).
import { z } from "zod";

export const createRoleSchema = z.object({
  name: z.string().min(1),
  // Gan quyen bang key ("product.create"), Permission.key la unique.
  permissionKeys: z.array(z.string()).optional(),
});

// Khong gui `permissionKeys` = giu nguyen danh sach quyen hien tai.
export const updateRoleSchema = createRoleSchema.partial();
