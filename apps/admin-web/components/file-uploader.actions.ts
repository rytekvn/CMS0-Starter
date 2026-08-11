"use server";

// Upload di qua Server Action -> token cookie httpOnly khong bao gio ra client.
import { api } from "@/lib/api";

export type FileAsset = {
  id: string;
  url: string;
  filename: string;
  mimeType: string;
  size: number;
  createdAt: string;
};

export async function uploadFile(
  formData: FormData
): Promise<{ asset?: FileAsset; error?: string }> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Chua chon file" };

  try {
    const body = new FormData();
    body.append("file", file);
    return { asset: await api<FileAsset>("/files", { method: "POST", body }) };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Upload that bai" };
  }
}
