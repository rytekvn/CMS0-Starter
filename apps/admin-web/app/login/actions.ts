"use server";

// Server Action (khong Route Handler): token tu /auth/login di thang vao cookie
// httpOnly o phia server, khong bao gio di qua JS cua browser.
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { TOKEN_COOKIE } from "@/lib/session";

const API_URL = process.env.API_URL ?? "http://localhost:4000";
const SEVEN_DAYS = 60 * 60 * 24 * 7; // khop expiresIn cua JWT ben apps/api

// Tra ca `email` ve: React 19 reset form uncontrolled sau moi action, khong tra
// lai thi go sai mat khau mot lan la mat luon email da nhap.
export type LoginState = { error: string; email: string } | undefined;

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "");

  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      password: String(formData.get("password") ?? ""),
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    return { error: body?.error ?? "Dang nhap that bai", email };
  }

  const { token } = (await res.json()) as { token: string };
  (await cookies()).set(TOKEN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SEVEN_DAYS,
    path: "/",
  });

  // redirect() nem exception de dieu huong -> phai nam ngoai try/catch.
  redirect("/products");
}

export async function logout(): Promise<void> {
  (await cookies()).delete(TOKEN_COOKIE);
  redirect("/login");
}
