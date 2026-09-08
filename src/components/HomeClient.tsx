"use client";

import { useMemo, useState } from "react";
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
};

export function HomeClient({ products, categories, banners }: Props) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [cartOpen, setCartOpen] = useState(false);

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
        <ProductGrid products={visibleProducts} />
      </main>

      <CartBar onClick={() => setCartOpen(true)} />
      <CartSheet open={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  );
}
