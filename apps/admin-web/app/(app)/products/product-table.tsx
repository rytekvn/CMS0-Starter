"use client";

// Dao Client duy nhat cua trang danh sach: chon dong, xac nhan xoa, bulk, import.
// Du lieu va quyen do Server Component truyen xuong; moi lenh ghi goi Server Action.
import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { useRef, useState, useTransition, type ChangeEvent, type ReactNode } from "react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { DataTable } from "@/components/data-table";
import { FormError } from "@/components/form-error";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
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

  const columns: ColumnDef<Product>[] = [
    {
      id: "name",
      header: "Ten",
      cell: ({ row }) => (
        <Link href={`/products/${row.original.id}`} className="text-primary hover:underline">
          {row.original.name}
        </Link>
      ),
    },
    {
      id: "status",
      header: "Trang thai",
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      id: "createdAt",
      header: "Ngay tao",
      cell: ({ row }) => (
        // suppressHydrationWarning: server va browser co the khac timezone.
        <span suppressHydrationWarning>
          {new Date(row.original.createdAt).toLocaleDateString("vi-VN")}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <span className="flex items-center gap-3">
          {can.update && (
            <Link
              href={`/products/${row.original.id}/edit`}
              className="text-primary hover:underline"
            >
              Sua
            </Link>
          )}
          {can.delete && (
            <Button
              type="button"
              variant="link"
              size="sm"
              className="h-auto p-0 text-danger"
              onClick={() => setToDelete(row.original)}
            >
              Xoa
            </Button>
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
              <Button
                type="button"
                variant="outline"
                onClick={() => window.location.assign(exportHref)}
              >
                Export CSV
              </Button>
            )}
            {can.import && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => importInput.current?.click()}
                >
                  Import CSV
                </Button>
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
              <Button asChild>
                <Link href="/products/new">+ Them moi</Link>
              </Button>
            )}
          </>
        }
      />

      {filters}

      {error && <FormError>{error}</FormError>}

      {importResult && (
        <div className="mb-3 rounded-md border border-border bg-surface px-4 py-3 text-[13px] shadow-sm">
          <p className="flex items-center gap-2.5">
            Import: {importResult.success} thanh cong, {importResult.failed} loi.
            <Button
              type="button"
              variant="link"
              size="sm"
              className="h-auto p-0"
              onClick={() => setImportResult(null)}
            >
              Dong
            </Button>
          </p>
          {importResult.errors.length > 0 && (
            <ul className="mt-2.5 list-disc pl-4.5 text-danger">
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
        <div className="mb-3 flex items-center gap-2.5 rounded-md border border-primary bg-primary/10 px-3.5 py-2.5 text-[13px] font-semibold text-primary">
          <span>Da chon {selected.length} dong</span>
          <Button type="button" variant="outline" size="sm" onClick={() => bulk("activate")}>
            Kich hoat
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => bulk("deactivate")}>
            Ngung kich hoat
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={() => setBulkDeleting(true)}
          >
            Xoa
          </Button>
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
