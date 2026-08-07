// List Products - copy pattern nay khi tao module moi (vd Hotels).
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { Link } from "react-router-dom";
import { PageHeader } from "../../components/PageHeader";
import { DataTable, type Column } from "../../components/DataTable";
import { SearchInput } from "../../components/SearchInput";
import { FilterPanel } from "../../components/FilterPanel";
import { Pagination } from "../../components/Pagination";
import { StatusBadge } from "../../components/StatusBadge";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { PermissionGuard } from "../../components/PermissionGuard";
import { useCurrentUser } from "../../auth/useCurrentUser";
import {
  bulkProducts,
  deleteProduct,
  exportProducts,
  importProducts,
  listProducts,
} from "./api";
import { productPermissions } from "./permissions";
import type { BulkAction, ImportResult, Product } from "./schema";

const PAGE_SIZE = 10;

export function ProductList() {
  // Bulk gate bang can() thay vi PermissionGuard: can tat luon cot checkbox (prop cua DataTable).
  const canBulk = useCurrentUser().can(productPermissions.bulk);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [createdFrom, setCreatedFrom] = useState("");
  const [createdTo, setCreatedTo] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);
  const [toDelete, setToDelete] = useState<Product | null>(null);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const importInput = useRef<HTMLInputElement>(null);

  function load() {
    setLoading(true);
    setSelected([]);
    listProducts({ status, createdFrom, createdTo })
      .then(setProducts)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }

  // Filter roi rac (status/ngay) goi lai server; search go phim thi loc o client.
  useEffect(load, [status, createdFrom, createdTo]);

  // ponytail: search + phan trang o client vi bo du lieu con nho. Chuyen sang server
  // (?search=&page=) khi so ban ghi lon - endpoint da nhan san `search`.
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? products.filter((p) => p.name.toLowerCase().includes(q)) : products;
  }, [products, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  // Clamp thay vi reset bang effect: xoa het ban ghi trang cuoi van hien dung.
  const currentPage = Math.min(page, totalPages);
  const rows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const columns: Column<Product>[] = [
    {
      key: "name",
      header: "Ten",
      render: (p) => <Link to={`/products/${p.id}`}>{p.name}</Link>,
    },
    { key: "status", header: "Trang thai", render: (p) => <StatusBadge status={p.status} /> },
    {
      key: "createdAt",
      header: "Ngay tao",
      render: (p) => new Date(p.createdAt).toLocaleDateString("vi-VN"),
    },
    {
      key: "actions",
      header: "",
      render: (p) => (
        <span className="row-actions">
          <PermissionGuard permission={productPermissions.update}>
            <Link to={`/products/${p.id}/edit`}>Sua</Link>
          </PermissionGuard>
          <PermissionGuard permission={productPermissions.delete}>
            <button type="button" className="link danger" onClick={() => setToDelete(p)}>
              Xoa
            </button>
          </PermissionGuard>
        </span>
      ),
    },
  ];

  async function confirmDelete() {
    if (!toDelete) return;
    try {
      await deleteProduct(toDelete.id);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Xoa that bai");
    } finally {
      setToDelete(null);
    }
  }

  async function runBulk(action: BulkAction) {
    try {
      await bulkProducts(selected, action);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Hanh dong hang loat that bai");
    } finally {
      setBulkDeleting(false);
    }
  }

  function onExport() {
    setError("");
    exportProducts({ status, search, createdFrom, createdTo }).catch((e: Error) =>
      setError(e.message)
    );
  }

  async function onImport(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setImportResult(null);
    try {
      setImportResult(await importProducts(file));
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import that bai");
    } finally {
      e.target.value = ""; // chon lai dung file vua roi van ban change.
    }
  }

  return (
    <div>
      <PageHeader
        title="Products"
        actions={
          <>
            <PermissionGuard permission={productPermissions.export}>
              <button type="button" onClick={onExport}>
                Export CSV
              </button>
            </PermissionGuard>
            <PermissionGuard permission={productPermissions.import}>
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
            </PermissionGuard>
            <PermissionGuard permission={productPermissions.create}>
              <Link className="button" to="/products/new">
                + Them moi
              </Link>
            </PermissionGuard>
          </>
        }
      />

      <FilterPanel>
        <SearchInput
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
        />
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
        >
          <option value="">Tat ca trang thai</option>
          <option value="active">active</option>
          <option value="inactive">inactive</option>
        </select>
        <label className="filter-field">
          Tu ngay
          <input
            type="date"
            value={createdFrom}
            max={createdTo || undefined}
            onChange={(e) => {
              setCreatedFrom(e.target.value);
              setPage(1);
            }}
          />
        </label>
        <label className="filter-field">
          Den ngay
          <input
            type="date"
            value={createdTo}
            min={createdFrom || undefined}
            onChange={(e) => {
              setCreatedTo(e.target.value);
              setPage(1);
            }}
          />
        </label>
      </FilterPanel>

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

      {canBulk && selected.length > 0 && (
        <div className="bulk-bar">
          <span>Da chon {selected.length} dong</span>
          <button type="button" onClick={() => runBulk("activate")}>
            Kich hoat
          </button>
          <button type="button" onClick={() => runBulk("deactivate")}>
            Ngung kich hoat
          </button>
          <button type="button" className="danger" onClick={() => setBulkDeleting(true)}>
            Xoa
          </button>
        </div>
      )}

      {loading ? (
        <p className="page-loading">Dang tai...</p>
      ) : (
        <>
          <DataTable
            columns={columns}
            rows={rows}
            empty="Chua co product nao"
            selected={selected}
            onSelect={canBulk ? setSelected : undefined}
          />
          <Pagination page={currentPage} totalPages={totalPages} onChange={setPage} />
        </>
      )}

      <ConfirmDialog
        open={toDelete !== null}
        message={`Xoa product "${toDelete?.name}"?`}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />

      <ConfirmDialog
        open={bulkDeleting}
        message={`Xoa ${selected.length} product da chon?`}
        onConfirm={() => runBulk("delete")}
        onCancel={() => setBulkDeleting(false)}
      />
    </div>
  );
}
