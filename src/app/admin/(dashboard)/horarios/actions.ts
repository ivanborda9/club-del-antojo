"use server";

import { revalidatePath } from "next/cache";
import {
  addBusinessHour,
  deleteBusinessHour,
  setStoreOverride,
  type StoreOverride,
} from "@/lib/db/queries";

export async function setStoreOverrideAction(formData: FormData): Promise<void> {
  const value = String(formData.get("override") ?? "");
  if (value !== "" && value !== "open" && value !== "closed") return;
  await setStoreOverride(value as StoreOverride);
  revalidatePath("/admin");
  revalidatePath("/admin/horarios");
  revalidatePath("/");
  revalidatePath("/checkout");
  revalidatePath("/armar-box");
}

export async function addBusinessHourAction(formData: FormData): Promise<void> {
  const days = formData.getAll("day").map(String);
  const startTime = String(formData.get("startTime") ?? "");
  const endTime = String(formData.get("endTime") ?? "");
  if (days.length === 0 || !startTime || !endTime) return;

  await addBusinessHour(days.join(","), startTime, endTime);
  revalidatePath("/admin");
  revalidatePath("/admin/horarios");
  revalidatePath("/");
  revalidatePath("/checkout");
  revalidatePath("/armar-box");
}

export async function deleteBusinessHourAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await deleteBusinessHour(id);
  revalidatePath("/admin");
  revalidatePath("/admin/horarios");
  revalidatePath("/");
  revalidatePath("/checkout");
  revalidatePath("/armar-box");
}
