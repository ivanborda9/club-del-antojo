"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { claimOrderForRider, markOrderDeliveredByRider } from "@/lib/db/queries";
import { getRiderSession } from "@/lib/riderAuth";

// Intenta tomar el pedido. Si otro repartidor se lo llevó un instante antes,
// avisa en vez de fallar en silencio.
export async function claimOrderAction(formData: FormData): Promise<void> {
  const riderId = await getRiderSession();
  if (!riderId) redirect("/rider/login");

  const orderId = String(formData.get("orderId") ?? "");
  if (!orderId) return;

  const claimed = await claimOrderForRider(orderId, riderId);
  revalidatePath("/rider");
  redirect(claimed ? "/rider" : "/rider?error=tomado");
}

export async function markDeliveredAction(formData: FormData): Promise<void> {
  const riderId = await getRiderSession();
  if (!riderId) redirect("/rider/login");

  const orderId = String(formData.get("orderId") ?? "");
  if (!orderId) return;

  await markOrderDeliveredByRider(orderId, riderId);
  revalidatePath("/rider");
}
