"use client";

// Upload file -> FileAsset (POST /files), kem link tai lai qua /api/files/:id.
// Dung chung cho module can dinh kem file; caller tu kiem quyen "file.upload" neu can.
// ponytail: chua trang nao dung - port de giu parity voi legacy FileUploader.tsx.
import { useState, useTransition, type ChangeEvent } from "react";
import { uploadFile, type FileAsset } from "./file-uploader.actions";

export type { FileAsset };

const formatSize = (bytes: number) =>
  bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KB`;

export function FileUploader({ onUploaded }: { onUploaded?: (file: FileAsset) => void }) {
  const [file, setFile] = useState<FileAsset | null>(null);
  const [error, setError] = useState("");
  const [busy, startTransition] = useTransition();

  function upload(e: ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files?.[0];
    e.target.value = ""; // chon lai dung file vua roi van ban change.
    if (!picked) return;

    const body = new FormData();
    body.append("file", picked);
    startTransition(async () => {
      const { asset, error: failure } = await uploadFile(body);
      setError(failure ?? "");
      setFile(asset ?? null);
      if (asset) onUploaded?.(asset);
    });
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
          {/* Route proxy dat Content-Disposition -> trinh duyet tai file, khong doi trang. */}
          <button
            type="button"
            className="link"
            onClick={() => window.location.assign(`/api/files/${file.id}`)}
          >
            Tai ve
          </button>
        </p>
      )}
    </div>
  );
}
