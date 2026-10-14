import { ArmarBoxClient } from "@/components/ArmarBoxClient";
import { getActiveBoxSizes, getStorefrontProducts } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

export default async function ArmarBoxPage() {
  const [sizes, products] = await Promise.all([getActiveBoxSizes(), getStorefrontProducts()]);

  return <ArmarBoxClient sizes={sizes} products={products} />;
}
