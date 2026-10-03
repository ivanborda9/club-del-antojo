"use server";

import { revalidatePath } from "next/cache";
import { createRider, deleteRider, getRiderByUsername, updateRider } from "@/lib/db/queries";
import { hashPassword } from "@/lib/riderAuth";

export type RiderFormState = { error: string | null };

export async function createRiderAction(
  _prevState: RiderFormState,
  formData: FormData
): Promise<RiderFormState> {
  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!name) return { error: "El nombre es obligatorio." };
  if (!phone) return { error: "El teléfono es obligatorio." };
  if (!/^[a-z0-9._-]{3,}$/.test(username)) {
    return { error: "Usuario inválido (mínimo 3 caracteres, sin espacios)." };
  }
  if (password.length < 6) {
    return { error: "La contraseña debe tener al menos 6 caracteres." };
  }
  if (await getRiderByUsername(username)) {
    return { error: "Ese nombre de usuario ya está en uso." };
  }

  await createRider({
    name,
    phone,
    username,
    active: true,
    passwordHash: hashPassword(password),
  });

  revalidatePath("/admin/riders");
  return { error: null };
}

export async function toggleRiderActiveAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "");
  const phone = String(formData.get("phone") ?? "");
  const username = String(formData.get("username") ?? "");
  const active = formData.get("active") === "true";
  if (!id) return;

  await updateRider(id, { name, phone, username, active });
  revalidatePath("/admin/riders");
}

export async function deleteRiderAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await deleteRider(id);
  revalidatePath("/admin/riders");
}
