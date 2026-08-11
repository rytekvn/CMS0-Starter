// Goi API cho module Roles. Chay o server (Server Component / Server Action),
// token lay tu cookie httpOnly.
import { api } from "@/lib/api";
import type { Permission, Role, RoleFormValues } from "./schema";

const BASE_URL = "/roles";

export function listRoles(): Promise<Role[]> {
  return api<Role[]>(BASE_URL);
}

// Danh sach quyen co the gan (du lieu tham chieu do seed so huu, chi doc).
export function listPermissions(): Promise<Permission[]> {
  return api<Permission[]>(`${BASE_URL}/permissions`);
}

export function getRole(id: string): Promise<Role> {
  return api<Role>(`${BASE_URL}/${id}`);
}

export function createRole(data: RoleFormValues): Promise<Role> {
  return api<Role>(BASE_URL, { method: "POST", body: JSON.stringify(data) });
}

export function updateRole(id: string, data: RoleFormValues): Promise<Role> {
  return api<Role>(`${BASE_URL}/${id}`, { method: "PATCH", body: JSON.stringify(data) });
}

export function deleteRole(id: string): Promise<void> {
  return api<{ ok: true }>(`${BASE_URL}/${id}`, { method: "DELETE" }).then(() => undefined);
}
