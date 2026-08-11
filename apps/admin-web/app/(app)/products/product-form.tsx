"use client";

// Form dung chung cho tao va sua (khac nhau moi cai `id`).
import { useRouter } from "next/navigation";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { FormError } from "@/components/form-error";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { saveProduct } from "./actions";
import type { ProductInput } from "./schema";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Dang luu..." : "Luu"}
    </Button>
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
    <form className="flex max-w-[380px] flex-col gap-3.5" action={formAction}>
      {state && <FormError>{state.error}</FormError>}
      <div className="grid gap-1.5">
        <Label htmlFor="name">Ten</Label>
        <Input id="name" name="name" defaultValue={values.name} required autoFocus />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="status">Trang thai</Label>
        <NativeSelect id="status" name="status" defaultValue={values.status}>
          <option value="active">active</option>
          <option value="inactive">inactive</option>
        </NativeSelect>
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
