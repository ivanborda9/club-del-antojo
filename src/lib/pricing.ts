// Constantes de precios compartidas entre server (checkout.ts, boxCheckout.ts)
// y client (páginas de checkout) — sin dependencias de servidor, para que se
// puedan importar también desde componentes "use client".

import { formatPrice } from "@/config/site";

// Incentivo por pagar en efectivo (menos costo de procesamiento que
// Mercado Pago/transferencia).
export const CASH_DISCOUNT_RATE = 0.05;

// Tamaños de box con precio $0 se muestran como "GRATIS" en vez de "$0".
export function isFreeBoxPrice(price: number): boolean {
  return price <= 0;
}

export function formatBoxPrice(price: number): string {
  return isFreeBoxPrice(price) ? "GRATIS" : formatPrice(price);
}
