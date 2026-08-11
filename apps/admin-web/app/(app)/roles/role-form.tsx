"use client";

// Form dung chung cho tao va sua (khac nhau moi cai `id`).
import { useRouter } from "next/navigation";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { FormError } from "@/components/form-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveRole } from "./actions";
import type { Permission, RoleFormValues } from "./schema";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Dang luu..." : "Luu"}
    </Button>
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
    <form className="flex max-w-[640px] flex-col gap-3.5" action={formAction}>
      {state && <FormError>{state.error}</FormError>}
      <div className="grid gap-1.5">
        <Label htmlFor="name">Ten role</Label>
        <Input id="name" name="name" defaultValue={values.name} required autoFocus />
      </div>
      <fieldset className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-x-4 gap-y-2 rounded-md border border-border bg-surface px-4 py-3.5">
        <legend className="px-1.5 text-[13px] font-semibold text-muted-foreground">Quyen</legend>
        {permissions.length === 0 && (
          <span className="text-[13px] text-muted-foreground">Khong co quyen nao</span>
        )}
        {permissions.map((permission) => (
          // Checkbox native: server action doc bang formData.getAll("permissionKeys").
          <label
            key={permission.id}
            className="flex items-center gap-2 text-[13px] text-foreground"
          >
            <input
              type="checkbox"
              name="permissionKeys"
              value={permission.key}
              defaultChecked={values.permissionKeys.includes(permission.key)}
              className="size-4 cursor-pointer accent-primary"
            />
            {permission.key}
          </label>
        ))}
      </fieldset>
      <div className="mt-1 flex gap-2">
        <Button type="button" variant="outline" onClick={() => router.push(cancelHref)}>
          Huy
        </Button>
        <SubmitButton />
      </div>
    </form>
  );
}
