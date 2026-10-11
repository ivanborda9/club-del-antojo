"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Banners } from "@/components/Banners";
import { CartBar } from "@/components/CartBar";
import { CartSheet } from "@/components/CartSheet";
import { CategoryTabs } from "@/components/CategoryTabs";
import { Header } from "@/components/Header";
import { ProductGrid } from "@/components/ProductGrid";
import { siteConfig } from "@/config/site";
import type { BannerRow } from "@/lib/db/schema";
import type { Product } from "@/types";

type Props = {
  products: Product[];
  categories: string[];
  banners: BannerRow[];
  initialCategory: string | null;
  initialProductId: string | null;
};

export function HomeClient({
  products,
  categories,
  banners,
  initialCategory,
  initialProductId,
}: Props) {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState<string | null>(
    initialCategory && categories.includes(initialCategory) ? initialCategory : null
  );
  const [cartOpen, setCartOpen] = useState(false);
  const [highlightedId, setHighlightedId] = useState<string | null>(initialProductId);

  // useState solo toma el valor inicial en el primer montaje: si ya estabas
  // en la home y tocás un banner (navegación del lado del cliente, sin
  // remontar el componente), hay que "adoptar" el nuevo category/product acá
  // — durante el render, como recomienda React para este caso, en vez de un
  // efecto (evita un paso de render de más y no dispara el lint de
  // "setState en efecto").
  const [appliedSignal, setAppliedSignal] = useState(
    `${initialCategory ?? ""}|${initialProductId ?? ""}`
  );
  const signal = `${initialCategory ?? ""}|${initialProductId ?? ""}`;
  if (signal !== appliedSignal) {
    setAppliedSignal(signal);
    if (initialCategory && categories.includes(initialCategory)) {
      setActiveCategory(initialCategory);
    }
    if (initialProductId) {
      setActiveCategory(null); // aseguramos que el producto esté visible, sea cual sea su categoría
      setHighlightedId(initialProductId);
    }
  }

  // Scroll + apagado del resaltado + limpiar el "?product=" / "?category="
  // de la URL — efectos de verdad (DOM, navegación, timers), no estado.
  useEffect(() => {
    if (!highlightedId) return;
    const scrollTimer = setTimeout(() => {
      document
        .getElementById(`product-${highlightedId}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 50);
    const clearTimer = setTimeout(() => setHighlightedId(null), 3000);
    return () => {
      clearTimeout(scrollTimer);
      clearTimeout(clearTimer);
    };
  }, [highlightedId]);

  useEffect(() => {
    if (initialCategory || initialProductId) {
      router.replace("/", { scroll: false });
    }
    // Solo nos interesa la primera vez que aparece cada valor (lo hace el
    // signal de arriba); no relanzar por cambios de router.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appliedSignal]);

  const visibleProducts = useMemo(
    () =>
      activeCategory
        ? products.filter((product) => product.category === activeCategory)
        : products,
    [products, activeCategory]
  );

  return (
    <div className="flex flex-1 flex-col pb-28">
      <div className="sticky top-0 z-30">
        <Header onCartClick={() => setCartOpen(true)} />
        <CategoryTabs
          categories={categories}
          active={activeCategory}
          onSelect={setActiveCategory}
        />
      </div>

      <Banners banners={banners} />

      <p className="px-4 pt-3 text-xs text-zinc-500">
        🚚 {siteConfig.deliveryNote}
      </p>

      <main className="mx-auto w-full max-w-3xl flex-1">
        <ProductGrid products={visibleProducts} highlightedId={highlightedId} />
      </main>

      <footer className="flex items-center justify-center gap-4 px-4 py-6 text-center">
        <Link href="/admin" className="text-xs text-zinc-400 underline underline-offset-2">
          Admin
        </Link>
        <Link href="/rider" className="text-xs text-zinc-400 underline underline-offset-2">
          Repartidores
        </Link>
      </footer>

      <CartBar onClick={() => setCartOpen(true)} />
      <CartSheet open={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  );
}
