"use client";

// Form dung chung cho tao va sua (khac nhau moi cai `id`).
import { useRouter } from "next/navigation";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { saveProduct } from "./actions";
import type { ProductInput } from "./schema";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending}>
      {pending ? "Dang luu..." : "Luu"}
    </button>
  );
}

export function ProductForm({
  id,
  defaultValues,
  cancelHref,
}: {
  id?: string;
  defaultValues: ProductInput;
  cancelHref: string;
}) {
  const router = useRouter();
  const [state, formAction] = useActionState(saveProduct.bind(null, id), undefined);
  // Loi tra ve kem gia tri vua go: React 19 reset form uncontrolled sau moi action.
  const values = state?.values ?? defaultValues;

  return (
    <form className="entity-form" action={formAction}>
      {state && <p className="form-error">{state.error}</p>}
      <label>
        Ten
        <input name="name" defaultValue={values.name} required autoFocus />
      </label>
      <label>
        Trang thai
        <select name="status" defaultValue={values.status}>
          <option value="active">active</option>
          <option value="inactive">inactive</option>
        </select>
      </label>
      <div className="form-actions">
        <button type="button" onClick={() => router.push(cancelHref)}>
          Huy
        </button>
        <SubmitButton />
      </div>
    </form>
  );
}
