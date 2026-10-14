import { NextResponse } from "next/server";
import { CheckoutError } from "@/lib/checkout";
import { createBoxOrderFromSelection } from "@/lib/boxCheckout";
import type { Buyer, CheckoutItemInput } from "@/lib/checkout";
import type { BoxGift } from "@/lib/boxCheckout";

type BoxCheckoutBody = {
  boxSizeId: string;
  items: CheckoutItemInput[];
  buyer: Buyer;
  gift: BoxGift;
};

export async function POST(request: Request) {
  const body = (await request.json()) as BoxCheckoutBody;

  try {
    const order = await createBoxOrderFromSelection(
      body.boxSizeId,
      body.items,
      body.buyer,
      body.gift,
      "efectivo"
    );
    return NextResponse.json(order);
  } catch (err) {
    const message = err instanceof CheckoutError ? err.message : "No se pudo crear el pedido.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
