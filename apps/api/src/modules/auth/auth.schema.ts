// Copy 1:1 tu apps/api-legacy/src/schemas/user.schema.ts (loginSchema).
import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});
