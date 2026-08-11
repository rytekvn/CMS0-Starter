"use client";

// Dao Client duy nhat cua trang danh sach: xac nhan xoa.
// Du lieu va quyen do Server Component truyen xuong; lenh ghi goi Server Action.
import Link from "next/link";
import { useState, useTransition } from "react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { DataTable, type Column } from "@/components/data-table";
import { PageHeader } from "@/components/page-header";
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

  const columns: Column<User>[] = [
    {
      key: "name",
      header: "Ten",
      render: (u) => <Link href={`/users/${u.id}`}>{u.name}</Link>,
    },
    { key: "email", header: "Email" },
    {
      key: "roles",
      header: "Role",
      render: (u) => u.roles.map((r) => r.role.name).join(", ") || "-",
    },
    {
      key: "createdAt",
      header: "Ngay tao",
      render: (u) => (
        // suppressHydrationWarning: server va browser co the khac timezone.
        <span suppressHydrationWarning>
          {new Date(u.createdAt).toLocaleDateString("vi-VN")}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      render: (u) => (
        <span className="row-actions">
          {can.update && <Link href={`/users/${u.id}/edit`}>Sua</Link>}
          {can.delete && (
            <button type="button" className="link danger" onClick={() => setToDelete(u)}>
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
        title="Users"
        actions={
          can.create && (
            <Link className="button" href="/users/new">
              + Them moi
            </Link>
          )
        }
      />

      {error && <p className="form-error">{error}</p>}

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
