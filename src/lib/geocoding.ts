// Geocodificación por dirección vía Nominatim (OpenStreetMap) — gratis, sin
// API key. Uso moderado (un pedido a la vez, no en lote), con User-Agent
// identificando la app como pide su política de uso.
const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const USER_AGENT = "ClubDelAntojo/1.0 (contacto@clubdelantojo.com)";

export type LatLng = { lat: number; lng: number };

export async function geocodeAddress(address: string): Promise<LatLng | null> {
  const url = `${NOMINATIM_URL}?format=json&limit=1&q=${encodeURIComponent(address)}`;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { lat: string; lon: string }[];
    const first = data[0];
    if (!first) return null;
    const lat = Number(first.lat);
    const lng = Number(first.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return { lat, lng };
  } catch {
    // Dirección no encontrada, Nominatim caído, o timeout: el llamador
    // decide el fallback (no bloqueamos el pedido por esto).
    return null;
  }
}

type NominatimAddress = {
  house_number?: string;
  road?: string;
  city?: string;
  town?: string;
  village?: string;
  suburb?: string;
  state?: string;
};

export type ReverseGeocodeResult = {
  streetName: string;
  streetNumber: string;
  cityName: string;
  stateName: string;
};

// Geocodificación inversa (lat/lng → dirección en partes): usada para
// armar el objeto "location" que pide Mercado Pago al crear la tienda de
// cobro con QR, a partir de la ubicación del local ya cargada en
// /admin/envios (nunca le pedimos la dirección "en partes" al dueño/a,
// alcanza con lo que ya tiene configurado para el cálculo de envíos).
export async function reverseGeocode(lat: number, lng: number): Promise<ReverseGeocodeResult | null> {
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&addressdetails=1&lat=${lat}&lon=${lng}`;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { address?: NominatimAddress };
    const a = data.address;
    if (!a) return null;
    return {
      streetName: a.road ?? "S/N",
      streetNumber: a.house_number ?? "S/N",
      cityName: a.city ?? a.town ?? a.village ?? a.suburb ?? "",
      stateName: a.state ?? "",
    };
  } catch {
    return null;
  }
}

// Distancia en línea recta (no por calles) — suficiente para definir
// franjas de precio de envío sin depender de un servicio de mapas pago.
export function haversineDistanceKm(a: LatLng, b: LatLng): number {
  const R = 6371;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(h));
}
