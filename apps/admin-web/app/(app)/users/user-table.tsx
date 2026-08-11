"use client";

// Dao Client duy nhat cua trang danh sach: xac nhan xoa.
// Du lieu va quyen do Server Component truyen xuong; lenh ghi goi Server Action.
import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { useState, useTransition } from "react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { DataTable } from "@/components/data-table";
import { FormError } from "@/components/form-error";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { removeUser } from "./actions";
import type { User } from "./schema";

export function UserTable({
  rows,
  can,
}: {
  rows: User[];
  can: { create: boolean; update: boolean; delete: boolean };
}) {
  const [toDelete, setToDelete] = useState<User | null>(null);
  const [error, setError] = useState("");
  const [, startTransition] = useTransition();

  const columns: ColumnDef<User>[] = [
    {
      id: "name",
      header: "Ten",
      cell: ({ row }) => (
        <Link href={`/users/${row.original.id}`} className="text-primary hover:underline">
          {row.original.name}
        </Link>
      ),
    },
    { accessorKey: "email", header: "Email" },
    {
      id: "roles",
      header: "Role",
      cell: ({ row }) => row.original.roles.map((r) => r.role.name).join(", ") || "-",
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
              href={`/users/${row.original.id}/edit`}
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
        title="Users"
        actions={
          can.create && (
            <Button asChild>
              <Link href="/users/new">+ Them moi</Link>
            </Button>
          )
        }
      />

      {error && <FormError>{error}</FormError>}

      <DataTable columns={columns} rows={rows} empty="Chua co user nao" />

      <ConfirmDialog
        open={toDelete !== null}
        message={`Xoa user "${toDelete?.email}"?`}
        onConfirm={() => {
          const target = toDelete;
          setToDelete(null);
          if (target)
            startTransition(async () => setError((await removeUser(target.id)) ?? ""));
        }}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
