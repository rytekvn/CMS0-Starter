import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";
import roleRoutes from "./routes/role.routes";
import productRoutes from "./routes/product.routes";
import fileRoutes from "./routes/file.routes";
import type { AppEnv } from "./types";

const app = new Hono<AppEnv>();

// admin-web chay khac origin -> can CORS. Auth bang Bearer header nen khong can credentials.
app.use("*", cors({ origin: process.env.CORS_ORIGIN ?? "http://localhost:5173" }));

app.get("/health", (c) => c.json({ ok: true }));

app.route("/auth", authRoutes);
app.route("/users", userRoutes);
app.route("/roles", roleRoutes);
app.route("/products", productRoutes);
app.route("/files", fileRoutes);

// Doi loi quen thuoc thanh status dung, thay vi 500 chung chung.
app.onError((err, c) => {
  if (err instanceof ZodError)
    return c.json({ error: "Validation failed", issues: err.issues }, 400);

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2025") return c.json({ error: "Not found" }, 404);
    if (err.code === "P2002") return c.json({ error: "Duplicate value" }, 409);
  }

  console.error(err);
  return c.json({ error: "Internal error" }, 500);
});

serve({ fetch: app.fetch, port: Number(process.env.PORT ?? 3001) });

export default app;
