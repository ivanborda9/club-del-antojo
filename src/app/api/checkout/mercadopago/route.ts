import { eq } from "drizzle-orm";
import { MercadoPagoConfig, Preference } from "mercadopago";
import { NextResponse } from "next/server";
import { siteConfig } from "@/config/site";
import { db } from "@/lib/db/client";
import { orders } from "@/lib/db/schema";
import { CheckoutError, createOrderFromCart, cancelOrderAndRestoreStock } from "@/lib/checkout";
import type { Buyer, CheckoutItemInput } from "@/lib/checkout";

type CheckoutBody = { items: CheckoutItemInput[]; buyer: Buyer };

export async function POST(request: Request) {
  const accessToken = process.env.MP_ACCESS_TOKEN;
  if (!accessToken) {
    return NextResponse.json(
      { error: "Mercado Pago no está configurado. Falta MP_ACCESS_TOKEN." },
      { status: 500 }
    );
  }

  const body = (await request.json()) as CheckoutBody;

  let order;
  try {
    order = await createOrderFromCart(body.items, body.buyer, "mercadopago");
  } catch (err) {
    const message = err instanceof CheckoutError ? err.message : "No se pudo crear el pedido.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin;
  const client = new MercadoPagoConfig({ accessToken });
  const preference = new Preference(client);

  try {
    const result = await preference.create({
      body: {
        items: order.items.map((it) => ({
          id: it.productId,
          title: it.name,
          quantity: it.quantity,
          unit_price: it.unitPrice,
          currency_id: siteConfig.currency,
        })),
        payer: { name: body.buyer.name, phone: { number: body.buyer.phone } },
        external_reference: order.orderId,
        notification_url: `${siteUrl}/api/webhooks/mercadopago`,
        back_urls: {
          success: `${siteUrl}/checkout/success?order=${order.orderId}`,
          failure: `${siteUrl}/checkout/failure?order=${order.orderId}`,
          pending: `${siteUrl}/checkout/pending?order=${order.orderId}`,
        },
        auto_return: "approved",
        statement_descriptor: siteConfig.name,
      },
    });

    if (!result.init_point) throw new Error("Mercado Pago no devolvió init_point.");

    await db
      .update(orders)
      .set({ mpPreferenceId: result.id })
      .where(eq(orders.id, order.orderId));

    return NextResponse.json({ initPoint: result.init_point });
  } catch {
    // Si Mercado Pago falla, no dejamos el pedido "colgado" reservando stock.
    await cancelOrderAndRestoreStock(order.orderId);
    return NextResponse.json(
      { error: "No se pudo generar el pago con Mercado Pago." },
      { status: 502 }
    );
  }
}
