import { NextResponse } from "next/server";
import { getAllBusinessHours, isStoreOpenNow } from "@/lib/db/queries";

// Estado de apertura de la tienda, para el indicador "Abierto/Cerrado" y
// el cartel con los horarios. Puramente informativo del lado del cliente
// — el checkout siempre vuelve a chequear esto en el servidor antes de
// crear el pedido.
export async function GET() {
  const [open, hours] = await Promise.all([isStoreOpenNow(), getAllBusinessHours()]);
  return NextResponse.json({
    open,
    hours: hours.map((h) => ({
      daysOfWeek: h.daysOfWeek,
      startTime: h.startTime,
      endTime: h.endTime,
    })),
  });
}
