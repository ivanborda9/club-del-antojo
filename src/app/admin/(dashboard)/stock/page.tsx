import Image from "next/image";
import Link from "next/link";
import { getAllProductVariants, getAllProducts, getSalesReport, toSqliteTimestamp } from "@/lib/db/queries";
import { formatPrice } from "@/config/site";
import { getArgentinaTodayBoundsUTC } from "@/lib/timezone";
import { updateProductStockAction, updateVariantStockAction } from "./actions";

const NO_PARENT = "__sin_categoria__";

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

export default async function AdminStockPage(props: PageProps<"/admin/stock">) {
  const { start, end } = getArgentinaTodayBoundsUTC();

  const [products, variants, todayReport, searchParams] = await Promise.all([
    getAllProducts(),
    getAllProductVariants(),
    // Reporte de ventas de hoy: solo monto y cantidad, sin costo ni
    // ganancia — el rol "encargado/a" no tiene acceso a esos datos.
    getSalesReport(toSqliteTimestamp(start), toSqliteTimestamp(end)),
    props.searchParams,
  ]);

  const variantsByProduct = new Map<string, typeof variants>();
  for (const v of variants) {
    const list = variantsByProduct.get(v.productId) ?? [];
    list.push(v);
    variantsByProduct.set(v.productId, list);
  }

  const byParent = groupBy(products, (p) => p.parentCategory || NO_PARENT);

  const requestedParent =
    typeof searchParams.parent === "string" ? searchParams.parent : undefined;
  const activeParent =
    requestedParent && byParent.some(([p]) => p === requestedParent) ? requestedParent : null;

  const productsInParent = byParent.find(([p]) => p === activeParent)?.[1] ?? [];
  const bySubcategory = groupBy(productsInParent, (p) => p.category);

  const requestedCategory =
    typeof searchParams.category === "string" ? searchParams.category : undefined;
  const activeCategory =
    requestedCategory && bySubcategory.some(([c]) => c === requestedCategory)
      ? requestedCategory
      : null;

  const activeProducts = bySubcategory.find(([c]) => c === activeCategory)?.[1] ?? [];

  function parentHref(parent: string): string {
    return `/admin/stock?parent=${encodeURIComponent(parent)}`;
  }
  function categoryHref(category: string): string {
    return `/admin/stock?parent=${encodeURIComponent(activeParent ?? NO_PARENT)}&category=${encodeURIComponent(category)}`;
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold text-zinc-900">Stock</h1>
        <Link
          href="/admin/stock/nuevo"
          className="shrink-0 rounded-full bg-orange-600 px-4 py-2 text-sm font-bold text-white"
        >
          + Nuevo producto
        </Link>
      </div>

      <div className="mt-4 rounded-2xl border border-zinc-200 bg-white p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
          Ventas de hoy
        </p>
        <div className="mt-2 grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-xl font-extrabold text-zinc-900">{todayReport.orderCount}</p>
            <p className="text-xs text-zinc-500">Pedidos</p>
          </div>
          <div>
            <p className="text-xl font-extrabold text-zinc-900">
              {formatPrice(todayReport.revenue)}
            </p>
            <p className="text-xs text-zinc-500">Total vendido</p>
          </div>
          <div>
            <p className="text-xl font-extrabold text-zinc-900">
              {formatPrice(todayReport.averageTicket)}
            </p>
            <p className="text-xs text-zinc-500">Ticket promedio</p>
          </div>
        </div>
      </div>

      <p className="mt-4 text-sm text-zinc-500">
        Actualizá el stock de cada producto. Si tiene variedades (ej. sabores), cada una
        tiene su propio stock.
      </p>

      {byParent.length === 0 ? (
        <p className="mt-6 text-sm text-zinc-500">Todavía no hay productos cargados.</p>
      ) : (
        <>
          <div className="mt-4 flex flex-wrap gap-2">
            {byParent.map(([parent, items]) => (
              <Link
                key={parent}
                href={parentHref(parent)}
                className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold transition ${
                  parent === activeParent
                    ? "bg-orange-600 text-white"
                    : "bg-orange-50 text-orange-700 hover:bg-orange-100"
                }`}
              >
                📁 {parent === NO_PARENT ? "Sin categoría" : parent}
                <span
                  className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-bold ${
                    parent === activeParent
                      ? "bg-white/25 text-white"
                      : "bg-orange-200 text-orange-800"
                  }`}
                >
                  {items.length}
                </span>
              </Link>
            ))}
          </div>

          {!activeParent && (
            <p className="mt-4 text-sm text-zinc-500">
              Elegí una categoría para ver sus productos.
            </p>
          )}

          {activeParent && bySubcategory.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {bySubcategory.map(([category, items]) => (
                <Link
                  key={category}
                  href={categoryHref(category)}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold transition ${
                    category === activeCategory
                      ? "bg-zinc-800 text-white"
                      : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                  }`}
                >
                  🏷️ {category}
                  <span
                    className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-bold ${
                      category === activeCategory
                        ? "bg-white/25 text-white"
                        : "bg-zinc-200 text-zinc-600"
                    }`}
                  >
                    {items.length}
                  </span>
                </Link>
              ))}
            </div>
          )}

          {activeParent && !activeCategory && bySubcategory.length > 0 && (
            <p className="mt-4 text-sm text-zinc-500">
              Elegí una subcategoría para ver sus productos.
            </p>
          )}

          {activeCategory && (
            <div className="mt-4 space-y-2">
              {activeProducts.map((product) => {
                const productVariants = variantsByProduct.get(product.id) ?? [];
                return (
                  <div
                    key={product.id}
                    className="rounded-2xl border border-zinc-200 bg-white p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-orange-50 text-xl">
                        {product.imageUrl ? (
                          <Image
                            src={product.imageUrl}
                            alt=""
                            width={44}
                            height={44}
                            className="h-full w-full object-contain p-1"
                          />
                        ) : (
                          product.emoji
                        )}
                      </div>
                      <p className="flex-1 text-sm font-semibold text-zinc-800">
                        {product.name}
                        {!product.active && (
                          <span className="ml-1.5 text-xs font-normal text-zinc-400">
                            (oculto)
                          </span>
                        )}
                      </p>

                      {productVariants.length === 0 && (
                        <form
                          action={updateProductStockAction}
                          className="flex items-center gap-2"
                        >
                          <input type="hidden" name="id" value={product.id} />
                          <input
                            name="stock"
                            type="number"
                            step="1"
                            min="0"
                            defaultValue={product.stock}
                            className="input h-9 w-20 text-sm"
                          />
                          <button
                            type="submit"
                            className="h-9 shrink-0 rounded-full bg-orange-600 px-3 text-xs font-bold text-white"
                          >
                            Guardar
                          </button>
                        </form>
                      )}
                    </div>

                    {productVariants.length > 0 && (
                      <div className="mt-2 space-y-1.5 border-t border-zinc-100 pt-2">
                        {productVariants.map((variant) => (
                          <form
                            key={variant.id}
                            action={updateVariantStockAction}
                            className="flex items-center gap-2"
                          >
                            <input type="hidden" name="id" value={variant.id} />
                            <span className="flex-1 text-xs text-zinc-600">{variant.name}</span>
                            <input
                              name="stock"
                              type="number"
                              step="1"
                              min="0"
                              defaultValue={variant.stock}
                              className="input h-8 w-20 text-xs"
                            />
                            <button
                              type="submit"
                              className="h-8 shrink-0 rounded-full bg-zinc-800 px-3 text-xs font-bold text-white"
                            >
                              Guardar
                            </button>
                          </form>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
