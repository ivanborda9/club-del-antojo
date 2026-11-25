"use server";

import { redirect } from "next/navigation";
import { checkAdminCredentials, createAdminSession } from "@/lib/adminAuth";

export type LoginState = { error: string | null };

export async function loginAction(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const password = String(formData.get("password") ?? "");

  const role = checkAdminCredentials(password);
  if (!role) {
    return { error: "Contraseña incorrecta." };
  }

  await createAdminSession(role);
  redirect(role === "owner" ? "/admin" : "/admin/pedidos");
}
