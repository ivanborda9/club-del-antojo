import { eq } from "drizzle-orm";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { orders } from "@/lib/db/schema";
import { cancelOrderAndRestoreStock } from "@/lib/checkout";

// Mercado Pago notifica pagos acá. Puede mandar el id del pago por query
// string (?data.id=...&type=payment) o en el body, según la integración.
export async function POST(request: Request) {
  const accessToken = process.env.MP_ACCESS_TOKEN;
  if (!accessToken) return NextResponse.json({ ok: true });

  const url = new URL(request.url);
  let paymentId = url.searchParams.get("data.id") ?? url.searchParams.get("id");
  let topic = url.searchParams.get("type") ?? url.searchParams.get("topic");

  if (!paymentId) {
    try {
      const body = await request.json();
      paymentId = body?.data?.id ?? null;
      topic = body?.type ?? body?.action ?? topic;
    } catch {
      // sin body JSON válido
    }
  }

  if (topic && !topic.includes("payment")) {
    return NextResponse.json({ ok: true });
  }
  if (!paymentId) return NextResponse.json({ ok: true });

  try {
    const client = new MercadoPagoConfig({ accessToken });
    const payment = await new Payment(client).get({ id: paymentId });

    const orderId = payment.external_reference;
    if (!orderId) return NextResponse.json({ ok: true });

    const existing = (
      await db.select().from(orders).where(eq(orders.id, orderId)).limit(1)
    )[0];
    if (!existing || existing.status !== "pendiente_pago") {
      return NextResponse.json({ ok: true });
    }

    if (payment.status === "approved") {
      await db
        .update(orders)
        .set({ status: "pagado", mpPaymentId: String(payment.id) })
        .where(eq(orders.id, orderId));
    } else if (payment.status === "rejected" || payment.status === "cancelled") {
      await cancelOrderAndRestoreStock(orderId);
    }

    return NextResponse.json({ ok: true });
  } catch {
    // Mercado Pago reintenta notificaciones fallidas; no hace falta romper acá.
    return NextResponse.json({ ok: true });
  }
}
