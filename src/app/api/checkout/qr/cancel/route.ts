import { NextResponse } from "next/server";
import { cancelOrderAndRestoreStock } from "@/lib/checkout";
import { getOrderWithItems } from "@/lib/db/queries";
import { cancelMpOrder } from "@/lib/mercadoPagoQr";

type CancelBody = { orderId: string };

// El cliente puede cancelar mientras espera (ej. se arrepiente o quiere
// pagar de otra forma) antes de escanear el QR. Solo cancela pedidos
// todavía pendientes — uno ya pagado no se toca acá.
export async function POST(request: Request) {
  const { orderId } = (await request.json()) as CancelBody;
  if (!orderId) {
    return NextResponse.json({ error: "Falta el pedido." }, { status: 400 });
  }

  const existing = await getOrderWithItems(orderId);
  if (!existing || existing.order.status !== "pendiente_pago") {
    return NextResponse.json({ ok: true });
  }

  if (existing.order.mpOrderId) {
    await cancelMpOrder(existing.order.mpOrderId);
  }
  await cancelOrderAndRestoreStock(orderId);

  return NextResponse.json({ ok: true });
}
