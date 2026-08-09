// Goi NestJS API tu phia server (Server Component / Server Action / Route Handler).
// Token doc tu cookie httpOnly -> khong bao gio vao JS cua browser, khong can CORS.
import { getToken } from "./session";

const API_URL = process.env.API_URL ?? "http://localhost:4000";

export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const token = await getToken();
  return fetch(API_URL + path, {
    ...init,
    headers: {
      // FormData tu set Content-Type kem boundary -> khong duoc de dan json vao.
      ...(init?.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
    cache: "no-store",
  });
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await apiFetch(path, init);
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? `Loi ${res.status}`);
  }
  return (await res.json()) as T;
}
