import {
  getAllShippingRates,
  getDefaultShippingPrice,
  getStoreOrigin,
} from "@/lib/db/queries";
import { formatPrice } from "@/config/site";
import { StoreOriginForm } from "@/components/admin/StoreOriginForm";
import {
  addShippingRateAction,
  deleteShippingRateAction,
  setDefaultShippingPriceAction,
  updateShippingRateAction,
} from "./actions";

const DAY_LABELS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

export default async function AdminEnviosPage() {
  const [origin, defaultPrice, rates] = await Promise.all([
    getStoreOrigin(),
    getDefaultShippingPrice(),
    getAllShippingRates(),
  ]);

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-extrabold text-zinc-900">Envíos</h1>
      <p className="mt-1 text-sm text-zinc-500">
        El costo de envío se calcula según el día y horario del pedido, y la distancia
        real (en línea recta) desde tu local hasta la dirección del cliente.
      </p>

      <div className="mt-4 rounded-2xl border border-zinc-200 bg-white p-4">
        <p className="text-sm font-semibold text-zinc-800">Ubicación de tu local</p>
        <p className="mt-1 text-xs text-zinc-500">
          {origin.lat !== null
            ? `Ubicada correctamente (${origin.lat.toFixed(5)}, ${origin.lng!.toFixed(5)}).`
            : "Todavía no configurada — sin esto, todos los envíos usan el precio por defecto."}
        </p>
        <div className="mt-2">
          <StoreOriginForm currentAddress={origin.address} />
        </div>
      </div>

      <form
        action={setDefaultShippingPriceAction}
        className="mt-4 flex items-end gap-3 rounded-2xl border border-zinc-200 bg-white p-4"
      >
        <label className="block w-40">
          <span className="mb-1 block text-xs font-medium text-zinc-600">
            Envío por defecto
          </span>
          <input
            name="price"
            type="number"
            step="0.01"
            min="0"
            defaultValue={defaultPrice}
            className="input"
          />
        </label>
        <p className="flex-1 text-xs text-zinc-500">
          Se cobra cuando ninguna regla de abajo coincide (o no se pudo calcular la
          distancia).
        </p>
        <button
          type="submit"
          className="h-10 shrink-0 rounded-full bg-orange-600 px-4 text-sm font-bold text-white"
        >
          Guardar
        </button>
      </form>

      <div className="mt-4 space-y-3">
        <p className="text-sm font-semibold text-zinc-800">Reglas de precio por franja y distancia</p>
        <p className="text-xs text-zinc-500">
          Al pagar, se busca la primera regla activa cuyos días y horario incluyan el
          momento del pedido, y cuya distancia máxima cubra la distancia real — usá el
          campo &quot;Hasta (km)&quot; para armar franjas (ej. 0–3km, 3–6km, 6–999km).
        </p>

        {rates.length === 0 && (
          <p className="rounded-xl bg-zinc-50 px-3 py-2 text-sm text-zinc-500">
            Todavía no cargaste ninguna regla.
          </p>
        )}

        {rates.map((rate) => {
          const activeDays = rate.daysOfWeek.split(",");
          return (
            <form
              key={rate.id}
              action={updateShippingRateAction}
              className="space-y-2 rounded-2xl border border-zinc-200 bg-white p-3"
            >
              <input type="hidden" name="id" value={rate.id} />
              <div className="flex items-center gap-2">
                <input
                  name="label"
                  defaultValue={rate.label}
                  className="input flex-1 text-sm"
                  placeholder="Ej: Centro de día"
                />
                <label className="flex items-center gap-1.5 text-xs text-zinc-600">
                  <input type="checkbox" name="active" defaultChecked={rate.active} className="h-4 w-4" />
                  Activa
                </label>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {DAY_LABELS.map((label, i) => (
                  <label
                    key={i}
                    className="flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-1 text-xs text-zinc-600"
                  >
                    <input
                      type="checkbox"
                      name="day"
                      value={i}
                      defaultChecked={activeDays.includes(String(i))}
                      className="h-3.5 w-3.5"
                    />
                    {label}
                  </label>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-zinc-600">Desde</span>
                  <input
                    name="startTime"
                    type="time"
                    defaultValue={rate.startTime}
                    className="input text-sm"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-zinc-600">Hasta</span>
                  <input
                    name="endTime"
                    type="time"
                    defaultValue={rate.endTime}
                    className="input text-sm"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-zinc-600">
                    Hasta (km)
                  </span>
                  <input
                    name="maxDistanceKm"
                    type="number"
                    step="0.1"
                    min="0"
                    defaultValue={rate.maxDistanceKm}
                    className="input text-sm"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-zinc-600">Precio</span>
                  <input
                    name="price"
                    type="number"
                    step="0.01"
                    min="0"
                    defaultValue={rate.price}
                    className="input text-sm"
                  />
                </label>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  className="h-9 rounded-full bg-zinc-800 px-4 text-xs font-bold text-white"
                >
                  Guardar
                </button>
                <button
                  type="submit"
                  formAction={deleteShippingRateAction}
                  className="text-sm text-red-600"
                >
                  Eliminar
                </button>
              </div>
            </form>
          );
        })}

        <form
          action={addShippingRateAction}
          className="space-y-2 rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-3"
        >
          <p className="text-sm font-semibold text-zinc-800">Nueva regla</p>
          <input name="label" required className="input text-sm" placeholder="Ej: Centro de día" />

          <div className="flex flex-wrap gap-1.5">
            {DAY_LABELS.map((label, i) => (
              <label
                key={i}
                className="flex items-center gap-1 rounded-full bg-white px-2 py-1 text-xs text-zinc-600"
              >
                <input type="checkbox" name="day" value={i} defaultChecked className="h-3.5 w-3.5" />
                {label}
              </label>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-zinc-600">Desde</span>
              <input name="startTime" type="time" required defaultValue="08:00" className="input text-sm" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-zinc-600">Hasta</span>
              <input name="endTime" type="time" required defaultValue="22:00" className="input text-sm" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-zinc-600">Hasta (km)</span>
              <input
                name="maxDistanceKm"
                type="number"
                step="0.1"
                min="0"
                required
                className="input text-sm"
                placeholder="Ej: 3"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-zinc-600">Precio</span>
              <input
                name="price"
                type="number"
                step="0.01"
                min="0"
                required
                className="input text-sm"
              />
            </label>
          </div>

          <label className="flex items-center gap-1.5 text-xs text-zinc-600">
            <input type="checkbox" name="active" defaultChecked className="h-4 w-4" />
            Activa
          </label>

          <button
            type="submit"
            className="h-10 rounded-full bg-orange-600 px-5 text-sm font-bold text-white"
          >
            Agregar regla
          </button>
        </form>
      </div>

      {defaultPrice === 0 && rates.length === 0 && (
        <p className="mt-3 text-xs text-zinc-400">
          Por ahora todos los envíos salen {formatPrice(0)} (sin configurar todavía).
        </p>
      )}
    </div>
  );
}
