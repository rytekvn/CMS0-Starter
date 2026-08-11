"use client";

// Form dung chung cho tao va sua (khac nhau moi cai `id`).
import { useRouter } from "next/navigation";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { saveUser } from "./actions";
import type { RoleOption, UserFormValues } from "./schema";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending}>
      {pending ? "Dang luu..." : "Luu"}
    </button>
  );
}

export function UserForm({
  id,
  defaultValues,
  roles,
  cancelHref,
}: {
  id?: string;
  defaultValues: UserFormValues;
  roles: RoleOption[];
  cancelHref: string;
}) {
  const router = useRouter();
  const [state, formAction] = useActionState(saveUser.bind(null, id), undefined);
  // Loi tra ve kem gia tri vua go: React 19 reset form uncontrolled sau moi action.
  const values = state?.values ?? defaultValues;

  return (
    <form className="entity-form" action={formAction}>
      {state && <p className="form-error">{state.error}</p>}
      <label>
        Email
        <input name="email" type="email" defaultValue={values.email} required autoFocus />
      </label>
      <label>
        Ten
        <input name="name" defaultValue={values.name} required />
      </label>
      <label>
        Mat khau {id && <span className="field-hint">(de trong = giu nguyen)</span>}
        <input
          name="password"
          type="password"
          defaultValue={values.password}
          minLength={6}
          required={!id}
          autoComplete="new-password"
        />
      </label>
      <label>
        Role
        {roles.length === 0 ? (
          <span className="field-hint">Khong co role nao de chon</span>
        ) : (
          // Native multi-select: giu Ctrl/Cmd de chon nhieu. Khong them thu vien.
          <select
            name="roleIds"
            multiple
            size={Math.min(roles.length, 6)}
            defaultValue={values.roleIds}
          >
            {roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </select>
        )}
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
