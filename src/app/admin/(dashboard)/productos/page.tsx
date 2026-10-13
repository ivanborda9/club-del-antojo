import Image from "next/image";
import Link from "next/link";
import { getAllCategorySchedules, getAllProducts } from "@/lib/db/queries";
import { marginPercent } from "@/lib/margin";
import { formatPrice } from "@/config/site";
import { isWithinSchedule } from "@/lib/schedule";
import { DeleteProductButton } from "@/components/admin/DeleteProductButton";
import { CategoryScheduleControl } from "@/components/admin/CategoryScheduleControl";

// Agrupa manteniendo el orden en que vienen (getAllProducts ya ordena por
// categoría, nombre), para que los grupos salgan ordenados solos.
function groupBy<T>(items: T[], keyOf: (item: T) => string): [string, T[]][] {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const key = keyOf(item);
    const list = groups.get(key) ?? [];
    list.push(item);
    groups.set(key, list);
  }
  return Array.from(groups.entries());
}

export default async function AdminProductsPage(
  props: PageProps<"/admin/productos">
) {
  const [productList, categorySchedules, searchParams] = await Promise.all([
    getAllProducts(),
    getAllCategorySchedules(),
    props.searchParams,
  ]);
  const scheduleByCategory = new Map(categorySchedules.map((c) => [c.category, c]));

  const byCategory = groupBy(productList, (p) => p.category);

  // No se preselecciona ninguna categoría: primero se elige la categoría y
  // recién ahí aparecen sus productos, para que el listado no abra directo
  // en una tabla larga.
  const requestedCategory =
    typeof searchParams.category === "string" ? searchParams.category : undefined;
  const activeCategory =
    requestedCategory && byCategory.some(([c]) => c === requestedCategory)
      ? requestedCategory
      : null;

  const activeProducts = byCategory.find(([c]) => c === activeCategory)?.[1] ?? [];
  const activeSchedule = activeCategory ? scheduleByCategory.get(activeCategory) : undefined;

  function categoryHref(category: string): string {
    return `/admin/productos?category=${encodeURIComponent(category)}`;
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-zinc-900">Productos</h1>
        <Link
          href="/admin/productos/nuevo"
          className="rounded-full bg-orange-600 px-4 py-2 text-sm font-bold text-white"
        >
          + Nuevo producto
        </Link>
      </div>

      {byCategory.length === 0 ? (
        <p className="mt-6 text-sm text-zinc-500">Todavía no cargaste ningún producto.</p>
      ) : (
        <>
          {/* Categorías */}
          <div className="mt-4 flex flex-wrap gap-2">
            {byCategory.map(([category, products]) => (
              <Link
                key={category}
                href={categoryHref(category)}
                className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold transition ${
                  category === activeCategory
                    ? "bg-orange-600 text-white"
                    : "bg-orange-50 text-orange-700 hover:bg-orange-100"
                }`}
              >
                🏷️ {category}
                <span
                  className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-bold ${
                    category === activeCategory
                      ? "bg-white/25 text-white"
                      : "bg-orange-200 text-orange-800"
                  }`}
                >
                  {products.length}
                </span>
              </Link>
            ))}
          </div>

          {!activeCategory && (
            <p className="mt-4 text-sm text-zinc-500">
              Elegí una categoría para ver sus productos.
            </p>
          )}

          {activeCategory && (
            <section className="mt-4">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-extrabold text-zinc-900">{activeCategory}</h2>
                <div className="ml-auto">
                  <CategoryScheduleControl
                    category={activeCategory}
                    scheduleStart={activeSchedule?.scheduleStart ?? null}
                    scheduleEnd={activeSchedule?.scheduleEnd ?? null}
                  />
                </div>
              </div>

              <div className="mt-2 overflow-x-auto rounded-2xl border border-zinc-200 bg-white">
                <table className="w-full min-w-[680px] text-sm">
                  <thead>
                    <tr className="border-b border-zinc-200 text-left text-xs text-zinc-500">
                      <th className="px-3 py-2">Producto</th>
                      <th className="px-3 py-2 text-right">Costo</th>
                      <th className="px-3 py-2 text-right">Venta</th>
                      <th className="px-3 py-2 text-right">Margen</th>
                      <th className="px-3 py-2 text-right">Stock</th>
                      <th className="px-3 py-2">Estado</th>
                      <th className="px-3 py-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {activeProducts.map((p) => {
                      const margin = marginPercent(p.costPrice, p.salePrice);
                      const lowStock = p.stock <= p.lowStockThreshold;
                      return (
                        <tr key={p.id} className="border-b border-zinc-100 last:border-0">
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-2">
                              {p.imageUrl ? (
                                <Image
                                  src={p.imageUrl}
                                  alt=""
                                  width={28}
                                  height={28}
                                  className="h-7 w-7 rounded-md object-cover"
                                />
                              ) : (
                                <span className="text-lg">{p.emoji}</span>
                              )}
                              {p.name}
                            </div>
                          </td>
                          <td className="px-3 py-2 text-right text-zinc-500">
                            {formatPrice(p.costPrice)}
                          </td>
                          <td className="px-3 py-2 text-right font-medium">
                            {formatPrice(p.salePrice)}
                          </td>
                          <td
                            className={`px-3 py-2 text-right font-medium ${
                              margin < 0 ? "text-red-600" : "text-emerald-600"
                            }`}
                          >
                            {margin.toFixed(1)}%
                          </td>
                          <td
                            className={`px-3 py-2 text-right font-medium ${
                              lowStock ? "text-red-600" : "text-zinc-700"
                            }`}
                          >
                            {p.stock}
                          </td>
                          <td className="px-3 py-2">
                            {p.active ? (
                              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700">
                                Visible
                              </span>
                            ) : (
                              <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500">
                                Oculto
                              </span>
                            )}
                            {p.active && p.scheduleStart && p.scheduleEnd && (
                              <span
                                className={`ml-1 inline-block rounded-full px-2 py-0.5 text-xs ${
                                  isWithinSchedule(p.scheduleStart, p.scheduleEnd)
                                    ? "bg-blue-50 text-blue-700"
                                    : "bg-zinc-100 text-zinc-400"
                                }`}
                              >
                                {p.scheduleStart}–{p.scheduleEnd}
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-3">
                              <Link
                                href={`/admin/productos/${p.id}`}
                                className="text-sm text-orange-600"
                              >
                                Editar
                              </Link>
                              <DeleteProductButton id={p.id} name={p.name} />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
