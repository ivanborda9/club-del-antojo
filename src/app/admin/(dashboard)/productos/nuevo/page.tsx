import { getAllProducts } from "@/lib/db/queries";
import { ProductForm } from "@/components/admin/ProductForm";
import { createProductAction } from "../actions";

export default async function NewProductPage() {
  const productList = await getAllProducts();
  const categories = Array.from(new Set(productList.map((p) => p.category)));
  const parentCategories = Array.from(
    new Set(productList.map((p) => p.parentCategory).filter((c): c is string => Boolean(c)))
  );

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-zinc-900">Nuevo producto</h1>
      <div className="mt-4">
        <ProductForm
          action={createProductAction}
          categories={categories}
          parentCategories={parentCategories}
        />
      </div>
    </div>
  );
}
