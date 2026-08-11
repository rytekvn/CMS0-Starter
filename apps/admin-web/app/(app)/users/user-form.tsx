"use client";

// Form dung chung cho tao va sua (khac nhau moi cai `id`).
import { useRouter } from "next/navigation";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { FormError } from "@/components/form-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { saveUser } from "./actions";
import type { RoleOption, UserFormValues } from "./schema";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Dang luu..." : "Luu"}
    </Button>
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
    <form className="flex max-w-[380px] flex-col gap-3.5" action={formAction}>
      {state && <FormError>{state.error}</FormError>}
      <div className="grid gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          defaultValue={values.email}
          required
          autoFocus
        />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="name">Ten</Label>
        <Input id="name" name="name" defaultValue={values.name} required />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="password">
          Mat khau
          {id && <span className="font-normal text-muted-foreground">(de trong = giu nguyen)</span>}
        </Label>
        <Input
          id="password"
          name="password"
          type="password"
          defaultValue={values.password}
          minLength={6}
          required={!id}
          autoComplete="new-password"
        />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="roleIds">Role</Label>
        {roles.length === 0 ? (
          <span className="text-[13px] text-muted-foreground">Khong co role nao de chon</span>
        ) : (
          // Native multi-select: giu Ctrl/Cmd de chon nhieu. Khong them thu vien.
          <NativeSelect
            id="roleIds"
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
          </NativeSelect>
        )}
      </div>
      <div className="mt-1 flex gap-2">
        <Button type="button" variant="outline" onClick={() => router.push(cancelHref)}>
          Huy
        </Button>
        <SubmitButton />
      </div>
    </form>
  );
}
