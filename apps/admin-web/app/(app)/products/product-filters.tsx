"use client";

// Form GET thuan: submit -> trinh duyet tu dat filter vao query string, page.tsx
// doc lai tu searchParams. Khong can router/debounce/state (F5 va chia se link
// giu nguyen trang thai vi trang thai nam trong URL).
// "use client" chi de auto-submit khi doi select/ngay; o tim kiem submit bang Enter.
import type { ChangeEvent } from "react";
import type { ProductFilter } from "./schema";

const submitForm = (e: ChangeEvent<HTMLElement>) =>
  (e.currentTarget as HTMLElement & { form: HTMLFormElement | null }).form?.requestSubmit();

export function ProductFilters({ filter }: { filter: ProductFilter }) {
  return (
    <form className="filter-panel" action="/products">
      <input
        className="search-input"
        type="search"
        name="search"
        defaultValue={filter.search ?? ""}
        placeholder="Tim theo ten roi Enter"
        aria-label="Tim theo ten"
      />
      <select
        name="status"
        defaultValue={filter.status ?? ""}
        onChange={submitForm}
        aria-label="Trang thai"
      >
        <option value="">Tat ca trang thai</option>
        <option value="active">active</option>
        <option value="inactive">inactive</option>
      </select>
      <label className="filter-field">
        Tu ngay
        <input
          type="date"
          name="createdFrom"
          defaultValue={filter.createdFrom ?? ""}
          max={filter.createdTo || undefined}
          onChange={submitForm}
        />
      </label>
      <label className="filter-field">
        Den ngay
        <input
          type="date"
          name="createdTo"
          defaultValue={filter.createdTo ?? ""}
          min={filter.createdFrom || undefined}
          onChange={submitForm}
        />
      </label>
    </form>
  );
}
