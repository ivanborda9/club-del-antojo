"use server";

import { revalidatePath } from "next/cache";
import {
  createMarqueeMessage,
  deleteMarqueeMessage,
  updateMarqueeMessage,
} from "@/lib/db/queries";

function parseSchedule(
  formData: FormData
): { scheduleStart: string | null; scheduleEnd: string | null } | { error: string } {
  const scheduleEnabled = formData.get("scheduleEnabled") === "on";
  if (!scheduleEnabled) return { scheduleStart: null, scheduleEnd: null };

  const scheduleStart = String(formData.get("scheduleStart") ?? "").trim();
  const scheduleEnd = String(formData.get("scheduleEnd") ?? "").trim();
  if (!scheduleStart || !scheduleEnd) {
    return { error: "Completá los dos horarios (desde y hasta)." };
  }
  return { scheduleStart, scheduleEnd };
}

export async function createMarqueeMessageAction(formData: FormData): Promise<void> {
  const text = String(formData.get("text") ?? "").trim();
  if (!text) return;

  const schedule = parseSchedule(formData);
  if ("error" in schedule) return;

  await createMarqueeMessage({
    text,
    active: true,
    sortOrder: Number(formData.get("sortOrder")) || 0,
    ...schedule,
  });

  revalidatePath("/admin/carrusel");
  revalidatePath("/");
}

export async function toggleMarqueeMessageAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  const text = String(formData.get("text") ?? "");
  const sortOrder = Number(formData.get("sortOrder")) || 0;
  const active = formData.get("active") === "true";
  const scheduleStart = formData.get("scheduleStart");
  const scheduleEnd = formData.get("scheduleEnd");
  if (!id) return;

  await updateMarqueeMessage(id, {
    text,
    active,
    sortOrder,
    scheduleStart: scheduleStart ? String(scheduleStart) : null,
    scheduleEnd: scheduleEnd ? String(scheduleEnd) : null,
  });

  revalidatePath("/admin/carrusel");
  revalidatePath("/");
}

export async function deleteMarqueeMessageAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await deleteMarqueeMessage(id);
  revalidatePath("/admin/carrusel");
  revalidatePath("/");
}
