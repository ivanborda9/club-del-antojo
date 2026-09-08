"use server";

import { revalidatePath } from "next/cache";
import { createBanner, deleteBanner, updateBanner } from "@/lib/db/queries";

export async function createBannerAction(formData: FormData): Promise<void> {
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;

  await createBanner({
    title,
    subtitle: String(formData.get("subtitle") ?? "").trim() || null,
    emoji: String(formData.get("emoji") ?? "🎉").trim() || "🎉",
    active: true,
    sortOrder: Number(formData.get("sortOrder")) || 0,
  });

  revalidatePath("/admin/banners");
  revalidatePath("/");
}

export async function toggleBannerAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "");
  const subtitle = formData.get("subtitle");
  const emoji = String(formData.get("emoji") ?? "🎉");
  const sortOrder = Number(formData.get("sortOrder")) || 0;
  const active = formData.get("active") === "true";
  if (!id) return;

  await updateBanner(id, {
    title,
    subtitle: subtitle ? String(subtitle) : null,
    emoji,
    active,
    sortOrder,
  });

  revalidatePath("/admin/banners");
  revalidatePath("/");
}

export async function deleteBannerAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await deleteBanner(id);
  revalidatePath("/admin/banners");
  revalidatePath("/");
}
