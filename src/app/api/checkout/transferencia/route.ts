import { NextResponse } from "next/server";
import { CheckoutError, createOrderFromCart } from "@/lib/checkout";
import type { Buyer, CheckoutItemInput } from "@/lib/checkout";

type CheckoutBody = { items: CheckoutItemInput[]; buyer: Buyer };

export async function POST(request: Request) {
  const body = (await request.json()) as CheckoutBody;

  try {
    const order = await createOrderFromCart(body.items, body.buyer, "transferencia");
    return NextResponse.json(order);
  } catch (err) {
    const message = err instanceof CheckoutError ? err.message : "No se pudo crear el pedido.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
