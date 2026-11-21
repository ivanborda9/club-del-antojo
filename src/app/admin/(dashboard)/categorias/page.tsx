import { getAllProducts, getCategorySortOrders } from "@/lib/db/queries";
import { setCategorySortOrdersAction } from "./actions";

const NO_PARENT = "__sin_categoria__";

function groupBy<T>(items: T[], keyOf: (item: T) => string): [string, T[]][] {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const key = keyOf(item);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(item);
  }
  return Array.from(groups.entries());
}

export default async function AdminCategoriasPage() {
  const [productList, sortOrders] = await Promise.all([getAllProducts(), getCategorySortOrders()]);

  const orderByCategory = new Map(sortOrders.map((c) => [c.category, c.sortOrder]));
  const categories = Array.from(new Set(productList.map((p) => p.category)));
  const parentByCategory = new Map(productList.map((p) => [p.category, p.parentCategory]));

  const sortedCategories = [...categories].sort((a, b) => {
    const orderA = orderByCategory.get(a) ?? Infinity;
    const orderB = orderByCategory.get(b) ?? Infinity;
    return orderA !== orderB ? orderA - orderB : a.localeCompare(b);
  });
  const byParent = groupBy(sortedCategories, (c) => parentByCategory.get(c) || NO_PARENT);

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-extrabold text-zinc-900">Orden de categorías</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Define en qué orden aparecen las categorías en la tienda (solapas y filas del
        inicio). Número más bajo aparece primero. Las que dejes vacías quedan al final,
        ordenadas alfabéticamente entre sí.
      </p>

      <form
        action={setCategorySortOrdersAction}
        className="mt-4 space-y-4 rounded-2xl border border-zinc-200 bg-white p-4"
      >
        {byParent.map(([parent, parentCategories]) => (
          <div key={parent}>
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
              {parent === NO_PARENT ? "Sin categoría padre" : parent}
            </p>
            <div className="mt-1 space-y-1.5">
              {parentCategories.map((category) => (
                <div key={category} className="flex items-center gap-2">
                  <input type="hidden" name="category" value={category} />
                  <input
                    name="order"
                    type="number"
                    step="1"
                    defaultValue={orderByCategory.get(category) ?? ""}
                    placeholder="—"
                    className="input h-9 w-20 text-sm"
                  />
                  <span className="flex-1 text-sm text-zinc-700">{category}</span>
                </div>
              ))}
            </div>
          </div>
        ))}

        <button
          type="submit"
          className="h-10 rounded-full bg-orange-600 px-5 text-sm font-bold text-white"
        >
          Guardar orden
        </button>
      </form>
    </div>
  );
}
