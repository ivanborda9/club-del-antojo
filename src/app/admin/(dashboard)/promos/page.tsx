import Link from "next/link";
import { getAllProducts, getAllUpsells, getCartPromoSettings } from "@/lib/db/queries";
import { formatPrice } from "@/config/site";
import { CASH_DISCOUNT_RATE } from "@/lib/pricing";
import { setCartPromoEligibleProductsAction, setCartPromoSettingsAction } from "./actions";

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

export default async function AdminPromosPage() {
  const [settings, productList, upsells] = await Promise.all([
    getCartPromoSettings(),
    getAllProducts(),
    getAllUpsells(),
  ]);

  const categoryOptions = Array.from(
    new Set(
      productList.flatMap((p) => [p.category, p.parentCategory]).filter((c): c is string => Boolean(c))
    )
  ).sort();

  const byCategory = groupBy(productList, (p) => p.category || NO_PARENT);
  const eligibleCount = productList.filter((p) => p.cartPromoEligible).length;

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-extrabold text-zinc-900">Promos del checkout</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Cartel no invasivo que aparece al pagar, ofreciendo un descuento en ciertos
        productos cuando el carrito tiene algo de una categoría y todavía nada de otra.
        Ej: &quot;Salvá la Comida&quot; → ofrecer bebida con descuento.
      </p>

      <div className="mt-4 space-y-2 rounded-2xl border border-zinc-200 bg-white p-4">
        <p className="text-sm font-semibold text-zinc-800">Promos activas ahora</p>

        <div
          className={`flex items-center justify-between rounded-xl px-3 py-2 text-sm ${
            settings.active ? "bg-emerald-50 text-emerald-800" : "bg-zinc-50 text-zinc-500"
          }`}
        >
          <span>
            🥤 {settings.active ? "Activa" : "Inactiva"}
            {settings.active &&
              ` — "${settings.triggerCategory}" sin "${settings.excludeCategory}" → ${settings.discountPercent}% off (${eligibleCount} ${eligibleCount === 1 ? "producto" : "productos"})`}
          </span>
        </div>

        {upsells.length === 0 ? (
          <p className="rounded-xl bg-zinc-50 px-3 py-2 text-sm text-zinc-500">
            Sin ofertas &quot;antes de pagar&quot; configuradas en ningún producto.
          </p>
        ) : (
          upsells.map((u) => (
            <Link
              key={u.id}
              href={`/admin/productos/${u.triggerProductId}`}
              className="flex items-center justify-between rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800 hover:bg-emerald-100"
            >
              <span>
                🎁 {u.triggerProductName} → {u.offerProductName} a {formatPrice(u.offerPrice)}
                {u.offerSalePrice > u.offerPrice && (
                  <span className="text-emerald-600"> (normal {formatPrice(u.offerSalePrice)})</span>
                )}
              </span>
              <span className="text-xs text-emerald-600">Editar →</span>
            </Link>
          ))
        )}

        <div className="flex items-center justify-between rounded-xl bg-zinc-50 px-3 py-2 text-sm text-zinc-500">
          <span>💵 Siempre activo — {Math.round(CASH_DISCOUNT_RATE * 100)}% off pagando en efectivo</span>
        </div>
      </div>

      <form
        action={setCartPromoSettingsAction}
        className="mt-4 space-y-3 rounded-2xl border border-zinc-200 bg-white p-4"
      >
        <p className="text-sm font-semibold text-zinc-800">Configuración</p>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-zinc-600">
              Si el carrito tiene algo de esta categoría…
            </span>
            <select
              name="triggerCategory"
              defaultValue={settings.triggerCategory}
              className="input"
            >
              <option value="">Elegí una categoría…</option>
              {categoryOptions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-zinc-600">
              …y todavía nada de esta otra…
            </span>
            <select
              name="excludeCategory"
              defaultValue={settings.excludeCategory}
              className="input"
            >
              <option value="">Elegí una categoría…</option>
              {categoryOptions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="block max-w-32">
          <span className="mb-1 block text-xs font-medium text-zinc-600">Descuento (%)</span>
          <input
            name="discountPercent"
            type="number"
            step="1"
            min="0"
            max="100"
            defaultValue={settings.discountPercent}
            className="input"
          />
        </label>

        <label className="flex items-center gap-2 text-sm text-zinc-700">
          <input type="checkbox" name="active" defaultChecked={settings.active} className="h-4 w-4" />
          Promo activa
        </label>

        <button
          type="submit"
          className="h-10 rounded-full bg-orange-600 px-5 text-sm font-bold text-white"
        >
          Guardar configuración
        </button>
      </form>

      <form
        action={setCartPromoEligibleProductsAction}
        className="mt-4 space-y-3 rounded-2xl border border-zinc-200 bg-white p-4"
      >
        <p className="text-sm font-semibold text-zinc-800">Productos que se ofrecen con descuento</p>
        <p className="text-xs text-zinc-500">
          Tildá los que querés que puedan salir en el cartel (ej. las bebidas).
        </p>

        <div className="max-h-[32rem] space-y-3 overflow-y-auto">
          {byCategory.map(([category, items]) => (
            <div key={category}>
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                {category === NO_PARENT ? "Sin categoría" : category}
              </p>
              <div className="mt-1 space-y-1">
                {items.map((product) => (
                  <label
                    key={product.id}
                    className="flex items-center gap-2 rounded-lg px-1 py-1 text-sm text-zinc-700 hover:bg-zinc-50"
                  >
                    <input
                      type="checkbox"
                      name="productId"
                      value={product.id}
                      defaultChecked={product.cartPromoEligible}
                      className="h-4 w-4"
                    />
                    <span className="flex-1">{product.name}</span>
                    <span className="text-xs text-zinc-400">{formatPrice(product.salePrice)}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        <button
          type="submit"
          className="h-10 rounded-full bg-orange-600 px-5 text-sm font-bold text-white"
        >
          Guardar productos
        </button>
      </form>
    </div>
  );
}
