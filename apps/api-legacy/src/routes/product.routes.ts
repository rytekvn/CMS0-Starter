// Route mau cho module CRUD - copy pattern nay khi tao module moi (vd Hotels).
import { Hono, type Context } from "hono";
import { requireAuth } from "../middlewares/auth.middleware";
import { requirePermission } from "../middlewares/permission.middleware";
import { MAX_UPLOAD_BYTES } from "../schemas/file.schema";
import {
  bulkActionSchema,
  createProductSchema,
  productQuerySchema,
  updateProductSchema,
} from "../schemas/product.schema";
import {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  softDeleteProduct,
  exportProductsCsv,
  importProductsCsv,
  bulkProductAction,
} from "../services/product.service";
import type { AppEnv } from "../types";

const products = new Hono<AppEnv>();

products.use("*", requireAuth);

// Form thuong gui "?status=" khi chua chon gi -> coi nhu khong loc.
const parseFilter = (c: Context<AppEnv>) =>
  productQuerySchema.parse(
    Object.fromEntries(Object.entries(c.req.query()).filter(([, v]) => v !== ""))
  );

products.get("/", requirePermission("product.read"), async (c) =>
  c.json(await listProducts(parseFilter(c)))
);

// Dat truoc "/:id" de khong bi route param nuot mat.
products.get("/export", requirePermission("product.export"), async (c) =>
  c.body(await exportProductsCsv(parseFilter(c)), 200, {
    "Content-Type": "text/csv; charset=utf-8",
    "Content-Disposition": 'attachment; filename="products.csv"',
  })
);

products.post("/import", requirePermission("product.import"), async (c) => {
  const file = (await c.req.parseBody())["file"];
  if (!(file instanceof File)) return c.json({ error: "Missing `file` field" }, 400);
  if (file.size > MAX_UPLOAD_BYTES) return c.json({ error: "File too large (max 5MB)" }, 413);
  return c.json(await importProductsCsv(await file.text(), c.get("user").id));
});

products.post("/bulk", requirePermission("product.bulk"), async (c) => {
  const body = bulkActionSchema.parse(await c.req.json());
  return c.json(await bulkProductAction(body, c.get("user").id));
});

products.get("/:id", requirePermission("product.read"), async (c) => {
  const product = await getProduct(c.req.param("id"));
  if (!product) return c.json({ error: "Not found" }, 404);
  return c.json(product);
});

products.post("/", requirePermission("product.create"), async (c) => {
  const data = createProductSchema.parse(await c.req.json());
  return c.json(await createProduct(data, c.get("user").id), 201);
});

products.patch("/:id", requirePermission("product.update"), async (c) => {
  const data = updateProductSchema.parse(await c.req.json());
  return c.json(await updateProduct(c.req.param("id"), data, c.get("user").id));
});

products.delete("/:id", requirePermission("product.delete"), async (c) => {
  await softDeleteProduct(c.req.param("id"), c.get("user").id);
  return c.json({ ok: true });
});

export default products;
