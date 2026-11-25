import Image from "next/image";
import { getAllProductVariants, getAllProducts } from "@/lib/db/queries";
import { updateProductStockAction, updateVariantStockAction } from "./actions";

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

export default async function AdminStockPage() {
  const [products, variants] = await Promise.all([getAllProducts(), getAllProductVariants()]);

  const variantsByProduct = new Map<string, typeof variants>();
  for (const v of variants) {
    const list = variantsByProduct.get(v.productId) ?? [];
    list.push(v);
    variantsByProduct.set(v.productId, list);
  }

  const byCategory = groupBy(products, (p) => p.category || NO_PARENT);

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-extrabold text-zinc-900">Stock</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Actualizá el stock de cada producto. Si tiene variedades (ej. sabores), cada una
        tiene su propio stock.
      </p>

      <div className="mt-4 space-y-4">
        {byCategory.map(([category, items]) => (
          <div key={category}>
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
              {category === NO_PARENT ? "Sin categoría" : category}
            </p>
            <div className="mt-2 space-y-2">
              {items.map((product) => {
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
          </div>
        ))}
      </div>
    </div>
  );
}
