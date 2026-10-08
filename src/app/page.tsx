import { HomeClient } from "@/components/HomeClient";
import { getActiveBanners, getStorefrontProducts } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

export default async function Home(props: PageProps<"/">) {
  const [products, banners, searchParams] = await Promise.all([
    getStorefrontProducts(),
    getActiveBanners(),
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
      initialCategory={initialCategory}
      initialProductId={initialProductId}
    />
  );
}
