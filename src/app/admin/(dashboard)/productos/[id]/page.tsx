import { notFound } from "next/navigation";
import { getAllProducts, getProductById } from "@/lib/db/queries";
import { ProductForm } from "@/components/admin/ProductForm";
import { updateProductAction } from "../actions";

export default async function EditProductPage(
  props: PageProps<"/admin/productos/[id]">
) {
  const { id } = await props.params;
  const [product, productList] = await Promise.all([
    getProductById(id),
    getAllProducts(),
  ]);

  if (!product) notFound();

  const categories = Array.from(new Set(productList.map((p) => p.category)));
  const action = updateProductAction.bind(null, id);

  return (
    <div>
      <h1 className="text-lg font-bold text-zinc-800">Editar producto</h1>
      <div className="mt-4">
        <ProductForm action={action} product={product} categories={categories} />
      </div>
    </div>
  );
}
