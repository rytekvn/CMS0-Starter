"use client";

// Dao Client duy nhat cua trang danh sach: xac nhan xoa.
import Link from "next/link";
import { useState, useTransition } from "react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { DataTable, type Column } from "@/components/data-table";
import { PageHeader } from "@/components/page-header";
import { removeRole } from "./actions";
import type { Role } from "./schema";

export function RoleTable({
  rows,
  can,
}: {
  rows: Role[];
  can: { create: boolean; update: boolean; delete: boolean };
}) {
  const [toDelete, setToDelete] = useState<Role | null>(null);
  const [error, setError] = useState("");
  const [, startTransition] = useTransition();

  const columns: Column<Role>[] = [
    {
      key: "name",
      header: "Ten",
      render: (r) => <Link href={`/roles/${r.id}`}>{r.name}</Link>,
    },
    { key: "count", header: "So quyen", render: (r) => r.permissions.length },
    {
      key: "createdAt",
      header: "Ngay tao",
      render: (r) => (
        // suppressHydrationWarning: server va browser co the khac timezone.
        <span suppressHydrationWarning>
          {new Date(r.createdAt).toLocaleDateString("vi-VN")}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      render: (r) => (
        <span className="row-actions">
          {can.update && <Link href={`/roles/${r.id}/edit`}>Sua</Link>}
          {can.delete && (
            <button type="button" className="link danger" onClick={() => setToDelete(r)}>
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
        title="Roles"
        actions={
          can.create && (
            <Link className="button" href="/roles/new">
              + Them moi
            </Link>
          )
        }
      />

      {error && <p className="form-error">{error}</p>}

      <DataTable columns={columns} rows={rows} empty="Chua co role nao" />

      <ConfirmDialog
        open={toDelete !== null}
        message={`Xoa role "${toDelete?.name}"? User dang gan role nay se mat cac quyen tuong ung.`}
        onConfirm={() => {
          const target = toDelete;
          setToDelete(null);
          if (target)
            startTransition(async () => setError((await removeRole(target.id)) ?? ""));
        }}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
