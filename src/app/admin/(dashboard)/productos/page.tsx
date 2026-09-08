import Link from "next/link";
import { getAllProducts } from "@/lib/db/queries";
import { marginPercent } from "@/lib/margin";
import { formatPrice } from "@/config/site";
import { DeleteProductButton } from "@/components/admin/DeleteProductButton";

export default async function AdminProductsPage() {
  const productList = await getAllProducts();

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-zinc-800">Productos</h1>
        <Link
          href="/admin/productos/nuevo"
          className="rounded-full bg-orange-600 px-4 py-2 text-sm font-bold text-white"
        >
          + Nuevo producto
        </Link>
      </div>

      <div className="mt-4 overflow-x-auto rounded-2xl border border-zinc-200 bg-white">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-zinc-200 text-left text-xs text-zinc-500">
              <th className="px-3 py-2">Producto</th>
              <th className="px-3 py-2">Categoría</th>
              <th className="px-3 py-2 text-right">Costo</th>
              <th className="px-3 py-2 text-right">Venta</th>
              <th className="px-3 py-2 text-right">Margen</th>
              <th className="px-3 py-2 text-right">Stock</th>
              <th className="px-3 py-2">Estado</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {productList.map((p) => {
              const margin = marginPercent(p.costPrice, p.salePrice);
              const lowStock = p.stock <= p.lowStockThreshold;
              return (
                <tr key={p.id} className="border-b border-zinc-100 last:border-0">
                  <td className="px-3 py-2">
                    <span className="mr-2">{p.emoji}</span>
                    {p.name}
                  </td>
                  <td className="px-3 py-2 text-zinc-500">{p.category}</td>
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
    </div>
  );
}
