"use client";

import Image from "next/image";
import { formatPrice } from "@/config/site";
import { useCart } from "@/context/CartContext";
import type { Product } from "@/types";

export function CategoryRow({
  category,
  emoji,
  products,
  highlightedId,
  onSeeAll,
}: {
  category: string;
  emoji: string;
  products: Product[];
  highlightedId?: string | null;
  onSeeAll: () => void;
}) {
  if (products.length === 0) return null;

  return (
    <section className="mt-4">
      <div className="flex items-center justify-between px-4">
        <h2 className="flex items-center gap-1.5 text-sm font-extrabold text-zinc-800">
          <span className="text-base leading-none">{emoji}</span>
          {category}
        </h2>
        <button
          type="button"
          onClick={onSeeAll}
          className="text-xs font-semibold text-orange-600 active:opacity-60"
        >
          Ver todo →
        </button>
      </div>

      <div className="no-scrollbar mt-1.5 flex snap-x snap-mandatory gap-2.5 overflow-x-auto px-4 pb-1">
        {products.map((product) => (
          <div key={product.id} className="w-[calc(50%-0.3125rem)] shrink-0 snap-start">
            <CompactProductCard
              product={product}
              highlighted={product.id === highlightedId}
            />
          </div>
        ))}
      </div>
    </section>
  );
}

// Versión chica de ProductCard, sin descripción ni stepper de cantidad
// completo: así cada fila de categoría ocupa poco alto y la home no se hace
// interminable con varias categorías seguidas.
function CompactProductCard({
  product,
  highlighted,
}: {
  product: Product;
  highlighted?: boolean;
}) {
  const { items, addItem, setQuantity } = useCart();
  const inCart = items.find((item) => item.product.id === product.id);
  const outOfStock = product.stock <= 0;
  const atMaxStock = !!inCart && inCart.quantity >= product.stock;

  return (
    <div
      id={`product-${product.id}`}
      className={`flex flex-col rounded-xl border bg-white p-2 shadow-sm transition ${
        highlighted ? "border-orange-500 ring-2 ring-orange-400" : "border-orange-100"
      }`}
    >
      <div className="relative flex h-20 items-center justify-center overflow-hidden rounded-lg bg-orange-50 text-2xl">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            sizes="45vw"
            className="object-contain p-1"
          />
        ) : (
          product.emoji
        )}
        {outOfStock && (
          <span className="absolute inset-0 flex items-center justify-center rounded-lg bg-white/80 text-[10px] font-semibold text-zinc-500">
            Sin stock
          </span>
        )}
      </div>
      <p className="mt-1.5 line-clamp-1 text-xs font-medium text-zinc-800">{product.name}</p>

      <div className="mt-1 flex items-center justify-between gap-1">
        <span className="text-xs font-bold text-orange-600">{formatPrice(product.salePrice)}</span>
        {inCart ? (
          <div className="flex items-center gap-1 rounded-full bg-gradient-to-r from-orange-600 to-red-500 text-white">
            <button
              type="button"
              onClick={() => setQuantity(product.id, inCart.quantity - 1)}
              className="h-6 w-6 text-sm font-bold active:scale-95"
              aria-label="Quitar uno"
            >
              −
            </button>
            <span className="text-[11px] font-semibold">{inCart.quantity}</span>
            <button
              type="button"
              onClick={() => addItem(product)}
              disabled={atMaxStock}
              className="h-6 w-6 text-sm font-bold active:scale-95 disabled:opacity-40"
              aria-label="Agregar uno"
            >
              +
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => addItem(product)}
            disabled={outOfStock}
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-orange-600 to-red-500 text-sm font-bold text-white active:scale-95 transition disabled:cursor-not-allowed disabled:bg-none disabled:bg-zinc-200 disabled:text-zinc-400"
            aria-label="Agregar"
          >
            +
          </button>
        )}
      </div>
    </div>
  );
}
