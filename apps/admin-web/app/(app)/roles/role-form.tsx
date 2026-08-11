"use client";

// Form dung chung cho tao va sua (khac nhau moi cai `id`).
import { useRouter } from "next/navigation";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { saveRole } from "./actions";
import type { Permission, RoleFormValues } from "./schema";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending}>
      {pending ? "Dang luu..." : "Luu"}
    </button>
  );
}

export function RoleForm({
  id,
  defaultValues,
  permissions,
  cancelHref,
}: {
  id?: string;
  defaultValues: RoleFormValues;
  permissions: Permission[];
  cancelHref: string;
}) {
  const router = useRouter();
  const [state, formAction] = useActionState(saveRole.bind(null, id), undefined);
  // Loi tra ve kem gia tri vua go: React 19 reset form uncontrolled sau moi action.
  const values = state?.values ?? defaultValues;

  return (
    <form className="entity-form entity-form-wide" action={formAction}>
      {state && <p className="form-error">{state.error}</p>}
      <label>
        Ten role
        <input name="name" defaultValue={values.name} required autoFocus />
      </label>
      <fieldset className="checkbox-list">
        <legend>Quyen</legend>
        {permissions.length === 0 && <span className="field-hint">Khong co quyen nao</span>}
        {permissions.map((permission) => (
          <label key={permission.id}>
            <input
              type="checkbox"
              name="permissionKeys"
              value={permission.key}
              defaultChecked={values.permissionKeys.includes(permission.key)}
            />
            {permission.key}
          </label>
        ))}
      </fieldset>
      <div className="form-actions">
        <button type="button" onClick={() => router.push(cancelHref)}>
          Huy
        </button>
        <SubmitButton />
      </div>
    </form>
  );
}
