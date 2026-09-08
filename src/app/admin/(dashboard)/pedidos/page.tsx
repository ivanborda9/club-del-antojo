import Link from "next/link";
import { listOrders } from "@/lib/db/queries";
import { formatPrice } from "@/config/site";
import {
  ORDER_STATUSES,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_STYLES,
  PAYMENT_METHOD_LABELS,
} from "@/lib/orderStatus";
import { formatArgentinaDateTime } from "@/lib/timezone";

export default async function AdminOrdersPage(
  props: PageProps<"/admin/pedidos">
) {
  const searchParams = await props.searchParams;
  const statusFilter =
    typeof searchParams.status === "string" ? searchParams.status : undefined;

  const orderList = await listOrders(statusFilter);

  return (
    <div>
      <h1 className="text-lg font-bold text-zinc-800">Pedidos</h1>

      <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
        <FilterTab href="/admin/pedidos" label="Todos" active={!statusFilter} />
        {ORDER_STATUSES.map((status) => (
          <FilterTab
            key={status}
            href={`/admin/pedidos?status=${status}`}
            label={ORDER_STATUS_LABELS[status]}
            active={statusFilter === status}
          />
        ))}
      </div>

      <div className="mt-4 space-y-2">
        {orderList.length === 0 && (
          <p className="text-sm text-zinc-500">No hay pedidos en este estado.</p>
        )}
        {orderList.map((order) => (
          <Link
            key={order.id}
            href={`/admin/pedidos/${order.id}`}
            className="flex items-center justify-between rounded-2xl border border-zinc-200 bg-white p-3"
          >
            <div>
              <p className="text-sm font-semibold text-zinc-800">
                {order.customerName}
              </p>
              <p className="text-xs text-zinc-500">
                {PAYMENT_METHOD_LABELS[order.paymentMethod]} ·{" "}
                {formatArgentinaDateTime(order.createdAt)}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-zinc-800">
                {formatPrice(order.total)}
              </span>
              <span
                className={`rounded-full px-2 py-1 text-xs font-medium ${ORDER_STATUS_STYLES[order.status]}`}
              >
                {ORDER_STATUS_LABELS[order.status]}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function FilterTab({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-medium ${
        active ? "bg-orange-600 text-white" : "border border-zinc-200 text-zinc-600"
      }`}
    >
      {label}
    </Link>
  );
}
