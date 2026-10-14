// Constantes de precios compartidas entre server (checkout.ts, boxCheckout.ts)
// y client (páginas de checkout) — sin dependencias de servidor, para que se
// puedan importar también desde componentes "use client".

// Incentivo por pagar en efectivo (menos costo de procesamiento que
// Mercado Pago/transferencia).
export const CASH_DISCOUNT_RATE = 0.05;
