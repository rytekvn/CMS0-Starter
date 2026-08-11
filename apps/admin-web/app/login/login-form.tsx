"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { FormError } from "@/components/form-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Dang dang nhap..." : "Dang nhap"}
    </Button>
  );
}

export function LoginForm() {
  const [state, formAction] = useActionState(login, undefined);

  return (
    <form
      className="mx-auto my-[90px] flex max-w-[380px] flex-col gap-3.5 rounded-lg border border-border bg-surface p-8 shadow-md"
      action={formAction}
    >
      <h1 className="mb-1 text-[19px] font-bold text-foreground">Rytek CMS</h1>
      {state && <FormError>{state.error}</FormError>}
      <div className="grid gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          name="email"
          defaultValue={state?.email}
          required
          autoFocus
        />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="password">Mat khau</Label>
        <Input id="password" type="password" name="password" required />
      </div>
      <SubmitButton />
    </form>
  );
}
