import { getAllRiders, getRiderIdsWithPushSubscription } from "@/lib/db/queries";
import { RiderCreateForm } from "@/components/admin/RiderCreateForm";
import { DeleteRiderButton } from "@/components/admin/DeleteRiderButton";
import { formatArgentinaDateTime } from "@/lib/timezone";
import { toggleRiderActiveAction } from "./actions";

const ONLINE_THRESHOLD_MS = 5 * 60 * 1000;

// Se considera "en línea" si tuvo actividad en los últimos 5 minutos — la
// app del repartidor se refresca sola cada 15s mientras está abierta, así
// que esto detecta bien a quien la tiene abierta ahora mismo.
function isRiderOnline(lastSeenAt: string | null): boolean {
  if (!lastSeenAt) return false;
  const normalized = lastSeenAt.includes("T") ? lastSeenAt : `${lastSeenAt.replace(" ", "T")}Z`;
  return Date.now() - new Date(normalized).getTime() < ONLINE_THRESHOLD_MS;
}

export default async function AdminRidersPage() {
  const [riderList, ridersWithPush] = await Promise.all([
    getAllRiders(),
    getRiderIdsWithPushSubscription(),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-zinc-900">Repartidores</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Cada repartidor entra a <span className="font-mono text-xs">/rider</span> con
        su usuario y contraseña, ve los pedidos disponibles y acepta el que quiera.
      </p>

      <RiderCreateForm />

      <div className="mt-4 space-y-2">
        {riderList.length === 0 && (
          <p className="text-sm text-zinc-500">Todavía no cargaste ningún repartidor.</p>
        )}
        {riderList.map((rider) => {
          const online = isRiderOnline(rider.lastSeenAt);
          return (
          <div
            key={rider.id}
            className="flex items-center justify-between rounded-2xl border border-zinc-200 bg-white p-3"
          >
            <div>
              <div className="flex items-center gap-1.5">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${online ? "bg-emerald-500" : "bg-zinc-300"}`}
                />
                <p className="text-sm font-semibold text-zinc-800">{rider.name}</p>
              </div>
              <p className="text-xs text-zinc-500">
                @{rider.username} · {rider.phone}
              </p>
              <p className={`mt-1 text-xs font-medium ${online ? "text-emerald-600" : "text-zinc-400"}`}>
                {online
                  ? "🟢 En línea ahora"
                  : rider.lastSeenAt
                    ? `⚫ Desconectado · últ. vez ${formatArgentinaDateTime(rider.lastSeenAt)}`
                    : "⚫ Nunca se conectó"}
              </p>
              <p
                className={`mt-0.5 text-xs font-medium ${
                  ridersWithPush.has(rider.id) ? "text-emerald-600" : "text-zinc-400"
                }`}
              >
                {ridersWithPush.has(rider.id)
                  ? "🔔 Notificaciones activas"
                  : "🔕 Sin notificaciones activas"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <form action={toggleRiderActiveAction}>
                <input type="hidden" name="id" value={rider.id} />
                <input type="hidden" name="name" value={rider.name} />
                <input type="hidden" name="phone" value={rider.phone} />
                <input type="hidden" name="username" value={rider.username} />
                <input type="hidden" name="active" value={(!rider.active).toString()} />
                <button
                  type="submit"
                  className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                    rider.active
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-zinc-100 text-zinc-500"
                  }`}
                >
                  {rider.active ? "Activo" : "Inactivo"}
                </button>
              </form>
              <DeleteRiderButton id={rider.id} name={rider.name} />
            </div>
          </div>
          );
        })}
      </div>
    </div>
  );
}
