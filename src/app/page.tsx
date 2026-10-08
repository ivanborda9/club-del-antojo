import { HomeClient } from "@/components/HomeClient";
import {
  getActiveBanners,
  getActiveMarqueeMessages,
  getStorefrontProducts,
} from "@/lib/db/queries";

export const dynamic = "force-dynamic";

export default async function Home(props: PageProps<"/">) {
  const [products, banners, marqueeMessages, searchParams] = await Promise.all([
    getStorefrontProducts(),
    getActiveBanners(),
    getActiveMarqueeMessages(),
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
      marqueeMessages={marqueeMessages}
      initialCategory={initialCategory}
      initialProductId={initialProductId}
    />
  );
}
