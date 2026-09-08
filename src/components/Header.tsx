"use client";

import { siteConfig } from "@/config/site";
import { useCart } from "@/context/CartContext";

export function Header({ onCartClick }: { onCartClick: () => void }) {
  const { totalItems } = useCart();

  return (
    <header className="border-b border-orange-100 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
        <div>
          <h1 className="text-lg font-bold text-orange-600">{siteConfig.name}</h1>
          <p className="text-xs text-zinc-500">{siteConfig.tagline}</p>
        </div>
        <button
          type="button"
          onClick={onCartClick}
          className="relative flex h-11 w-11 items-center justify-center rounded-full bg-orange-600 text-white shadow-sm active:scale-95 transition"
          aria-label="Ver carrito"
        >
          🛒
          {totalItems > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[11px] font-semibold text-white">
              {totalItems}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
