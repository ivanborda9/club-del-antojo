"use client";

import { formatPrice } from "@/config/site";
import { useCart } from "@/context/CartContext";

export function CartBar({ onClick }: { onClick: () => void }) {
  const { totalItems, totalPrice } = useCart();

  if (totalItems === 0) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 px-4 pb-4">
      <button
        type="button"
        onClick={onClick}
        className="mx-auto flex w-full max-w-3xl items-center justify-between rounded-2xl bg-orange-600 px-4 py-3 text-white shadow-lg active:scale-[0.98] transition"
      >
        <span className="text-sm font-semibold">
          {totalItems} {totalItems === 1 ? "producto" : "productos"}
        </span>
        <span className="text-sm font-bold">Ver pedido · {formatPrice(totalPrice)}</span>
      </button>
    </div>
  );
}
