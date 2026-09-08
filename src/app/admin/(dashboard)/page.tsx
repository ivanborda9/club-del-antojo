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
      <h1 className="text-lg font-bold text-zinc-800">Panel</h1>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Ventas de hoy" value={formatPrice(todayReport.revenue)} />
        <Stat label="Ganancia de hoy" value={formatPrice(todayReport.profit)} accent />
        <Link href="/admin/pedidos?status=pendiente_pago">
          <Stat label="Pedidos pendientes" value={String(pendingOrders.length)} warn />
        </Link>
        <Link href="/admin/reportes">
          <Stat label="Productos con stock bajo" value={String(lowStock.length)} warn />
        </Link>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href="/admin/productos/nuevo"
          className="rounded-full bg-orange-600 px-4 py-2 text-sm font-bold text-white"
        >
          + Cargar producto
        </Link>
        <Link
          href="/admin/pedidos"
          className="rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700"
        >
          Ver todos los pedidos
        </Link>
        <Link
          href="/admin/reportes"
          className="rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700"
        >
          Ver reportes
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
  label,
  value,
  accent,
  warn,
}: {
  label: string;
  value: string;
  accent?: boolean;
  warn?: boolean;
}) {
  return (
    <div className="h-full rounded-2xl border border-zinc-200 bg-white p-3">
      <p className="text-xs text-zinc-500">{label}</p>
      <p
        className={`mt-1 text-lg font-bold ${
          accent ? "text-emerald-600" : warn ? "text-amber-600" : "text-zinc-800"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
