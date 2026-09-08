import type { Product } from "@/types";
import { ProductCard } from "./ProductCard";

export function ProductGrid({ products }: { products: Product[] }) {
  if (products.length === 0) {
    return (
      <p className="px-4 py-10 text-center text-sm text-zinc-500">
        No hay productos en esta categoría.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 px-4 py-4 sm:grid-cols-3">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
