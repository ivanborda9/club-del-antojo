"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createProduct, updateProductStock, updateProductVariantStock } from "@/lib/db/queries";

// Alta simplificada (sin precio de costo ni margen) para el rol "staff":
// puede cargar productos nuevos, pero no ve ni fija ganancias — el costo
// queda en 0 hasta que el dueño/a lo complete desde Productos.
export async function createSimpleProductAction(formData: FormData): Promise<void> {
  const name = String(formData.get("name") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const parentCategory = String(formData.get("parentCategory") ?? "").trim() || null;
  const emoji = String(formData.get("emoji") ?? "🛒").trim() || "🛒";
  const imageUrl = String(formData.get("imageUrl") ?? "").trim() || null;
  const salePrice = Number(formData.get("salePrice"));
  const stock = Number(formData.get("stock"));

  if (!name || !category) return;
  if (!Number.isFinite(salePrice) || salePrice <= 0) return;
  if (!Number.isInteger(stock) || stock < 0) return;

  await createProduct({
    name,
    category,
    parentCategory,
    emoji,
    imageUrl,
    description: null,
    costPrice: 0,
    salePrice,
    stock,
    lowStockThreshold: 5,
    active: true,
    includeInBox: false,
    comingSoon: false,
    scheduleStart: null,
    scheduleEnd: null,
  });

  revalidatePath("/admin/stock");
  revalidatePath("/");
  redirect("/admin/stock");
}

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
