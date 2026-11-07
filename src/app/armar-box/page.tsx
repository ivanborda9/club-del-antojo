import { ArmarBoxClient } from "@/components/ArmarBoxClient";
import { getActiveBoxSizes, getBoxEligibleProducts } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

export default async function ArmarBoxPage() {
  const [sizes, products] = await Promise.all([getActiveBoxSizes(), getBoxEligibleProducts()]);

  return <ArmarBoxClient sizes={sizes} products={products} />;
}
