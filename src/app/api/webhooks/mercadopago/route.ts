import { eq } from "drizzle-orm";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { orders } from "@/lib/db/schema";
import { cancelOrderAndRestoreStock } from "@/lib/checkout";
import { getMpOrder } from "@/lib/mercadoPagoQr";
import { notifyAdminsOfNewOrder, notifyRidersOfNewOrder } from "@/lib/push";

// Marca un pedido como pagado (si todavía estaba pendiente) y avisa a
// repartidores y al panel admin. Usado tanto por Checkout Pro (pagos
// "online") como por el QR dinámico (pagos "presenciales" vía Orders API)
// — distintos topics de webhook, mismo destino final.
async function markOrderPaid(orderId: string, mpPaymentId?: string): Promise<void> {
  const existing = (await db.select().from(orders).where(eq(orders.id, orderId)).limit(1))[0];
  if (!existing || existing.status !== "pendiente_pago") return;

  await db
    .update(orders)
    .set({ status: "pagado", ...(mpPaymentId ? { mpPaymentId } : {}) })
    .where(eq(orders.id, orderId));
  await notifyRidersOfNewOrder();
  await notifyAdminsOfNewOrder();
}

async function cancelIfPending(orderId: string): Promise<void> {
  const existing = (await db.select().from(orders).where(eq(orders.id, orderId)).limit(1))[0];
  if (!existing || existing.status !== "pendiente_pago") return;
  await cancelOrderAndRestoreStock(orderId);
}

// Mercado Pago notifica pagos acá. Puede mandar el id del recurso por
// query string (?data.id=...&type=payment) o en el body, según la
// integración. Hay dos topics distintos que nos interesan:
// - "payment": Checkout Pro (redirección web). Resuelto con el SDK.
// - "order"/"orders": QR dinámico (Orders API). Resuelto a mano (el SDK
//   todavía no tipa bien este flujo) con el external_reference como
//   nuestro id de pedido.
export async function POST(request: Request) {
  const accessToken = process.env.MP_ACCESS_TOKEN;
  if (!accessToken) return NextResponse.json({ ok: true });

  const url = new URL(request.url);
  let resourceId = url.searchParams.get("data.id") ?? url.searchParams.get("id");
  let topic = url.searchParams.get("type") ?? url.searchParams.get("topic");

  if (!resourceId) {
    try {
      const body = await request.json();
      resourceId = body?.data?.id ?? body?.id ?? null;
      topic = body?.type ?? body?.action ?? body?.topic ?? topic;
    } catch {
      // sin body JSON válido
    }
  }

  if (!resourceId || !topic) return NextResponse.json({ ok: true });

  try {
    if (topic.includes("payment")) {
      const client = new MercadoPagoConfig({ accessToken });
      const payment = await new Payment(client).get({ id: resourceId });
      const orderId = payment.external_reference;
      if (!orderId) return NextResponse.json({ ok: true });

      if (payment.status === "approved") {
        await markOrderPaid(orderId, String(payment.id));
      } else if (payment.status === "rejected" || payment.status === "cancelled") {
        await cancelIfPending(orderId);
      }
    } else if (topic.includes("order") && !topic.includes("merchant_order")) {
      // "order" / "orders": topic del QR dinámico (Orders API). El
      // "merchant_order" legacy no se usa en esta integración.
      const mpOrder = await getMpOrder(resourceId);
      const orderId = mpOrder.external_reference;
      if (!orderId) return NextResponse.json({ ok: true });

      if (mpOrder.status === "processed") {
        await markOrderPaid(orderId);
      } else if (
        mpOrder.status === "canceled" ||
        mpOrder.status === "cancelled" ||
        mpOrder.status === "expired" ||
        mpOrder.status === "refunded"
      ) {
        await cancelIfPending(orderId);
      }
    }

    return NextResponse.json({ ok: true });
  } catch {
    // Mercado Pago reintenta notificaciones fallidas; no hace falta romper acá.
    return NextResponse.json({ ok: true });
  }
}
