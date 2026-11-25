import { getAllBusinessHours, getStoreOverride, isStoreOpenNow } from "@/lib/db/queries";
import {
  addBusinessHourAction,
  deleteBusinessHourAction,
  setStoreOverrideAction,
} from "./actions";

const DAY_LABELS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

export default async function AdminHorariosPage() {
  const [hours, override, open] = await Promise.all([
    getAllBusinessHours(),
    getStoreOverride(),
    isStoreOpenNow(),
  ]);

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-extrabold text-zinc-900">Horarios de atención</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Mientras la tienda está cerrada, los clientes pueden seguir viendo todo el
        sitio pero no pueden finalizar la compra.
      </p>

      <div
        className={`mt-4 rounded-2xl p-4 text-center text-sm font-extrabold text-white ${
          open ? "bg-emerald-500" : "bg-zinc-800"
        }`}
      >
        {open ? "🟢 Ahora mismo: ABIERTO" : "🔴 Ahora mismo: CERRADO"}
      </div>

      <form
        action={setStoreOverrideAction}
        className="mt-4 space-y-2 rounded-2xl border border-zinc-200 bg-white p-4"
      >
        <p className="text-sm font-semibold text-zinc-800">Forzar manualmente</p>
        <p className="text-xs text-zinc-500">
          Por defecto sigue el horario automático de abajo. Usalo para abrir fuera de
          horario o cerrar antes (ej. un feriado).
        </p>
        <div className="flex flex-wrap gap-2">
          {[
            { value: "", label: "Automático (según horario)" },
            { value: "open", label: "Forzar abierto" },
            { value: "closed", label: "Forzar cerrado" },
          ].map((opt) => (
            <label
              key={opt.value}
              className={`flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${
                override === opt.value
                  ? "border-orange-600 bg-orange-50 text-orange-700"
                  : "border-zinc-200 text-zinc-600"
              }`}
            >
              <input
                type="radio"
                name="override"
                value={opt.value}
                defaultChecked={override === opt.value}
                className="h-3.5 w-3.5"
              />
              {opt.label}
            </label>
          ))}
        </div>
        <button
          type="submit"
          className="h-10 rounded-full bg-orange-600 px-5 text-sm font-bold text-white"
        >
          Guardar
        </button>
      </form>

      <div className="mt-4 space-y-3">
        <p className="text-sm font-semibold text-zinc-800">Horario automático</p>
        <p className="text-xs text-zinc-500">
          Se considera abierta si el momento actual cae en alguna de estas franjas. Sin
          ninguna cargada, se considera siempre abierta.
        </p>

        {hours.length === 0 && (
          <p className="rounded-xl bg-zinc-50 px-3 py-2 text-sm text-zinc-500">
            Todavía no cargaste ningún horario.
          </p>
        )}

        {hours.map((hour) => {
          const activeDays = hour.daysOfWeek.split(",");
          return (
            <div
              key={hour.id}
              className="flex items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-white p-3"
            >
              <div>
                <p className="text-sm font-semibold text-zinc-800">
                  {activeDays
                    .map(Number)
                    .sort((a, b) => a - b)
                    .map((d) => DAY_LABELS[d])
                    .join(", ")}
                </p>
                <p className="text-xs text-zinc-500">
                  {hour.startTime} a {hour.endTime}
                </p>
              </div>
              <form action={deleteBusinessHourAction}>
                <input type="hidden" name="id" value={hour.id} />
                <button type="submit" className="text-sm text-red-600">
                  Eliminar
                </button>
              </form>
            </div>
          );
        })}

        <form
          action={addBusinessHourAction}
          className="space-y-2 rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-3"
        >
          <p className="text-sm font-semibold text-zinc-800">Nueva franja</p>
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
          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-zinc-600">Desde</span>
              <input name="startTime" type="time" required defaultValue="09:00" className="input text-sm" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-zinc-600">Hasta</span>
              <input name="endTime" type="time" required defaultValue="22:00" className="input text-sm" />
            </label>
          </div>
          <button
            type="submit"
            className="h-10 rounded-full bg-orange-600 px-5 text-sm font-bold text-white"
          >
            Agregar franja
          </button>
        </form>
      </div>
    </div>
  );
}
