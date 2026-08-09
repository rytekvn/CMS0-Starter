"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { login } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending}>
      {pending ? "Dang dang nhap..." : "Dang nhap"}
    </button>
  );
}

export function LoginForm() {
  const [state, formAction] = useActionState(login, undefined);

  return (
    <form className="login-form" action={formAction}>
      <h1>Rytek CMS</h1>
      {state && <p className="form-error">{state.error}</p>}
      <label>
        Email
        <input type="email" name="email" defaultValue={state?.email} required autoFocus />
      </label>
      <label>
        Mat khau
        <input type="password" name="password" required />
      </label>
      <SubmitButton />
    </form>
  );
}
