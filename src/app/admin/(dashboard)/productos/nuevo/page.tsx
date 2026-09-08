import { getAllProducts } from "@/lib/db/queries";
import { ProductForm } from "@/components/admin/ProductForm";
import { createProductAction } from "../actions";

export default async function NewProductPage() {
  const productList = await getAllProducts();
  const categories = Array.from(new Set(productList.map((p) => p.category)));

  return (
    <div>
      <h1 className="text-lg font-bold text-zinc-800">Nuevo producto</h1>
      <div className="mt-4">
        <ProductForm action={createProductAction} categories={categories} />
      </div>
    </div>
  );
}
