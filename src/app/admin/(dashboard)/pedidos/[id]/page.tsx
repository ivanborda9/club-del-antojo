import { notFound } from "next/navigation";
import { getOrderWithItems } from "@/lib/db/queries";
import { formatPrice } from "@/config/site";
import {
  ORDER_STATUSES,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_STYLES,
  PAYMENT_METHOD_LABELS,
} from "@/lib/orderStatus";
import { formatArgentinaDateTime } from "@/lib/timezone";
import { changeOrderStatusAction } from "../actions";

export default async function OrderDetailPage(
  props: PageProps<"/admin/pedidos/[id]">
) {
  const { id } = await props.params;
  const data = await getOrderWithItems(id);
  if (!data) notFound();

  const { order, items } = data;

  return (
    <div className="max-w-lg">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-zinc-800">Pedido</h1>
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${ORDER_STATUS_STYLES[order.status]}`}
        >
          {ORDER_STATUS_LABELS[order.status]}
        </span>
      </div>

      <div className="mt-4 rounded-2xl border border-zinc-200 bg-white p-4">
        <p className="text-sm font-semibold text-zinc-800">{order.customerName}</p>
        <p className="text-sm text-zinc-500">{order.phone}</p>
        <p className="text-sm text-zinc-500">{order.address}</p>
        {order.notes && (
          <p className="mt-1 text-sm text-zinc-500">Notas: {order.notes}</p>
        )}
        <p className="mt-2 text-xs text-zinc-400">
          {PAYMENT_METHOD_LABELS[order.paymentMethod]} ·{" "}
          {formatArgentinaDateTime(order.createdAt)}
        </p>
      </div>

      <div className="mt-4 rounded-2xl border border-zinc-200 bg-white p-4">
        <p className="text-sm font-semibold text-zinc-800">Productos</p>
        <ul className="mt-2 space-y-1 text-sm text-zinc-600">
          {items.map((item) => (
            <li key={item.id} className="flex justify-between">
              <span>
                {item.quantity}x {item.productName}
              </span>
              <span>{formatPrice(item.unitPrice * item.quantity)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-2 flex justify-between border-t border-zinc-100 pt-2 text-sm font-bold text-zinc-800">
          <span>Total</span>
          <span>{formatPrice(order.total)}</span>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-zinc-200 bg-white p-4">
        <p className="mb-2 text-sm font-semibold text-zinc-800">Cambiar estado</p>
        <div className="flex flex-wrap gap-2">
          {ORDER_STATUSES.map((status) => (
            <form key={status} action={changeOrderStatusAction}>
              <input type="hidden" name="id" value={order.id} />
              <input type="hidden" name="status" value={status} />
              <button
                type="submit"
                disabled={order.status === status}
                className={`rounded-full px-3 py-1.5 text-xs font-medium disabled:opacity-40 ${ORDER_STATUS_STYLES[status]}`}
              >
                {ORDER_STATUS_LABELS[status]}
              </button>
            </form>
          ))}
        </div>
        <p className="mt-2 text-xs text-zinc-400">
          Cancelar un pedido devuelve automáticamente el stock reservado.
        </p>
      </div>
    </div>
  );
}
