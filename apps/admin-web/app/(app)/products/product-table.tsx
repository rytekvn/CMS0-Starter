"use client";

// Dao Client duy nhat cua trang danh sach: chon dong, xac nhan xoa, bulk, import.
// Du lieu va quyen do Server Component truyen xuong; moi lenh ghi goi Server Action.
import Link from "next/link";
import { useRef, useState, useTransition, type ChangeEvent, type ReactNode } from "react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { DataTable, type Column } from "@/components/data-table";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { importProductsCsv, removeProduct, runBulkAction } from "./actions";
import type { BulkAction, ImportResult, Product } from "./schema";

export type ProductPermissions = {
  create: boolean;
  update: boolean;
  delete: boolean;
  import: boolean;
  export: boolean;
  bulk: boolean;
};

export function ProductTable({
  rows,
  filters,
  can,
  exportHref,
}: {
  rows: Product[];
  // Panel filter render o server roi truyen xuong (giu dung thu tu cua legacy).
  filters: ReactNode;
  can: ProductPermissions;
  exportHref: string;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const [toDelete, setToDelete] = useState<Product | null>(null);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState("");
  const [, startTransition] = useTransition();
  const importInput = useRef<HTMLInputElement>(null);

  // Server Action tra ve chuoi loi (hoac undefined khi thanh cong).
  const run = (action: () => Promise<string | undefined>) =>
    startTransition(async () => {
      const failure = await action();
      setError(failure ?? "");
      if (!failure) setSelected([]);
    });

  const bulk = (action: BulkAction) => run(() => runBulkAction(selected, action));

  async function onImport(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // chon lai dung file vua roi van ban change
    if (!file) return;

    setError("");
    setImportResult(null);
    const body = new FormData();
    body.append("file", file);
    const { result, error: failure } = await importProductsCsv(body);
    setError(failure ?? "");
    setImportResult(result ?? null);
  }

  const columns: Column<Product>[] = [
    {
      key: "name",
      header: "Ten",
      render: (p) => <Link href={`/products/${p.id}`}>{p.name}</Link>,
    },
    { key: "status", header: "Trang thai", render: (p) => <StatusBadge status={p.status} /> },
    {
      key: "createdAt",
      header: "Ngay tao",
      render: (p) => (
        // suppressHydrationWarning: server va browser co the khac timezone.
        <span suppressHydrationWarning>
          {new Date(p.createdAt).toLocaleDateString("vi-VN")}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      render: (p) => (
        <span className="row-actions">
          {can.update && <Link href={`/products/${p.id}/edit`}>Sua</Link>}
          {can.delete && (
            <button type="button" className="link danger" onClick={() => setToDelete(p)}>
              Xoa
            </button>
          )}
        </span>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Products"
        actions={
          <>
            {can.export && (
              // <button> chu khong <a>: giu dung style cua legacy. Content-Disposition
              // cua route proxy khien trinh duyet tai file thay vi doi trang.
              <button type="button" onClick={() => window.location.assign(exportHref)}>
                Export CSV
              </button>
            )}
            {can.import && (
              <>
                <button type="button" onClick={() => importInput.current?.click()}>
                  Import CSV
                </button>
                <input
                  ref={importInput}
                  type="file"
                  accept=".csv,text/csv"
                  hidden
                  onChange={onImport}
                />
              </>
            )}
            {can.create && (
              <Link className="button" href="/products/new">
                + Them moi
              </Link>
            )}
          </>
        }
      />

      {filters}

      {error && <p className="form-error">{error}</p>}

      {importResult && (
        <div className="import-result">
          <p>
            Import: {importResult.success} thanh cong, {importResult.failed} loi.
            <button type="button" className="link" onClick={() => setImportResult(null)}>
              Dong
            </button>
          </p>
          {importResult.errors.length > 0 && (
            <ul>
              {importResult.errors.map((err) => (
                <li key={err.row}>
                  Dong {err.row}: {err.message}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {can.bulk && selected.length > 0 && (
        <div className="bulk-bar">
          <span>Da chon {selected.length} dong</span>
          <button type="button" onClick={() => bulk("activate")}>
            Kich hoat
          </button>
          <button type="button" onClick={() => bulk("deactivate")}>
            Ngung kich hoat
          </button>
          <button type="button" className="danger" onClick={() => setBulkDeleting(true)}>
            Xoa
          </button>
        </div>
      )}

      <DataTable
        columns={columns}
        rows={rows}
        empty="Chua co product nao"
        selected={selected}
        onSelect={can.bulk ? setSelected : undefined}
      />

      <ConfirmDialog
        open={toDelete !== null}
        message={`Xoa product "${toDelete?.name}"?`}
        onConfirm={() => {
          const target = toDelete;
          setToDelete(null);
          if (target) run(() => removeProduct(target.id));
        }}
        onCancel={() => setToDelete(null)}
      />

      <ConfirmDialog
        open={bulkDeleting}
        message={`Xoa ${selected.length} product da chon?`}
        onConfirm={() => {
          setBulkDeleting(false);
          bulk("delete");
        }}
        onCancel={() => setBulkDeleting(false)}
      />
    </div>
  );
}
