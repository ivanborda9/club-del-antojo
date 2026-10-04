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
        <p className="rounded-2xl bg-red-50 p-3 text-sm font-medium text-red-700">
          ⚠️ Ese pedido ya lo tomó otro repartidor. Elegí otro de la lista.
        </p>
      )}

      <section>
        <div className="flex items-center gap-2">
          <span className="text-2xl">🛵</span>
          <h2 className="text-xl font-extrabold text-zinc-900">Mis entregas en curso</h2>
          <span className="flex h-7 min-w-7 items-center justify-center rounded-full bg-indigo-600 px-2 text-sm font-bold text-white">
            {mine.length}
          </span>
        </div>
        {mine.length === 0 ? (
          <p className="mt-2 rounded-2xl bg-white p-4 text-center text-sm text-zinc-500">
            No tenés entregas en curso.
          </p>
        ) : (
          <div className="mt-3 space-y-3">
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
        <div className="flex items-center gap-2">
          <span className="text-2xl">📦</span>
          <h2 className="text-xl font-extrabold text-zinc-900">Pedidos disponibles</h2>
          <span className="flex h-7 min-w-7 items-center justify-center rounded-full bg-orange-600 px-2 text-sm font-bold text-white">
            {pool.length}
          </span>
        </div>
        {pool.length === 0 ? (
          <p className="mt-2 rounded-2xl bg-white p-4 text-center text-sm text-zinc-500">
            No hay pedidos esperando reparto ahora. Esta pantalla se actualiza sola. 🔄
          </p>
        ) : (
          <div className="mt-3 space-y-3">
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
    <div className="rounded-2xl border-2 border-orange-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2.5">
          <span className="text-2xl">📍</span>
          <div>
            <p className="text-base font-bold text-zinc-900">{order.address}</p>
            <p className="mt-0.5 text-xs text-zinc-500">
              {PAYMENT_METHOD_LABELS[order.paymentMethod]} ·{" "}
              {formatArgentinaDateTime(order.createdAt)}
            </p>
          </div>
        </div>
        <span className="shrink-0 text-xl font-extrabold text-orange-600">
          {formatPrice(order.total)}
        </span>
      </div>
      <form action={claimOrderAction} className="mt-3">
        <input type="hidden" name="orderId" value={order.id} />
        <button
          type="submit"
          className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-orange-600 text-base font-bold text-white active:scale-[0.98] transition"
        >
          ✅ Aceptar pedido
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
    <div className="rounded-2xl border-2 border-indigo-300 bg-indigo-50 p-4 shadow-sm">
      <div className="flex items-start gap-2.5">
        <span className="text-2xl">🛵</span>
        <div>
          <p className="text-base font-bold text-zinc-900">{order.customerName}</p>
          <p className="text-sm text-zinc-600">{order.address}</p>
          {order.notes && <p className="mt-1 text-xs text-zinc-500">📝 {order.notes}</p>}
        </div>
      </div>

      <ul className="mt-2 space-y-0.5 text-sm text-zinc-600">
        {items.map((item) => (
          <li key={item.id}>
            {item.quantity}x {item.productName}
          </li>
        ))}
      </ul>

      <div className="mt-2 flex items-center justify-between text-lg font-extrabold text-zinc-900">
        <span>Total</span>
        <span>{formatPrice(order.total)}</span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <a
          href={mapsLink(order.address)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-12 items-center justify-center gap-1.5 rounded-full border-2 border-indigo-300 bg-white text-base font-semibold text-indigo-700"
        >
          📍 Mapa
        </a>
        <a
          href={`tel:${order.phone}`}
          className="flex h-12 items-center justify-center gap-1.5 rounded-full border-2 border-indigo-300 bg-white text-base font-semibold text-indigo-700"
        >
          📞 Llamar
        </a>
      </div>

      <form action={markDeliveredAction} className="mt-2">
        <input type="hidden" name="orderId" value={order.id} />
        <button
          type="submit"
          className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-indigo-600 text-base font-bold text-white active:scale-[0.98] transition"
        >
          🏁 Marcar entregado
        </button>
      </form>
    </div>
  );
}
