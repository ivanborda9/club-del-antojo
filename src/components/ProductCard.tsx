"use client";

import { formatPrice } from "@/config/site";
import { useCart } from "@/context/CartContext";
import type { Product } from "@/types";

export function ProductCard({ product }: { product: Product }) {
  const { items, addItem, setQuantity } = useCart();
  const inCart = items.find((item) => item.product.id === product.id);

  return (
    <div className="flex flex-col rounded-2xl border border-orange-100 bg-white p-3 shadow-sm">
      <div className="flex h-20 items-center justify-center rounded-xl bg-orange-50 text-4xl">
        {product.emoji}
      </div>
      <p className="mt-2 line-clamp-2 min-h-[2.5rem] text-sm font-medium text-zinc-800">
        {product.name}
      </p>
      <p className="mt-1 text-base font-bold text-orange-600">
        {formatPrice(product.price)}
      </p>

      {inCart ? (
        <div className="mt-2 flex items-center justify-between rounded-full bg-orange-600 text-white">
          <button
            type="button"
            onClick={() => setQuantity(product.id, inCart.quantity - 1)}
            className="h-9 w-9 text-lg font-bold active:scale-95"
            aria-label="Quitar uno"
          >
            −
          </button>
          <span className="text-sm font-semibold">{inCart.quantity}</span>
          <button
            type="button"
            onClick={() => addItem(product)}
            className="h-9 w-9 text-lg font-bold active:scale-95"
            aria-label="Agregar uno"
          >
            +
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => addItem(product)}
          className="mt-2 h-9 rounded-full border border-orange-600 text-sm font-semibold text-orange-600 active:scale-95 transition"
        >
          Agregar
        </button>
      )}
    </div>
  );
}
