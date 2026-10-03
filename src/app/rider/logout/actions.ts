"use server";

import { redirect } from "next/navigation";
import { destroyRiderSession } from "@/lib/riderAuth";

export async function riderLogoutAction() {
  await destroyRiderSession();
  redirect("/rider/login");
}
