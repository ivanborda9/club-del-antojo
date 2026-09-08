"use client";

import Link from "next/link";
import { formatPrice } from "@/config/site";
import { useCart } from "@/context/CartContext";

export function CartSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { items, setQuantity, removeItem, totalPrice } = useCart();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center">
      <button
        type="button"
        aria-label="Cerrar carrito"
        onClick={onClose}
        className="absolute inset-0 bg-black/40"
      />
      <div className="safe-bottom relative z-10 flex max-h-[85vh] w-full max-w-3xl flex-col rounded-t-3xl bg-white p-4 shadow-xl">
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-zinc-200" />
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-zinc-800">Tu pedido</h2>
          <button
            type="button"
            onClick={onClose}
            className="-mr-2 px-2 py-2 text-sm font-medium text-zinc-500"
          >
            Cerrar
          </button>
        </div>

        {items.length === 0 ? (
          <p className="py-10 text-center text-sm text-zinc-500">
            Todavía no agregaste productos.
          </p>
        ) : (
          <>
            <div className="mt-3 flex-1 space-y-3 overflow-y-auto">
              {items.map(({ product, quantity }) => (
                <div key={product.id} className="flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-2xl">
                    {product.emoji}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-zinc-800">
                      {product.name}
                    </p>
                    <p className="text-sm text-orange-600">
                      {formatPrice(product.salePrice * quantity)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setQuantity(product.id, quantity - 1)}
                      className="h-9 w-9 shrink-0 rounded-full border border-orange-200 text-sm font-bold text-orange-600 active:scale-95"
                      aria-label="Quitar uno"
                    >
                      −
                    </button>
                    <span className="w-5 text-center text-sm font-semibold">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity(product.id, quantity + 1)}
                      className="h-9 w-9 shrink-0 rounded-full border border-orange-200 text-sm font-bold text-orange-600 active:scale-95"
                      aria-label="Agregar uno"
                    >
                      +
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(product.id)}
                    className="flex h-9 w-9 shrink-0 items-center justify-center text-base text-zinc-400"
                    aria-label={`Quitar ${product.name} del carrito`}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-4 border-t border-orange-100 pt-3">
              <div className="flex items-center justify-between text-base font-bold text-zinc-800">
                <span>Total</span>
                <span>{formatPrice(totalPrice)}</span>
              </div>
              <Link
                href="/checkout"
                onClick={onClose}
                className="mt-3 flex h-12 w-full items-center justify-center rounded-full bg-orange-600 text-sm font-bold text-white active:scale-[0.98] transition"
              >
                Continuar con el pedido
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
