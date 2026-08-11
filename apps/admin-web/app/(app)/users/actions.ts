"use server";

// Moi lenh ghi di qua Server Action -> token cookie khong bao gio ra client,
// va revalidatePath() la du de danh sach tu load lai.
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createUser, deleteUser, updateUser } from "./api";
import type { UserFormValues } from "./schema";

const message = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

export type UserFormState = { error: string; values: UserFormValues } | undefined;

// id = undefined -> tao moi, co id -> sua. Dung chung 1 form o ca 2 trang.
export async function saveUser(
  id: string | undefined,
  _prev: UserFormState,
  formData: FormData
): Promise<UserFormState> {
  const values: UserFormValues = {
    email: String(formData.get("email") ?? ""),
    name: String(formData.get("name") ?? ""),
    password: String(formData.get("password") ?? ""),
    roleIds: formData.getAll("roleIds").map(String),
  };

  // Sua ma de trong o mat khau = giu nguyen mat khau cu -> bo han key `password`
  // khoi payload (schema PATCH la .partial() nen thieu field la hop le).
  const { password, ...rest } = values;
  const payload = password ? values : rest;

  let targetId = id;
  try {
    if (id) await updateUser(id, payload);
    else targetId = (await createUser(values)).id;
  } catch (error) {
    return { error: message(error, id ? "Luu that bai" : "Tao that bai"), values };
  }

  revalidatePath("/users");
  revalidatePath(`/users/${targetId}`);
  // redirect() nem exception de dieu huong -> phai nam ngoai try/catch.
  redirect(`/users/${targetId}`);
}

export async function removeUser(id: string): Promise<string | undefined> {
  try {
    await deleteUser(id);
  } catch (error) {
    return message(error, "Xoa that bai");
  }
  revalidatePath("/users");
}
