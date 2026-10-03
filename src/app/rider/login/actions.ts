"use server";

import { redirect } from "next/navigation";
import { getRiderByUsername } from "@/lib/db/queries";
import { createRiderSession, verifyPassword } from "@/lib/riderAuth";

export type RiderLoginState = { error: string | null };

export async function riderLoginAction(
  _prevState: RiderLoginState,
  formData: FormData
): Promise<RiderLoginState> {
  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  const rider = await getRiderByUsername(username);
  if (!rider || !rider.active || !verifyPassword(password, rider.passwordHash)) {
    return { error: "Usuario o contraseña incorrectos." };
  }

  await createRiderSession(rider.id);
  redirect("/rider");
}
