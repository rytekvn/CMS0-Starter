// Upload / download file. Multipart parse bang c.req.parseBody() co san cua Hono.
import { Hono } from "hono";
import { requireAuth } from "../middlewares/auth.middleware";
import { requirePermission } from "../middlewares/permission.middleware";
import { getFileAsset, readFileAssetBytes, saveUpload } from "../services/file.service";
import type { AppEnv } from "../types";

const files = new Hono<AppEnv>();

files.use("*", requireAuth);

files.post("/", requirePermission("file.upload"), async (c) => {
  const file = (await c.req.parseBody())["file"];
  if (!(file instanceof File)) return c.json({ error: "Missing `file` field" }, 400);
  return c.json(await saveUpload(file, c.get("user").id), 201);
});

files.get("/:id", requirePermission("file.read"), async (c) => {
  const asset = await getFileAsset(c.req.param("id"));
  if (!asset) return c.json({ error: "Not found" }, 404);

  const bytes = await readFileAssetBytes(asset.url);
  if (!bytes) return c.json({ error: "File missing on disk" }, 404);

  return c.body(new Uint8Array(bytes), 200, {
    "Content-Type": asset.mimeType,
    "Content-Length": String(bytes.byteLength),
    // filename* (RFC 5987) de ten goc co unicode / dau nhay khong pha header.
    "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(asset.filename)}`,
  });
});

export default files;
