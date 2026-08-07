// Service FileAsset - noi duy nhat goi Prisma cho entity nay.
// Luu disk o api/uploads/ voi ten ngau nhien; ten goc chi nam trong DB (field `filename`).
// ponytail: luu local disk, doc ca file vao RAM (tran 5MB) - doi sang S3/stream khi can.
import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { prisma } from "../prisma";
import { logAudit } from "../logging/audit";
import { EXT_BY_MIME, uploadSchema } from "../schemas/file.schema";

// Tinh tu vi tri file nay (api/src/services) -> api/uploads, khong phu thuoc cwd.
const UPLOAD_DIR = path.resolve(fileURLToPath(import.meta.url), "../../../uploads");

export async function saveUpload(file: File, actorId: string) {
  const meta = uploadSchema.parse({
    filename: file.name,
    mimeType: file.type,
    size: file.size,
  });

  const diskName = `${randomUUID()}.${EXT_BY_MIME[meta.mimeType]}`;
  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(path.join(UPLOAD_DIR, diskName), Buffer.from(await file.arrayBuffer()));

  const asset = await prisma.fileAsset.create({
    data: {
      // `url` giu duong dan disk tuong doi; client tai file qua GET /files/:id.
      url: `/uploads/${diskName}`,
      filename: meta.filename,
      mimeType: meta.mimeType,
      size: meta.size,
      createdBy: actorId,
      updatedBy: actorId,
    },
  });

  await logAudit({
    actorId,
    action: "file.upload",
    entity: "FileAsset",
    entityId: asset.id,
    metadata: { filename: asset.filename, size: asset.size },
  });
  return asset;
}

export function getFileAsset(id: string) {
  return prisma.fileAsset.findFirst({ where: { id, deletedAt: null } });
}

// basename() de du lieu DB co bi sua tay cung khong doc ra ngoai UPLOAD_DIR.
// Tra null neu file khong con tren disk -> route doi thanh 404.
export async function readFileAssetBytes(url: string): Promise<Buffer | null> {
  try {
    return await readFile(path.join(UPLOAD_DIR, path.basename(url)));
  } catch {
    return null;
  }
}
