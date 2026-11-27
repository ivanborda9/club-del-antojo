"use client";

import Image from "next/image";
import { useState } from "react";
import { formatPrice } from "@/config/site";
import { useCart } from "@/context/CartContext";
import type { Product } from "@/types";

export function ProductCard({
  product,
  highlighted,
}: {
  product: Product;
  highlighted?: boolean;
}) {
  const { items, addItem, setQuantity } = useCart();
  const variants = product.variants ?? [];
  const hasVariants = variants.length > 0;
  const [selectedVariantId, setSelectedVariantId] = useState<string | undefined>(
    () => variants.find((v) => v.stock > 0)?.id ?? variants[0]?.id
  );
  const selectedVariant = variants.find((v) => v.id === selectedVariantId);

  const inCart = items.find(
    (item) => item.product.id === product.id && item.variantId === (hasVariants ? selectedVariantId : undefined)
  );
  const outOfStock = hasVariants ? variants.every((v) => v.stock <= 0) : product.stock <= 0;
  const unavailable = product.comingSoon || outOfStock;
  const availableStock = hasVariants ? (selectedVariant?.stock ?? 0) : product.stock;
  const atMaxStock = !!inCart && inCart.quantity >= availableStock;

  function handleAdd() {
    addItem(product, hasVariants && selectedVariant ? selectedVariant : undefined);
  }

  return (
    <div
      id={`product-${product.id}`}
      className={`flex flex-col rounded-2xl border bg-white p-3 shadow-sm transition ${
        highlighted
          ? "border-orange-500 ring-2 ring-orange-400"
          : "border-orange-100"
      }`}
    >
      <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-xl bg-orange-50 text-4xl">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 45vw, 200px"
            className="object-contain p-2"
          />
        ) : (
          product.emoji
        )}
        {product.comingSoon ? (
          <span className="absolute inset-0 flex items-center justify-center rounded-xl bg-white/80 text-xs font-semibold text-orange-600">
            Próximamente
          </span>
        ) : (
          outOfStock && (
            <span className="absolute inset-0 flex items-center justify-center rounded-xl bg-white/80 text-xs font-semibold text-zinc-500">
              Sin stock
            </span>
          )
        )}
      </div>
      <p className="mt-2 line-clamp-2 min-h-[2.5rem] text-sm font-medium text-zinc-800">
        {product.name}
      </p>
      {product.description && (
        <p className="mt-0.5 line-clamp-2 text-xs text-zinc-500">{product.description}</p>
      )}
      <p className="mt-1 text-base font-bold text-orange-600">
        {formatPrice(product.salePrice)}
      </p>

      {hasVariants && !unavailable && (
        <select
          value={selectedVariantId}
          onChange={(e) => setSelectedVariantId(e.target.value)}
          className="mt-1.5 h-8 rounded-lg border border-zinc-200 bg-white px-2 text-xs text-zinc-700"
        >
          {variants.map((v) => (
            <option key={v.id} value={v.id} disabled={v.stock <= 0}>
              {v.name}
              {v.stock <= 0 ? " (sin stock)" : ""}
            </option>
          ))}
        </select>
      )}

      {inCart ? (
        <div className="mt-2 flex items-center justify-between rounded-full bg-gradient-to-r from-orange-600 to-red-500 text-white shadow-sm">
          <button
            type="button"
            onClick={() => setQuantity(product.id, inCart.quantity - 1, inCart.variantId)}
            className="h-9 w-9 text-lg font-bold active:scale-95"
            aria-label="Quitar uno"
          >
            −
          </button>
          <span className="text-sm font-semibold">{inCart.quantity}</span>
          <button
            type="button"
            onClick={handleAdd}
            disabled={atMaxStock}
            className="h-9 w-9 text-lg font-bold active:scale-95 disabled:opacity-40"
            aria-label="Agregar uno"
          >
            +
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleAdd}
          disabled={unavailable || (hasVariants && availableStock <= 0)}
          className="mt-2 h-9 rounded-full bg-gradient-to-r from-orange-600 to-red-500 text-sm font-bold text-white shadow-sm active:scale-95 transition disabled:cursor-not-allowed disabled:bg-none disabled:bg-zinc-200 disabled:text-zinc-400 disabled:shadow-none"
        >
          {product.comingSoon ? "Próximamente" : outOfStock ? "Sin stock" : "Agregar"}
        </button>
      )}
    </div>
  );
}
