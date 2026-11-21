import { HomeClient } from "@/components/HomeClient";
import {
  getActiveBanners,
  getBannerIntervalSeconds,
  getCategorySortOrders,
  getStorefrontProducts,
} from "@/lib/db/queries";

export const dynamic = "force-dynamic";

export default async function Home(props: PageProps<"/">) {
  const [products, banners, bannerIntervalSeconds, categorySortOrders, searchParams] =
    await Promise.all([
      getStorefrontProducts(),
      getActiveBanners(),
      getBannerIntervalSeconds(),
      getCategorySortOrders(),
      props.searchParams,
    ]);

  // Categorías sin orden manual asignado quedan al final, alfabéticas entre
  // sí — así una categoría nueva no se "cuela" antes que las ya ordenadas.
  const sortOrderByCategory = new Map(categorySortOrders.map((c) => [c.category, c.sortOrder]));
  const categories = Array.from(new Set(products.map((p) => p.category))).sort((a, b) => {
    const orderA = sortOrderByCategory.get(a) ?? Infinity;
    const orderB = sortOrderByCategory.get(b) ?? Infinity;
    return orderA !== orderB ? orderA - orderB : a.localeCompare(b);
  });
  const initialCategory =
    typeof searchParams.category === "string" ? searchParams.category : null;
  const initialProductId =
    typeof searchParams.product === "string" ? searchParams.product : null;

  return (
    <HomeClient
      products={products}
      categories={categories}
      banners={banners}
      bannerIntervalSeconds={bannerIntervalSeconds}
      initialCategory={initialCategory}
      initialProductId={initialProductId}
    />
  );
}
