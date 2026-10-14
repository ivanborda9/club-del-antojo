import { getAllBoxSizes } from "@/lib/db/queries";
import { formatPrice } from "@/config/site";
import { createBoxSizeAction, deleteBoxSizeAction, toggleBoxSizeAction } from "./actions";

export default async function AdminBoxPage() {
  const sizes = await getAllBoxSizes();

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-zinc-900">Armá tu Box</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Tamaños disponibles en la tienda, con precio fijo cada uno. La cantidad de
        productos que entran no tiene límite automático — se coordina con el cliente.
      </p>

      <form
        action={createBoxSizeAction}
        className="mt-4 max-w-sm space-y-3 rounded-2xl border border-zinc-200 bg-white p-4"
      >
        <p className="text-sm font-semibold text-zinc-800">Nuevo tamaño</p>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-zinc-600">Nombre</span>
          <input name="name" required className="input" placeholder="Ej: Chica" />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-zinc-600">Precio</span>
          <input name="price" type="number" step="0.01" min="0" required className="input" />
        </label>
        <label className="block max-w-32">
          <span className="mb-1 block text-xs font-medium text-zinc-600">Orden</span>
          <input name="sortOrder" type="number" defaultValue={0} className="input" />
        </label>
        <button
          type="submit"
          className="h-10 rounded-full bg-orange-600 px-5 text-sm font-bold text-white"
        >
          Agregar tamaño
        </button>
      </form>

      <div className="mt-4 space-y-2">
        {sizes.length === 0 && (
          <p className="text-sm text-zinc-500">Todavía no cargaste ningún tamaño.</p>
        )}
        {sizes.map((size) => (
          <div
            key={size.id}
            className="flex items-center justify-between rounded-2xl border border-zinc-200 bg-white p-3"
          >
            <div>
              <p className="text-sm font-semibold text-zinc-800">{size.name}</p>
              <p className="text-sm text-orange-600">{formatPrice(size.price)}</p>
            </div>
            <div className="flex items-center gap-2">
              <form action={toggleBoxSizeAction}>
                <input type="hidden" name="id" value={size.id} />
                <input type="hidden" name="name" value={size.name} />
                <input type="hidden" name="price" value={size.price} />
                <input type="hidden" name="sortOrder" value={size.sortOrder} />
                <input type="hidden" name="active" value={(!size.active).toString()} />
                <button
                  type="submit"
                  className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                    size.active
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-zinc-100 text-zinc-500"
                  }`}
                >
                  {size.active ? "Activo" : "Oculto"}
                </button>
              </form>
              <form action={deleteBoxSizeAction}>
                <input type="hidden" name="id" value={size.id} />
                <button type="submit" className="text-sm text-red-600">
                  Eliminar
                </button>
              </form>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
