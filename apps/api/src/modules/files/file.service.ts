// Service FileAsset - noi duy nhat goi Prisma cho entity nay.
// Luu disk o apps/api/uploads/ voi ten ngau nhien; ten goc chi nam trong DB (field `filename`).
// ponytail: luu local disk, doc ca file vao RAM (tran 5MB) - doi sang S3/stream khi can.
import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { Injectable } from "@nestjs/common";
import type { FileAsset } from "@prisma/client";
import { logAudit } from "../../common/audit";
import { PrismaService } from "../../infrastructure/database/prisma.service";
import { EXT_BY_MIME, type UploadMeta } from "./file.schema";

// Tinh tu thu muc chua file nay -> apps/api/uploads, khong phu thuoc cwd.
// 3 cap `..`: src/modules/files -> apps/api (dist/modules/files cung do sau,
// nen `nest build` va `tsx` deu ra cung mot thu muc, khong lot vao dist/).
const UPLOAD_DIR = path.resolve(__dirname, "../../../uploads");

@Injectable()
export class FileService {
  constructor(private readonly prisma: PrismaService) {}

  async save(meta: UploadMeta, bytes: Buffer, actorId: string): Promise<FileAsset> {
    const diskName = `${randomUUID()}.${EXT_BY_MIME[meta.mimeType]}`;
    await mkdir(UPLOAD_DIR, { recursive: true });
    await writeFile(path.join(UPLOAD_DIR, diskName), bytes);

    const asset = await this.prisma.fileAsset.create({
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

    await logAudit(this.prisma, {
      actorId,
      action: "file.upload",
      entity: "FileAsset",
      entityId: asset.id,
      metadata: { filename: asset.filename, size: asset.size },
    });
    return asset;
  }

  get(id: string): Promise<FileAsset | null> {
    return this.prisma.fileAsset.findFirst({ where: { id, deletedAt: null } });
  }

  // basename() de du lieu DB co bi sua tay cung khong doc ra ngoai UPLOAD_DIR.
  // Tra null neu file khong con tren disk -> controller doi thanh 404.
  async readBytes(url: string): Promise<Buffer | null> {
    try {
      return await readFile(path.join(UPLOAD_DIR, path.basename(url)));
    } catch {
      return null;
    }
  }
}
