import { randomUUID } from "crypto";
import { siteConfig } from "@/config/site";
import { getMpQrPosConfig, getStoreOrigin, setMpQrPosConfig } from "@/lib/db/queries";
import { reverseGeocode } from "@/lib/geocoding";

// Integración de "Código QR interoperable" de Mercado Pago (Orders API),
// para que el cliente pague escaneando con CUALQUIER billetera (Mercado
// Pago, Cuenta DNI, Ualá, etc.), no solo redirigiendo a Checkout Pro.
//
// El SDK oficial de Node (`mercadopago`) todavía no tipa el bloque
// `config.qr` de la Orders API (es una incorporación reciente de MP), así
// que acá se habla directo con la API REST.
//
// Requisito del lado de Mercado Pago: la cuenta tiene que estar habilitada
// para "Cobros con código QR" (cuenta de vendedor/negocio). Si no lo está,
// la creación de la tienda/caja o de la orden va a fallar con un error de
// Mercado Pago, que se propaga tal cual para poder diagnosticarlo.

const MP_API_BASE = "https://api.mercadopago.com";
// Mercado Pago exige que external_id sea alfanumérico (nada de guiones).
const STORE_EXTERNAL_ID = "clubdelantojotienda1";
const POS_EXTERNAL_ID = "clubdelantojocajaweb1";

function getAccessToken(): string {
  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) throw new Error("Falta MP_ACCESS_TOKEN en las variables de entorno.");
  return token;
}

async function mpRequest<T>(
  path: string,
  options: { method: "GET" | "POST"; body?: unknown; idempotencyKey?: string }
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${MP_API_BASE}${path}`, {
      method: options.method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getAccessToken()}`,
        ...(options.idempotencyKey ? { "X-Idempotency-Key": options.idempotencyKey } : {}),
      },
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    throw new Error("No se pudo conectar con Mercado Pago. Probá de nuevo en un momento.");
  }

  const rawText = await res.text();
  let data: unknown = null;
  if (rawText) {
    try {
      data = JSON.parse(rawText);
    } catch {
      data = rawText;
    }
  }

  if (!res.ok) {
    const message =
      (typeof data === "object" && data && "message" in data && typeof data.message === "string"
        ? data.message
        : null) ?? `Mercado Pago devolvió un error (${res.status}) en ${path}.`;
    throw new Error(message);
  }

  return data as T;
}

type MpStore = { id: string | number };
type MpUser = { id: string | number };

// Crea (la primera vez) o reutiliza la tienda y la caja de cobro con QR en
// Mercado Pago. Guardado en site_settings para no volver a crearla en
// cada pedido — Mercado Pago no deja crear dos con el mismo external_id,
// así que esto es seguro de reintentar si algo falla a mitad de camino.
export async function ensureQrStoreAndPos(): Promise<{ posExternalId: string }> {
  const existing = await getMpQrPosConfig();
  if (existing) return { posExternalId: existing.posExternalId };

  // Mercado Pago exige la ubicación de la tienda (dirección + coordenadas)
  // para crearla — reutilizamos la del local ya cargada en /admin/envios
  // (para el cálculo de envíos), así no hay que pedirla dos veces.
  const origin = await getStoreOrigin();
  if (origin.lat === null || origin.lng === null) {
    throw new Error(
      "Para usar el pago con QR primero configurá la dirección del local en /admin/envios."
    );
  }
  const reverse = await reverseGeocode(origin.lat, origin.lng);

  const me = await mpRequest<MpUser>("/users/me", { method: "GET" });
  const userId = String(me.id);

  const store = await mpRequest<MpStore>(`/users/${userId}/stores`, {
    method: "POST",
    idempotencyKey: STORE_EXTERNAL_ID,
    body: {
      name: siteConfig.name,
      external_id: STORE_EXTERNAL_ID,
      location: {
        street_name: reverse?.streetName || "S/N",
        street_number: reverse?.streetNumber || "S/N",
        city_name: reverse?.cityName || siteConfig.city,
        state_name: reverse?.stateName || siteConfig.city,
        latitude: origin.lat,
        longitude: origin.lng,
        reference: origin.address ?? siteConfig.name,
      },
    },
  });
  const storeId = String(store.id);

  await mpRequest(`/pos`, {
    method: "POST",
    idempotencyKey: POS_EXTERNAL_ID,
    body: {
      name: "Caja web",
      store_id: storeId,
      external_id: POS_EXTERNAL_ID,
    },
  });

  await setMpQrPosConfig(storeId, POS_EXTERNAL_ID);
  return { posExternalId: POS_EXTERNAL_ID };
}

type MpOrderResponse = {
  id?: string;
  status?: string;
  external_reference?: string;
  type_response?: { qr_data?: string };
};

// Crea una orden de pago con QR dinámico (un QR único, por el monto exacto
// de este pedido). `orderId` se manda como external_reference (para
// reconciliar en el webhook) y como idempotency key (un reintento con el
// mismo pedido no genera una orden duplicada en Mercado Pago).
export async function createDynamicQrOrder(
  orderId: string,
  amount: number
): Promise<{ mpOrderId: string; qrData: string }> {
  const { posExternalId } = await ensureQrStoreAndPos();
  const amountStr = amount.toFixed(2);

  const order = await mpRequest<MpOrderResponse>("/v1/orders", {
    method: "POST",
    idempotencyKey: orderId,
    body: {
      type: "qr",
      external_reference: orderId,
      total_amount: amountStr,
      transactions: { payments: [{ amount: amountStr }] },
      config: { qr: { external_pos_id: posExternalId, mode: "dynamic" } },
    },
  });

  const qrData = order.type_response?.qr_data;
  if (!order.id || !qrData) {
    throw new Error("Mercado Pago no devolvió los datos del QR.");
  }
  return { mpOrderId: order.id, qrData };
}

export async function getMpOrder(mpOrderId: string): Promise<MpOrderResponse> {
  return mpRequest<MpOrderResponse>(`/v1/orders/${mpOrderId}`, { method: "GET" });
}

// Cancela una orden de QR del lado de Mercado Pago (ej. si el cliente
// cancela y elige otro medio de pago antes de escanear). Si ya estaba
// pagada o vencida, Mercado Pago puede rechazar la cancelación — no hace
// falta tratarlo como error fatal acá, el pedido ya se cancela igual de
// nuestro lado.
export async function cancelMpOrder(mpOrderId: string): Promise<void> {
  try {
    await mpRequest(`/v1/orders/${mpOrderId}/cancel`, {
      method: "POST",
      idempotencyKey: randomUUID(),
    });
  } catch {
    // No es crítico: el pedido de nuestro lado ya se cancela de todas
    // formas (ver cancelOrderAndRestoreStock).
  }
}
