// Hanh vi khop loginSchema cua stack Hono cu truoc khi migrate.
import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});
