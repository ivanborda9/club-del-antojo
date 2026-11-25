import { NextResponse } from "next/server";
import { calculateShippingForAddress } from "@/lib/shippingCalculator";

type ShippingQuoteBody = { address: string };

// Cotización de envío para mostrar en la vidriera del checkout mientras el
// cliente escribe su dirección. Puramente informativo: el costo real
// siempre se recalcula de nuevo al crear el pedido.
export async function POST(request: Request) {
  const body = (await request.json()) as ShippingQuoteBody;
  const address = String(body.address ?? "").trim();
  if (!address) {
    return NextResponse.json({ cost: 0, distanceKm: null });
  }

  const quote = await calculateShippingForAddress(address);
  return NextResponse.json(quote);
}
