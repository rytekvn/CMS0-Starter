// Copy 1:1 tu apps/api-legacy/src/schemas/user.schema.ts (Zod, khong class-validator).
import { z } from "zod";

export const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
  // Gan role bang id. Bo qua -> user khong co role nao.
  roleIds: z.array(z.string()).optional(),
});

// Moi field tuy chon: khong gui `password` = giu nguyen mat khau cu,
// khong gui `roleIds` = giu nguyen danh sach role.
export const updateUserSchema = createUserSchema.partial();
