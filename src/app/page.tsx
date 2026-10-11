import { HomeClient } from "@/components/HomeClient";
import { getActiveBanners, getBannerIntervalSeconds, getStorefrontProducts } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

export default async function Home(props: PageProps<"/">) {
  const [products, banners, bannerIntervalSeconds, searchParams] = await Promise.all([
    getStorefrontProducts(),
    getActiveBanners(),
    getBannerIntervalSeconds(),
    props.searchParams,
  ]);

  const categories = Array.from(new Set(products.map((p) => p.category)));
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
