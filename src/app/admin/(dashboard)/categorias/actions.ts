"use server";

import { revalidatePath } from "next/cache";
import { setCategorySortOrders } from "@/lib/db/queries";

export async function setCategorySortOrdersAction(formData: FormData): Promise<void> {
  const categories = formData.getAll("category").map((v) => String(v));
  const rawOrders = formData.getAll("order").map((v) => String(v).trim());

  const entries = categories
    .map((category, i) => {
      const raw = rawOrders[i] ?? "";
      const parsed = raw === "" ? null : Number(raw);
      return { category, sortOrder: parsed !== null && Number.isFinite(parsed) ? parsed : null };
    })
    .filter((e) => e.category);

  await setCategorySortOrders(entries);
  revalidatePath("/admin/categorias");
  revalidatePath("/");
}
