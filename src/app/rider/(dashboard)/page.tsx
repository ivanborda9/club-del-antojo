import { redirect } from "next/navigation";
import {
  getActiveDeliveriesForRider,
  getAvailableOrdersForRiders,
  getItemsForOrders,
} from "@/lib/db/queries";
import { getRiderSession } from "@/lib/riderAuth";
import { formatPrice } from "@/config/site";
import { formatArgentinaDateTime } from "@/lib/timezone";
import { PAYMENT_METHOD_LABELS } from "@/lib/orderStatus";
import { RiderAutoRefresh } from "@/components/rider/RiderAutoRefresh";
import { claimOrderAction, markDeliveredAction } from "./actions";
import type { OrderRow, OrderItemRow } from "@/lib/db/schema";

function mapsLink(address: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

export default async function RiderDashboardPage(props: PageProps<"/rider">) {
  const riderId = await getRiderSession();
  if (!riderId) redirect("/rider/login");

  const searchParams = await props.searchParams;
  const claimError = searchParams.error === "tomado";

  const [pool, mine] = await Promise.all([
    getAvailableOrdersForRiders(),
    getActiveDeliveriesForRider(riderId),
  ]);

  const itemsByOrder = new Map<string, OrderItemRow[]>();
  const mineItems = await getItemsForOrders(mine.map((o) => o.id));
  for (const item of mineItems) {
    const list = itemsByOrder.get(item.orderId) ?? [];
    list.push(item);
    itemsByOrder.set(item.orderId, list);
  }

  return (
    <div className="space-y-6 pb-6">
      <RiderAutoRefresh />

      {claimError && (
        <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
          Ese pedido ya lo tomó otro repartidor. Elegí otro de la lista.
        </p>
      )}

      <section>
        <h2 className="text-sm font-bold text-zinc-800">
          Mis entregas en curso ({mine.length})
        </h2>
        {mine.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-500">No tenés entregas en curso.</p>
        ) : (
          <div className="mt-2 space-y-3">
            {mine.map((order) => (
              <ActiveDeliveryCard
                key={order.id}
                order={order}
                items={itemsByOrder.get(order.id) ?? []}
              />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-sm font-bold text-zinc-800">
          Pedidos disponibles ({pool.length})
        </h2>
        {pool.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-500">
            No hay pedidos esperando reparto ahora. Esta pantalla se actualiza sola.
          </p>
        ) : (
          <div className="mt-2 space-y-3">
            {pool.map((order) => (
              <PoolOrderCard key={order.id} order={order} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function PoolOrderCard({ order }: { order: OrderRow }) {
  return (
    <div className="rounded-2xl border border-orange-100 bg-white p-3">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold text-zinc-800">{order.address}</p>
          <p className="mt-0.5 text-xs text-zinc-500">
            {PAYMENT_METHOD_LABELS[order.paymentMethod]} ·{" "}
            {formatArgentinaDateTime(order.createdAt)}
          </p>
        </div>
        <span className="shrink-0 text-sm font-bold text-orange-600">
          {formatPrice(order.total)}
        </span>
      </div>
      <form action={claimOrderAction} className="mt-3">
        <input type="hidden" name="orderId" value={order.id} />
        <button
          type="submit"
          className="flex h-10 w-full items-center justify-center rounded-full bg-orange-600 text-sm font-bold text-white active:scale-[0.98] transition"
        >
          Aceptar pedido
        </button>
      </form>
    </div>
  );
}

function ActiveDeliveryCard({
  order,
  items,
}: {
  order: OrderRow;
  items: OrderItemRow[];
}) {
  return (
    <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-3">
      <p className="text-sm font-semibold text-zinc-800">{order.customerName}</p>
      <p className="text-sm text-zinc-600">{order.address}</p>
      {order.notes && <p className="mt-1 text-xs text-zinc-500">Notas: {order.notes}</p>}

      <ul className="mt-2 space-y-0.5 text-xs text-zinc-600">
        {items.map((item) => (
          <li key={item.id}>
            {item.quantity}x {item.productName}
          </li>
        ))}
      </ul>

      <div className="mt-2 flex items-center justify-between text-sm font-bold text-zinc-800">
        <span>Total</span>
        <span>{formatPrice(order.total)}</span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <a
          href={mapsLink(order.address)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-10 items-center justify-center rounded-full border border-indigo-300 bg-white text-sm font-semibold text-indigo-700"
        >
          📍 Mapa
        </a>
        <a
          href={`tel:${order.phone}`}
          className="flex h-10 items-center justify-center rounded-full border border-indigo-300 bg-white text-sm font-semibold text-indigo-700"
        >
          📞 Llamar
        </a>
      </div>

      <form action={markDeliveredAction} className="mt-2">
        <input type="hidden" name="orderId" value={order.id} />
        <button
          type="submit"
          className="flex h-10 w-full items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white active:scale-[0.98] transition"
        >
          Marcar entregado
        </button>
      </form>
    </div>
  );
}
