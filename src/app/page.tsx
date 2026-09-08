"use client";

import { useMemo, useState } from "react";
import { CartBar } from "@/components/CartBar";
import { CartSheet } from "@/components/CartSheet";
import { CategoryTabs } from "@/components/CategoryTabs";
import { Header } from "@/components/Header";
import { ProductGrid } from "@/components/ProductGrid";
import { siteConfig } from "@/config/site";
import { categories, products } from "@/data/products";

export default function Home() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [cartOpen, setCartOpen] = useState(false);

  const visibleProducts = useMemo(
    () =>
      activeCategory
        ? products.filter((product) => product.category === activeCategory)
        : products,
    [activeCategory]
  );

  return (
    <div className="flex flex-1 flex-col pb-28">
      <Header onCartClick={() => setCartOpen(true)} />
      <CategoryTabs
        categories={categories}
        active={activeCategory}
        onSelect={setActiveCategory}
      />

      <p className="px-4 pt-3 text-xs text-zinc-500">
        🚚 {siteConfig.deliveryNote}
      </p>

      <main className="mx-auto w-full max-w-3xl flex-1">
        <ProductGrid products={visibleProducts} />
      </main>

      <CartBar onClick={() => setCartOpen(true)} />
      <CartSheet open={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  );
}
