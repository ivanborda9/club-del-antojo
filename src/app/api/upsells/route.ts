import { NextResponse } from "next/server";
import { getUpsellOffersForProductIds } from "@/lib/db/queries";

type UpsellsBody = { productIds: string[] };

// Ofertas aplicables para el carrito actual (solo para mostrar el cartel en
// el checkout). El precio final siempre se recalcula server-side al crear
// el pedido, así que esto es puramente informativo — no hay nada que un
// cliente pueda falsear acá que afecte lo que termina pagando.
export async function POST(request: Request) {
  const body = (await request.json()) as UpsellsBody;
  const productIds = Array.isArray(body.productIds)
    ? body.productIds.filter((id): id is string => typeof id === "string")
    : [];

  const offers = await getUpsellOffersForProductIds(productIds);
  return NextResponse.json({ offers });
}
