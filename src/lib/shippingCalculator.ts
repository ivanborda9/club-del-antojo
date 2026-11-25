import {
  getAllShippingRates,
  getDefaultShippingPrice,
  getStoreOrigin,
} from "@/lib/db/queries";
import { geocodeAddress, haversineDistanceKm } from "@/lib/geocoding";
import { getCurrentLocalDayOfWeek, getCurrentLocalTime, isWithinSchedule } from "@/lib/schedule";

export type ShippingQuote = { cost: number; distanceKm: number | null };

// Costo de envío para una dirección: geocodifica, calcula distancia al
// local, y busca la regla (día + horario + distancia) que corresponda. Si
// algo falla (dirección no encontrada, local sin ubicación configurada,
// ninguna regla coincide), cae al envío por defecto en vez de bloquear el
// pedido — nunca se confía en nada que mande el cliente, esto se
// recalcula siempre acá.
export async function calculateShippingForAddress(address: string): Promise<ShippingQuote> {
  const defaultPrice = await getDefaultShippingPrice();

  const origin = await getStoreOrigin();
  if (origin.lat === null || origin.lng === null) {
    return { cost: defaultPrice, distanceKm: null };
  }

  const destination = await geocodeAddress(address);
  if (!destination) {
    return { cost: defaultPrice, distanceKm: null };
  }

  const distanceKm = haversineDistanceKm(
    { lat: origin.lat, lng: origin.lng },
    destination
  );

  const rates = await getAllShippingRates();
  const today = getCurrentLocalDayOfWeek();
  const now = getCurrentLocalTime();

  const match = rates.find((rate) => {
    if (!rate.active) return false;
    if (distanceKm > rate.maxDistanceKm) return false;
    const days = rate.daysOfWeek.split(",").map(Number);
    if (!days.includes(today)) return false;
    return isWithinSchedule(rate.startTime, rate.endTime, now);
  });

  return { cost: match ? match.price : defaultPrice, distanceKm };
}
