import { z } from "zod";

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

// Whitelist mime -> duoi file dung khi luu disk.
// Duoi LUON lay tu bang nay, khong bao gio lay tu ten file cua user (tranh path traversal).
export const EXT_BY_MIME: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/gif": "gif",
  "image/webp": "webp",
  "application/pdf": "pdf",
  "text/csv": "csv",
};

export const uploadSchema = z.object({
  filename: z.string().min(1).max(255),
  // Browser co the gui kem charset ("text/csv; charset=utf-8") -> cat bo truoc khi so khop.
  // Object.hasOwn chu khong dung `in`: `in` cho "constructor" lot qua prototype chain.
  mimeType: z
    .string()
    .transform((m) => m.split(";")[0].trim().toLowerCase())
    .refine((m) => Object.hasOwn(EXT_BY_MIME, m), "Unsupported file type"),
  size: z.number().int().positive().max(MAX_UPLOAD_BYTES, "File too large (max 5MB)"),
});
