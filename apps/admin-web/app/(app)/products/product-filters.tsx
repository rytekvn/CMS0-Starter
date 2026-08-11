"use client";

// Form GET thuan: submit -> trinh duyet tu dat filter vao query string, page.tsx
// doc lai tu searchParams. Khong can router/debounce/state (F5 va chia se link
// giu nguyen trang thai vi trang thai nam trong URL).
// "use client" chi de auto-submit khi doi select/ngay; o tim kiem submit bang Enter.
import type { ChangeEvent } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import type { ProductFilter } from "./schema";

const submitForm = (e: ChangeEvent<HTMLElement>) =>
  (e.currentTarget as HTMLElement & { form: HTMLFormElement | null }).form?.requestSubmit();

const fieldLabel = "gap-1.5 text-[13px] whitespace-nowrap text-muted-foreground";

export function ProductFilters({ filter }: { filter: ProductFilter }) {
  return (
    <form className="mb-4.5 flex flex-wrap items-center gap-2.5" action="/products">
      <Input
        className="w-auto min-w-60"
        type="search"
        name="search"
        defaultValue={filter.search ?? ""}
        placeholder="Tim theo ten roi Enter"
        aria-label="Tim theo ten"
      />
      <NativeSelect
        className="w-auto"
        name="status"
        defaultValue={filter.status ?? ""}
        onChange={submitForm}
        aria-label="Trang thai"
      >
        <option value="">Tat ca trang thai</option>
        <option value="active">active</option>
        <option value="inactive">inactive</option>
      </NativeSelect>
      <Label className={fieldLabel}>
        Tu ngay
        <Input
          className="w-auto"
          type="date"
          name="createdFrom"
          defaultValue={filter.createdFrom ?? ""}
          max={filter.createdTo || undefined}
          onChange={submitForm}
        />
      </Label>
      <Label className={fieldLabel}>
        Den ngay
        <Input
          className="w-auto"
          type="date"
          name="createdTo"
          defaultValue={filter.createdTo ?? ""}
          min={filter.createdFrom || undefined}
          onChange={submitForm}
        />
      </Label>
    </form>
  );
}
