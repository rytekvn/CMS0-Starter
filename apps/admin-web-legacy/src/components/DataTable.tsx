// Bang du lieu dung chung cho moi module CRUD.
import type { ReactNode } from "react";

export type Column<T> = {
  key: string;
  header: string;
  // Khong truyen render -> lay thang row[key].
  render?: (row: T) => ReactNode;
};

export function DataTable<T extends { id: string }>({
  columns,
  rows,
  empty = "Khong co du lieu",
  selected,
  onSelect,
}: {
  columns: Column<T>[];
  rows: T[];
  empty?: ReactNode;
  // Truyen ca hai -> hien cot checkbox. Bo qua -> bang giu nguyen nhu cu.
  selected?: string[];
  onSelect?: (ids: string[]) => void;
}) {
  if (rows.length === 0) return <p className="empty-state">{empty}</p>;

  const picked = selected ?? [];
  // Chon-tat-ca chi tinh tren cac dong dang hien (rows = 1 trang), khong dung cham trang khac.
  const allChecked = rows.every((row) => picked.includes(row.id));

  const toggleRow = (id: string) =>
    onSelect?.(picked.includes(id) ? picked.filter((x) => x !== id) : [...picked, id]);

  const toggleAll = () =>
    onSelect?.(
      allChecked
        ? picked.filter((id) => !rows.some((row) => row.id === id))
        : [...new Set([...picked, ...rows.map((row) => row.id)])]
    );

  return (
    <table className="data-table">
      <thead>
        <tr>
          {onSelect && (
            <th className="col-select">
              <input
                type="checkbox"
                aria-label="Chon tat ca"
                checked={allChecked}
                onChange={toggleAll}
              />
            </th>
          )}
          {columns.map((col) => (
            <th key={col.key}>{col.header}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.id}>
            {onSelect && (
              <td className="col-select">
                <input
                  type="checkbox"
                  aria-label={`Chon dong ${row.id}`}
                  checked={picked.includes(row.id)}
                  onChange={() => toggleRow(row.id)}
                />
              </td>
            )}
            {columns.map((col) => (
              <td key={col.key}>
                {col.render
                  ? col.render(row)
                  : String((row as Record<string, unknown>)[col.key] ?? "")}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
