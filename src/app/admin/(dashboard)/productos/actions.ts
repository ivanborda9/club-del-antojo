"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  createProduct,
  deleteProduct,
  updateProduct,
  type ProductInput,
} from "@/lib/db/queries";

export type ProductFormState = { error: string | null };

function parseProductForm(formData: FormData): ProductInput | { error: string } {
  const name = String(formData.get("name") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const emoji = String(formData.get("emoji") ?? "🛒").trim() || "🛒";
  const costPrice = Number(formData.get("costPrice"));
  const salePrice = Number(formData.get("salePrice"));
  const stock = Number(formData.get("stock"));
  const lowStockThreshold = Number(formData.get("lowStockThreshold"));
  const active = formData.get("active") === "on";

  if (!name) return { error: "El nombre es obligatorio." };
  if (!category) return { error: "La categoría es obligatoria." };
  if (!Number.isFinite(salePrice) || salePrice <= 0) {
    return { error: "El precio de venta debe ser mayor a 0." };
  }
  if (!Number.isFinite(costPrice) || costPrice < 0) {
    return { error: "El precio de costo no puede ser negativo." };
  }
  if (!Number.isInteger(stock) || stock < 0) {
    return { error: "El stock debe ser un número entero, mayor o igual a 0." };
  }
  if (!Number.isInteger(lowStockThreshold) || lowStockThreshold < 0) {
    return { error: "El umbral de stock bajo debe ser un número entero." };
  }

  return { name, category, emoji, costPrice, salePrice, stock, lowStockThreshold, active };
}

export async function createProductAction(
  _prevState: ProductFormState,
  formData: FormData
): Promise<ProductFormState> {
  const parsed = parseProductForm(formData);
  if ("error" in parsed) return { error: parsed.error };

  await createProduct(parsed);
  revalidatePath("/admin/productos");
  revalidatePath("/");
  redirect("/admin/productos");
}

export async function updateProductAction(
  id: string,
  _prevState: ProductFormState,
  formData: FormData
): Promise<ProductFormState> {
  const parsed = parseProductForm(formData);
  if ("error" in parsed) return { error: parsed.error };

  await updateProduct(id, parsed);
  revalidatePath("/admin/productos");
  revalidatePath("/");
  redirect("/admin/productos");
}

export async function deleteProductAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await deleteProduct(id);
  revalidatePath("/admin/productos");
  revalidatePath("/");
}
