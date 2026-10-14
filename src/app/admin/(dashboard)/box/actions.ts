"use server";

import { revalidatePath } from "next/cache";
import { createBoxSize, deleteBoxSize, updateBoxSize } from "@/lib/db/queries";
import type { BoxSizeInput } from "@/lib/db/queries";

export async function createBoxSizeAction(formData: FormData): Promise<void> {
  const name = String(formData.get("name") ?? "").trim();
  const price = Number(formData.get("price"));
  if (!name) return;
  if (!Number.isFinite(price) || price <= 0) return;

  await createBoxSize({
    name,
    price,
    sortOrder: Number(formData.get("sortOrder")) || 0,
    active: true,
  });

  revalidatePath("/admin/box");
  revalidatePath("/");
}

export async function toggleBoxSizeAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "");
  const price = Number(formData.get("price"));
  const sortOrder = Number(formData.get("sortOrder")) || 0;
  const active = formData.get("active") === "true";
  if (!id) return;

  const input: BoxSizeInput = { name, price, sortOrder, active };
  await updateBoxSize(id, input);

  revalidatePath("/admin/box");
  revalidatePath("/");
}

export async function deleteBoxSizeAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await deleteBoxSize(id);
  revalidatePath("/admin/box");
  revalidatePath("/");
}
