export const ORDER_STATUSES = [
  "pendiente_pago",
  "pagado",
  "entregado",
  "cancelado",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pendiente_pago: "Pendiente de pago",
  pagado: "Pagado",
  entregado: "Entregado",
  cancelado: "Cancelado",
};

export const ORDER_STATUS_STYLES: Record<OrderStatus, string> = {
  pendiente_pago: "bg-amber-50 text-amber-700",
  pagado: "bg-emerald-50 text-emerald-700",
  entregado: "bg-blue-50 text-blue-700",
  cancelado: "bg-zinc-100 text-zinc-500",
};

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  mercadopago: "Mercado Pago",
  transferencia: "Transferencia",
};
