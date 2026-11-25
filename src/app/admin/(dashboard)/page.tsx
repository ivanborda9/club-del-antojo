import Link from "next/link";
import {
  getLowStockProducts,
  getNewOrdersCount,
  getSalesReport,
  getStoreOverride,
  isStoreOpenNow,
  listOrders,
  toSqliteTimestamp,
} from "@/lib/db/queries";
import { formatPrice } from "@/config/site";
import { getArgentinaTodayBoundsUTC } from "@/lib/timezone";
import { setStoreOverrideAction } from "./horarios/actions";

export default async function AdminDashboardPage() {
  const { start, end } = getArgentinaTodayBoundsUTC();

  const [todayReport, pendingOrders, lowStock, newOrdersCount, storeOpen, storeOverride] =
    await Promise.all([
      getSalesReport(toSqliteTimestamp(start), toSqliteTimestamp(end)),
      listOrders("pendiente_pago"),
      getLowStockProducts(),
      getNewOrdersCount(),
      isStoreOpenNow(),
      getStoreOverride(),
    ]);

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-zinc-900">Panel</h1>

      <div
        className={`mt-4 rounded-2xl p-4 ${storeOpen ? "bg-emerald-500" : "bg-zinc-800"}`}
      >
        <div className="flex items-center justify-between gap-3">
          <p className="text-base font-extrabold text-white">
            {storeOpen ? "🟢 Tienda ABIERTA" : "🔴 Tienda CERRADA"}
          </p>
          <Link
            href="/admin/horarios"
            className="shrink-0 text-xs font-semibold text-white/80 underline underline-offset-2"
          >
            Configurar horarios →
          </Link>
        </div>

        {storeOverride === "closed" && (
          <form action={setStoreOverrideAction} className="mt-2">
            <input type="hidden" name="override" value="" />
            <p className="text-xs text-white/80">
              ⚠️ Forzada cerrada manualmente — se queda así hasta que la vuelvas a abrir,
              aunque esté dentro de tu horario habitual.
            </p>
            <button
              type="submit"
              className="mt-2 h-10 w-full rounded-full bg-white text-sm font-extrabold text-zinc-800"
            >
              ✅ Volver a abrir
            </button>
          </form>
        )}

        {storeOverride === "open" && (
          <form action={setStoreOverrideAction} className="mt-2">
            <input type="hidden" name="override" value="" />
            <p className="text-xs text-white/80">
              Forzada abierta manualmente (ignora el horario configurado).
            </p>
            <button
              type="submit"
              className="mt-2 h-10 w-full rounded-full bg-white/20 text-sm font-semibold text-white"
            >
              Volver al horario automático
            </button>
          </form>
        )}

        {storeOverride === "" && (
          <form action={setStoreOverrideAction} className="mt-2">
            <input type="hidden" name="override" value="closed" />
            <p className="text-xs text-white/80">
              Según tu horario automático. Si necesitás cerrar ahora mismo (ej. te
              quedaste sin stock de todo, o un imprevisto):
            </p>
            <button
              type="submit"
              className="mt-2 h-10 w-full rounded-full bg-white/20 text-sm font-semibold text-white"
            >
              🚫 Cerrar ahora
            </button>
          </form>
        )}
      </div>

      {newOrdersCount > 0 && (
        <Link
          href="/admin/pedidos?status=pagado"
          className="mt-4 flex items-center gap-3 rounded-2xl bg-red-600 p-4 text-white shadow-sm active:scale-[0.99] transition"
        >
          <span className="text-3xl">📬</span>
          <div>
            <p className="text-base font-extrabold">
              {newOrdersCount === 1
                ? "¡Tenés un pedido nuevo!"
                : `¡Tenés ${newOrdersCount} pedidos nuevos!`}
            </p>
            <p className="text-xs text-red-100">Tocá para verlos</p>
          </div>
        </Link>
      )}

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat icon="💰" label="Ventas de hoy" value={formatPrice(todayReport.revenue)} />
        <Stat icon="📈" label="Ganancia de hoy" value={formatPrice(todayReport.profit)} accent />
        <Link href="/admin/pedidos?status=pendiente_pago">
          <Stat icon="⏳" label="Pedidos pendientes" value={String(pendingOrders.length)} warn />
        </Link>
        <Link href="/admin/reportes">
          <Stat icon="📦" label="Stock bajo" value={String(lowStock.length)} warn />
        </Link>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href="/admin/productos/nuevo"
          className="flex items-center gap-2 rounded-full bg-orange-600 px-5 py-3 text-base font-bold text-white"
        >
          <span className="text-lg">➕</span> Cargar producto
        </Link>
        <Link
          href="/admin/pedidos"
          className="flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-5 py-3 text-base font-semibold text-zinc-700"
        >
          <span className="text-lg">🧾</span> Pedidos
        </Link>
        <Link
          href="/admin/reportes"
          className="flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-5 py-3 text-base font-semibold text-zinc-700"
        >
          <span className="text-lg">📊</span> Reportes
        </Link>
      </div>

      {lowStock.length > 0 && (
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-semibold text-amber-800">
            Productos para reponer pronto
          </p>
          <ul className="mt-2 space-y-1 text-sm text-amber-700">
            {lowStock.slice(0, 5).map((p) => (
              <li key={p.id} className="flex justify-between">
                <span>{p.emoji} {p.name}</span>
                <span className="font-medium">{p.stock} un.</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  accent,
  warn,
}: {
  icon: string;
  label: string;
  value: string;
  accent?: boolean;
  warn?: boolean;
}) {
  return (
    <div className="h-full rounded-2xl border border-zinc-200 bg-white p-4">
      <span className="text-2xl">{icon}</span>
      <p className="mt-1 text-xs font-medium text-zinc-500">{label}</p>
      <p
        className={`mt-0.5 text-2xl font-extrabold ${
          accent ? "text-emerald-600" : warn ? "text-amber-600" : "text-zinc-900"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
