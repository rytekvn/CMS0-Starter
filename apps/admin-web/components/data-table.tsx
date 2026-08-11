"use client";

// Bang du lieu dung chung cho moi module CRUD. Ruot la TanStack Table nhung chi
// dung getCoreRowModel: sort/filter/phan trang deu do API + URL quyet dinh, them
// row model o client se thanh nguon su that thu hai.
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import type { ReactNode } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

const checkboxClass = "size-4 cursor-pointer align-middle accent-primary";

export function DataTable<T extends { id: string }>({
  columns,
  rows,
  empty = "Khong co du lieu",
  selected,
  onSelect,
}: {
  columns: ColumnDef<T>[];
  rows: T[];
  empty?: ReactNode;
  // Truyen ca hai -> hien cot checkbox. Bo qua -> bang giu nguyen nhu cu.
  selected?: string[];
  onSelect?: (ids: string[]) => void;
}) {
  const picked = selected ?? [];
  // Chon-tat-ca chi tinh tren cac dong dang hien (rows = 1 trang), khong dung cham
  // trang khac: `picked` giu nguyen lua chon o cac trang truoc do.
  const allChecked = rows.every((row) => picked.includes(row.id));

  const toggleRow = (id: string) =>
    onSelect?.(picked.includes(id) ? picked.filter((x) => x !== id) : [...picked, id]);

  const toggleAll = () =>
    onSelect?.(
      allChecked
        ? picked.filter((id) => !rows.some((row) => row.id === id))
        : [...new Set([...picked, ...rows.map((row) => row.id)])]
    );

  const selectColumn: ColumnDef<T> = {
    id: "select",
    header: () => (
      <input
        type="checkbox"
        aria-label="Chon tat ca"
        checked={allChecked}
        onChange={toggleAll}
        className={checkboxClass}
      />
    ),
    cell: ({ row }) => (
      <input
        type="checkbox"
        aria-label={`Chon dong ${row.original.id}`}
        checked={picked.includes(row.original.id)}
        onChange={() => toggleRow(row.original.id)}
        className={checkboxClass}
      />
    ),
  };

  const table = useReactTable({
    data: rows,
    columns: onSelect ? [selectColumn, ...columns] : columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
  });

  if (rows.length === 0) return <p className="py-6 text-muted-foreground">{empty}</p>;

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-md">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((group) => (
            <TableRow key={group.id} className="hover:bg-transparent">
              {group.headers.map((header) => (
                <TableHead
                  key={header.id}
                  className={cn(
                    "bg-surface-muted px-4 py-3 text-xs font-semibold tracking-[0.04em] text-muted-foreground uppercase",
                    header.column.id === "select" && "w-10 pr-0"
                  )}
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id} className="border-border/60 hover:bg-accent">
              {row.getVisibleCells().map((cell) => (
                <TableCell
                  key={cell.id}
                  className={cn(
                    "px-4 py-3 text-foreground",
                    cell.column.id === "select" && "w-10 pr-0"
                  )}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
