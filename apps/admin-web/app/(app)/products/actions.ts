"use server";

// Moi lenh ghi di qua Server Action -> token cookie khong bao gio ra client,
// va revalidatePath() la du de danh sach tu load lai (khong can state client).
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  bulkProducts,
  createProduct,
  deleteProduct,
  importProducts,
  updateProduct,
} from "./api";
import type { BulkAction, ImportResult, ProductInput } from "./schema";

const message = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

export type ProductFormState = { error: string; values: ProductInput } | undefined;

// id = undefined -> tao moi, co id -> sua. Dung chung 1 form o ca 2 trang.
export async function saveProduct(
  id: string | undefined,
  _prev: ProductFormState,
  formData: FormData
): Promise<ProductFormState> {
  const values: ProductInput = {
    name: String(formData.get("name") ?? ""),
    status: String(formData.get("status") ?? "active") as ProductInput["status"],
  };

  let targetId = id;
  try {
    if (id) await updateProduct(id, values);
    else targetId = (await createProduct(values)).id;
  } catch (error) {
    return { error: message(error, id ? "Luu that bai" : "Tao that bai"), values };
  }

  revalidatePath("/products");
  revalidatePath(`/products/${targetId}`);
  // redirect() nem exception de dieu huong -> phai nam ngoai try/catch.
  redirect(`/products/${targetId}`);
}

export async function removeProduct(id: string): Promise<string | undefined> {
  try {
    await deleteProduct(id);
  } catch (error) {
    return message(error, "Xoa that bai");
  }
  revalidatePath("/products");
}

export async function runBulkAction(
  ids: string[],
  action: BulkAction
): Promise<string | undefined> {
  try {
    await bulkProducts(ids, action);
  } catch (error) {
    return message(error, "Hanh dong hang loat that bai");
  }
  revalidatePath("/products");
}

export async function importProductsCsv(
  formData: FormData
): Promise<{ result?: ImportResult; error?: string }> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Chua chon file" };

  try {
    const result = await importProducts(file);
    revalidatePath("/products");
    return { result };
  } catch (error) {
    return { error: message(error, "Import that bai") };
  }
}
