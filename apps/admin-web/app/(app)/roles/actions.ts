"use server";

// Moi lenh ghi di qua Server Action -> token cookie khong bao gio ra client,
// va revalidatePath() la du de danh sach tu load lai.
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createRole, deleteRole, updateRole } from "./api";
import type { RoleFormValues } from "./schema";

const message = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

export type RoleFormState = { error: string; values: RoleFormValues } | undefined;

// id = undefined -> tao moi, co id -> sua. Dung chung 1 form o ca 2 trang.
export async function saveRole(
  id: string | undefined,
  _prev: RoleFormState,
  formData: FormData
): Promise<RoleFormState> {
  // Checkbox khong tick thi khong nam trong FormData -> bo het tick = mang rong
  // = xoa het quyen cua role (PATCH dung `set`, khong cong don).
  const values: RoleFormValues = {
    name: String(formData.get("name") ?? ""),
    permissionKeys: formData.getAll("permissionKeys").map(String),
  };

  let targetId = id;
  try {
    if (id) await updateRole(id, values);
    else targetId = (await createRole(values)).id;
  } catch (error) {
    return { error: message(error, id ? "Luu that bai" : "Tao that bai"), values };
  }

  revalidatePath("/roles");
  revalidatePath(`/roles/${targetId}`);
  // redirect() nem exception de dieu huong -> phai nam ngoai try/catch.
  redirect(`/roles/${targetId}`);
}

export async function removeRole(id: string): Promise<string | undefined> {
  try {
    await deleteRole(id);
  } catch (error) {
    return message(error, "Xoa that bai");
  }
  revalidatePath("/roles");
}
