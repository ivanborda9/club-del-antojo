import { NextResponse } from "next/server";
import { CheckoutError, createOrderFromCart, cancelOrderAndRestoreStock } from "@/lib/checkout";
import type { Buyer, CheckoutItemInput } from "@/lib/checkout";
import { createDynamicQrOrder } from "@/lib/mercadoPagoQr";
import { setOrderMpOrderId } from "@/lib/db/queries";

type CheckoutBody = { items: CheckoutItemInput[]; buyer: Buyer };

export async function POST(request: Request) {
  if (!process.env.MP_ACCESS_TOKEN) {
    return NextResponse.json(
      { error: "Mercado Pago no está configurado. Falta MP_ACCESS_TOKEN." },
      { status: 500 }
    );
  }

  const body = (await request.json()) as CheckoutBody;

  let order;
  try {
    order = await createOrderFromCart(body.items, body.buyer, "qr");
  } catch (err) {
    const message = err instanceof CheckoutError ? err.message : "No se pudo crear el pedido.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    const { mpOrderId, qrData } = await createDynamicQrOrder(order.orderId, order.total);
    await setOrderMpOrderId(order.orderId, mpOrderId);
    return NextResponse.json({ orderId: order.orderId, qrData, total: order.total });
  } catch (err) {
    // Si Mercado Pago falla, no dejamos el pedido "colgado" reservando stock.
    await cancelOrderAndRestoreStock(order.orderId);
    const message = err instanceof Error ? err.message : "No se pudo generar el QR de pago.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
