"use server";

import { revalidatePath } from "next/cache";
import { updateProductStock, updateProductVariantStock } from "@/lib/db/queries";

export async function updateProductStockAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  const stock = Number(formData.get("stock"));
  if (!id || !Number.isInteger(stock) || stock < 0) return;

  await updateProductStock(id, stock);
  revalidatePath("/admin/stock");
  revalidatePath("/");
}

export async function updateVariantStockAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  const stock = Number(formData.get("stock"));
  if (!id || !Number.isInteger(stock) || stock < 0) return;

  await updateProductVariantStock(id, stock);
  revalidatePath("/admin/stock");
  revalidatePath("/");
}
