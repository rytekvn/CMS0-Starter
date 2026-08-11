// Phien dang nhap: token nam trong cookie httpOnly, chi server doc duoc.
// User + permissions lay tu GET /auth/me cua apps/api (NestJS).
// Tu goi fetch chu khong dung lib/api.ts: lib/api.ts import getToken tu file nay,
// dung nguoc lai se thanh vong import.
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

const API_URL = process.env.API_URL ?? "http://localhost:4000";

export const TOKEN_COOKIE = "token";

export type CurrentUser = {
  id: string;
  email: string;
  name: string;
  roles: { role: { id: string; name: string } }[];
  permissions: string[];
};

export async function getToken(): Promise<string | undefined> {
  return (await cookies()).get(TOKEN_COOKIE)?.value;
}

// cache(): mot lan render chi goi /auth/me dung 1 lan du layout lan page cung hoi.
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const token = await getToken();
  if (!token) return null;

  const res = await fetch(`${API_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) return null;
  return (await res.json()) as CurrentUser;
});

// Token het han / bi thu hoi: middleware khong biet (chi thay cookie con do) -> chan o day.
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}
