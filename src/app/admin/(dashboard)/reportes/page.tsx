import { getLowStockProducts, getSalesReport, toSqliteTimestamp } from "@/lib/db/queries";
import { formatPrice } from "@/config/site";
import { argentinaDateRangeToUTC, getArgentinaDateString } from "@/lib/timezone";

export default async function AdminReportsPage(
  props: PageProps<"/admin/reportes">
) {
  const searchParams = await props.searchParams;

  const todayAR = getArgentinaDateString();
  const defaultFromDate = new Date();
  defaultFromDate.setDate(defaultFromDate.getDate() - 30);
  const defaultFromAR = getArgentinaDateString(defaultFromDate);

  const from =
    typeof searchParams.from === "string" && searchParams.from
      ? searchParams.from
      : defaultFromAR;
  const to =
    typeof searchParams.to === "string" && searchParams.to ? searchParams.to : todayAR;

  const { start, end } = argentinaDateRangeToUTC(from, to);

  const [report, lowStock] = await Promise.all([
    getSalesReport(toSqliteTimestamp(start), toSqliteTimestamp(end)),
    getLowStockProducts(),
  ]);

  return (
    <div>
      <h1 className="text-lg font-bold text-zinc-800">Reportes de ventas</h1>

      <form className="mt-3 flex flex-wrap items-end gap-3">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-zinc-600">Desde</span>
          <input type="date" name="from" defaultValue={from} className="input" />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-zinc-600">Hasta</span>
          <input type="date" name="to" defaultValue={to} className="input" />
        </label>
        <button
          type="submit"
          className="h-10 rounded-full bg-orange-600 px-5 text-sm font-bold text-white"
        >
          Filtrar
        </button>
      </form>
      <p className="mt-1 text-xs text-zinc-400">
        Solo cuenta pedidos pagados o entregados.
      </p>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Ventas" value={formatPrice(report.revenue)} />
        <Stat label="Ganancia" value={formatPrice(report.profit)} accent />
        <Stat label="Pedidos" value={String(report.orderCount)} />
        <Stat label="Ticket promedio" value={formatPrice(report.averageTicket)} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-zinc-200 bg-white p-4">
          <p className="text-sm font-semibold text-zinc-800">Productos más vendidos</p>
          {report.bestSellers.length === 0 ? (
            <p className="mt-2 text-sm text-zinc-500">Sin ventas en este período.</p>
          ) : (
            <ul className="mt-2 space-y-1 text-sm">
              {report.bestSellers.slice(0, 10).map((p, i) => (
                <li key={p.productId} className="flex justify-between">
                  <span className="text-zinc-600">
                    {i + 1}. {p.productName}
                  </span>
                  <span className="font-medium text-zinc-800">
                    {p.quantity} un. · {formatPrice(p.revenue)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-4">
          <p className="text-sm font-semibold text-zinc-800">
            Productos próximos a reponer stock
          </p>
          {lowStock.length === 0 ? (
            <p className="mt-2 text-sm text-zinc-500">Todo el stock está en buen nivel.</p>
          ) : (
            <ul className="mt-2 space-y-1 text-sm">
              {lowStock.map((p) => (
                <li key={p.id} className="flex justify-between">
                  <span className="text-zinc-600">
                    {p.emoji} {p.name}
                  </span>
                  <span
                    className={`font-medium ${p.stock === 0 ? "text-red-600" : "text-amber-600"}`}
                  >
                    {p.stock} un.
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-3">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className={`mt-1 text-lg font-bold ${accent ? "text-emerald-600" : "text-zinc-800"}`}>
        {value}
      </p>
    </div>
  );
}
