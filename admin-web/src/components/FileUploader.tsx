// Upload file -> FileAsset (POST /files), kem link tai lai qua GET /files/:id.
// Dung chung cho module can dinh kem file; caller tu boc PermissionGuard "file.upload" neu can.
import { useState, type ChangeEvent } from "react";
import { api, download } from "../api/client";

export type FileAsset = {
  id: string;
  url: string;
  filename: string;
  mimeType: string;
  size: number;
  createdAt: string;
};

const formatSize = (bytes: number) =>
  bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KB`;

export function FileUploader({ onUploaded }: { onUploaded?: (file: FileAsset) => void }) {
  const [file, setFile] = useState<FileAsset | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function upload(e: ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files?.[0];
    if (!picked) return;

    setBusy(true);
    setError("");
    try {
      const body = new FormData();
      body.append("file", picked);
      const asset = await api<FileAsset>("/files", { method: "POST", body });
      setFile(asset);
      onUploaded?.(asset);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload that bai");
    } finally {
      setBusy(false);
      e.target.value = ""; // chon lai dung file vua roi van ban change.
    }
  }

  return (
    <div className="file-uploader">
      <input type="file" onChange={upload} disabled={busy} />
      {busy && <span className="file-uploader-hint">Dang tai len...</span>}
      {error && <p className="form-error">{error}</p>}
      {file && (
        <p className="file-uploader-result">
          <span>{file.filename}</span>
          <span className="file-uploader-hint">{formatSize(file.size)}</span>
          <button
            type="button"
            className="link"
            onClick={() =>
              download(`/files/${file.id}`, file.filename).catch((err: Error) =>
                setError(err.message)
              )
            }
          >
            Tai ve
          </button>
        </p>
      )}
    </div>
  );
}
