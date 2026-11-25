import Link from "next/link";
import { getAllProducts } from "@/lib/db/queries";
import { StockProductForm } from "@/components/admin/StockProductForm";

export default async function NewStockProductPage() {
  const products = await getAllProducts();

  const categories = Array.from(new Set(products.map((p) => p.category).filter(Boolean))).sort();
  const parentCategories = Array.from(
    new Set(products.map((p) => p.parentCategory).filter((p): p is string => Boolean(p)))
  ).sort();

  return (
    <div className="max-w-lg">
      <Link href="/admin/stock" className="text-sm font-medium text-orange-600">
        ← Volver a Stock
      </Link>
      <h1 className="mt-2 text-2xl font-extrabold text-zinc-900">Nuevo producto</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Cargá un producto nuevo con su foto, categoría, precio de venta y stock inicial.
      </p>

      <div className="mt-4">
        <StockProductForm categories={categories} parentCategories={parentCategories} />
      </div>
    </div>
  );
}
