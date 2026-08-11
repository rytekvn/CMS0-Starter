// Goi API cho module Users. Chay o server (Server Component / Server Action),
// token lay tu cookie httpOnly.
import { api } from "@/lib/api";
import type { RoleOption, User, UserFormValues } from "./schema";

const BASE_URL = "/users";

// Endpoint chua ho tro filter/pagination (xem spec Out of scope) -> tra toan bo,
// trang duoc cat o Server Component.
export function listUsers(): Promise<User[]> {
  return api<User[]>(BASE_URL);
}

export function getUser(id: string): Promise<User> {
  return api<User>(`${BASE_URL}/${id}`);
}

// `password` bat buoc khi tao; khi sua thi Server Action bo han key nay neu de trong.
export function createUser(data: Partial<UserFormValues>): Promise<User> {
  return api<User>(BASE_URL, { method: "POST", body: JSON.stringify(data) });
}

export function updateUser(id: string, data: Partial<UserFormValues>): Promise<User> {
  return api<User>(`${BASE_URL}/${id}`, { method: "PATCH", body: JSON.stringify(data) });
}

export function deleteUser(id: string): Promise<void> {
  return api<{ ok: true }>(`${BASE_URL}/${id}`, { method: "DELETE" }).then(() => undefined);
}

// Do multi-select role trong form user. Can quyen `role.read` - thieu quyen thi
// tra mang rong de form van luu duoc (chi la khong chon duoc role).
export function listRoleOptions(): Promise<RoleOption[]> {
  return api<RoleOption[]>("/roles").catch(() => []);
}
