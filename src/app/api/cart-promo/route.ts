import { NextResponse } from "next/server";
import { getCartPromoEligibleProducts, getCartPromoSettings } from "@/lib/db/queries";

// Config de la promo "agregá algo con descuento" del checkout, solo para
// mostrar el cartel y la línea de descuento en la vidriera. El descuento
// real siempre se recalcula server-side al crear el pedido.
export async function GET() {
  const [settings, eligibleProducts] = await Promise.all([
    getCartPromoSettings(),
    getCartPromoEligibleProducts(),
  ]);

  return NextResponse.json({
    ...settings,
    eligibleProductIds: eligibleProducts.map((p) => p.id),
  });
}
