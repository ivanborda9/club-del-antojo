import { getAllBoxSizes } from "@/lib/db/queries";
import { BoxSizeForm } from "@/components/admin/BoxSizeForm";
import { BoxSizeRow } from "@/components/admin/BoxSizeRow";

export default async function AdminBoxPage() {
  const sizes = await getAllBoxSizes();

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-zinc-900">Armá tu Box</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Tamaños disponibles en la tienda, con precio fijo cada uno. La cantidad de
        productos que entran no tiene límite automático — se coordina con el cliente.
      </p>

      <BoxSizeForm />

      <div className="mt-4 space-y-2">
        {sizes.length === 0 && (
          <p className="text-sm text-zinc-500">Todavía no cargaste ningún tamaño.</p>
        )}
        {sizes.map((size) => (
          <BoxSizeRow key={size.id} size={size} />
        ))}
      </div>
    </div>
  );
}
