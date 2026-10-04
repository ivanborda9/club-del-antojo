import Link from "next/link";
import {
  getLowStockProducts,
  getSalesReport,
  listOrders,
  toSqliteTimestamp,
} from "@/lib/db/queries";
import { formatPrice } from "@/config/site";
import { getArgentinaTodayBoundsUTC } from "@/lib/timezone";

export default async function AdminDashboardPage() {
  const { start, end } = getArgentinaTodayBoundsUTC();

  const [todayReport, pendingOrders, lowStock] = await Promise.all([
    getSalesReport(toSqliteTimestamp(start), toSqliteTimestamp(end)),
    listOrders("pendiente_pago"),
    getLowStockProducts(),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-zinc-900">Panel</h1>

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
