import { HomeClient } from "@/components/HomeClient";
import { getActiveBanners, getStorefrontProducts } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [products, banners] = await Promise.all([
    getStorefrontProducts(),
    getActiveBanners(),
  ]);

  const categories = Array.from(new Set(products.map((p) => p.category)));

  return <HomeClient products={products} categories={categories} banners={banners} />;
}
