"use client";

import { siteConfig } from "@/config/site";
import { useCart } from "@/context/CartContext";

export function Header({ onCartClick }: { onCartClick: () => void }) {
  const { totalItems } = useCart();

  return (
    <header className="bg-gradient-to-r from-orange-600 via-red-500 to-pink-500 shadow-sm">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3.5">
        <div>
          <h1 className="text-lg font-extrabold tracking-tight text-white drop-shadow-sm">
            {siteConfig.name}
          </h1>
          <p className="text-xs text-orange-50">{siteConfig.tagline}</p>
        </div>
        <button
          type="button"
          onClick={onCartClick}
          className="relative flex h-11 w-11 items-center justify-center rounded-full bg-white text-xl text-orange-600 shadow-md active:scale-95 transition"
          aria-label="Ver carrito"
        >
          🛒
          {totalItems > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-500 px-1 text-[11px] font-bold text-white ring-2 ring-white">
              {totalItems}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
