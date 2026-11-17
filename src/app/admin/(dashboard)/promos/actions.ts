"use server";

import { revalidatePath } from "next/cache";
import { setCartPromoEligibleProducts, setCartPromoSettings } from "@/lib/db/queries";

export async function setCartPromoSettingsAction(formData: FormData): Promise<void> {
  const triggerCategory = String(formData.get("triggerCategory") ?? "").trim();
  const excludeCategory = String(formData.get("excludeCategory") ?? "").trim();
  const discountPercent = Number(formData.get("discountPercent"));
  const active = formData.get("active") === "on";

  if (!Number.isFinite(discountPercent) || discountPercent < 0 || discountPercent > 100) return;

  await setCartPromoSettings({ triggerCategory, excludeCategory, discountPercent, active });
  revalidatePath("/admin/promos");
  revalidatePath("/checkout");
}

export async function setCartPromoEligibleProductsAction(formData: FormData): Promise<void> {
  const productIds = formData.getAll("productId").map((v) => String(v));
  await setCartPromoEligibleProducts(productIds);
  revalidatePath("/admin/promos");
  revalidatePath("/checkout");
}
