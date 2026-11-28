import { NextResponse } from "next/server";
import { getOrderStatusById } from "@/lib/db/queries";

// Consulta liviana (sin volver a pegarle a Mercado Pago) para que el
// checkout haga polling mientras espera que se confirme un pago con QR —
// el webhook es quien actualiza el estado acá adentro.
export async function GET(_request: Request, ctx: RouteContext<"/api/orders/[id]/status">) {
  const { id } = await ctx.params;
  const status = await getOrderStatusById(id);
  if (!status) {
    return NextResponse.json({ error: "Pedido no encontrado." }, { status: 404 });
  }
  return NextResponse.json({ status });
}
