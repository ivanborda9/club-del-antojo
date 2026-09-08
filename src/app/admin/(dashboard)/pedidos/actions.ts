"use server";

import { revalidatePath } from "next/cache";
import { getOrderWithItems, restoreStockForOrder, updateOrderStatus } from "@/lib/db/queries";

const VALID_STATUSES = ["pendiente_pago", "pagado", "entregado", "cancelado"];

export async function changeOrderStatusAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id || !VALID_STATUSES.includes(status)) return;

  const current = await getOrderWithItems(id);
  if (!current) return;

  // Al cancelar (desde cualquier estado que no sea ya cancelado), devolvemos
  // el stock reservado para ese pedido.
  if (status === "cancelado" && current.order.status !== "cancelado") {
    await restoreStockForOrder(id);
  }

  await updateOrderStatus(id, status);
  revalidatePath("/admin/pedidos");
  revalidatePath(`/admin/pedidos/${id}`);
  revalidatePath("/admin");
}
