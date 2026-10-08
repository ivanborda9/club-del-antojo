"use server";

import { revalidatePath } from "next/cache";
import { createBanner, deleteBanner, updateBanner } from "@/lib/db/queries";
import type { BannerInput } from "@/lib/db/queries";

function parseLink(formData: FormData): Pick<BannerInput, "linkType" | "linkValue"> {
  const linkType = String(formData.get("linkType") ?? "");
  if (linkType === "product") {
    const linkValue = String(formData.get("linkProductId") ?? "").trim();
    return linkValue ? { linkType: "product", linkValue } : { linkType: null, linkValue: null };
  }
  if (linkType === "category") {
    const linkValue = String(formData.get("linkCategory") ?? "").trim();
    return linkValue ? { linkType: "category", linkValue } : { linkType: null, linkValue: null };
  }
  return { linkType: null, linkValue: null };
}

function parseSchedule(
  formData: FormData
): Pick<BannerInput, "scheduleStart" | "scheduleEnd"> | { error: string } {
  const scheduleEnabled = formData.get("scheduleEnabled") === "on";
  if (!scheduleEnabled) return { scheduleStart: null, scheduleEnd: null };

  const scheduleStart = String(formData.get("scheduleStart") ?? "").trim();
  const scheduleEnd = String(formData.get("scheduleEnd") ?? "").trim();
  if (!scheduleStart || !scheduleEnd) {
    return { error: "Completá los dos horarios del banner (desde y hasta)." };
  }
  return { scheduleStart, scheduleEnd };
}

export async function createBannerAction(formData: FormData): Promise<void> {
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;

  const schedule = parseSchedule(formData);
  if ("error" in schedule) return;

  await createBanner({
    title,
    subtitle: String(formData.get("subtitle") ?? "").trim() || null,
    emoji: String(formData.get("emoji") ?? "🎉").trim() || "🎉",
    active: true,
    sortOrder: Number(formData.get("sortOrder")) || 0,
    ...parseLink(formData),
    ...schedule,
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
  const linkType = formData.get("linkType");
  const linkValue = formData.get("linkValue");
  const scheduleStart = formData.get("scheduleStart");
  const scheduleEnd = formData.get("scheduleEnd");
  if (!id) return;

  await updateBanner(id, {
    title,
    subtitle: subtitle ? String(subtitle) : null,
    emoji,
    active,
    sortOrder,
    linkType: linkType === "product" || linkType === "category" ? linkType : null,
    linkValue: linkValue ? String(linkValue) : null,
    scheduleStart: scheduleStart ? String(scheduleStart) : null,
    scheduleEnd: scheduleEnd ? String(scheduleEnd) : null,
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
