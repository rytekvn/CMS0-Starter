"use client";

// Dao Client duy nhat cua trang danh sach: xac nhan xoa.
import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { useState, useTransition } from "react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { DataTable } from "@/components/data-table";
import { FormError } from "@/components/form-error";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
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

  const columns: ColumnDef<Role>[] = [
    {
      id: "name",
      header: "Ten",
      cell: ({ row }) => (
        <Link href={`/roles/${row.original.id}`} className="text-primary hover:underline">
          {row.original.name}
        </Link>
      ),
    },
    {
      id: "count",
      header: "So quyen",
      cell: ({ row }) => row.original.permissions.length,
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
              href={`/roles/${row.original.id}/edit`}
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
        title="Roles"
        actions={
          can.create && (
            <Button asChild>
              <Link href="/roles/new">+ Them moi</Link>
            </Button>
          )
        }
      />

      {error && <FormError>{error}</FormError>}

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
