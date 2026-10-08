import { getAllMarqueeMessages } from "@/lib/db/queries";
import { MarqueeCreateForm } from "@/components/admin/MarqueeCreateForm";
import {
  createMarqueeMessageAction,
  deleteMarqueeMessageAction,
  toggleMarqueeMessageAction,
} from "./actions";

export default async function AdminCarruselPage() {
  const messageList = await getAllMarqueeMessages();

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-zinc-900">Carrusel de texto</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Se desliza sin parar arriba de todo en la tienda (ej. &quot;3 cuotas sin interés&quot;).
        Si hay varios mensajes activos, se muestran todos seguidos.
      </p>

      <MarqueeCreateForm action={createMarqueeMessageAction} />

      <div className="mt-4 space-y-2">
        {messageList.length === 0 && (
          <p className="text-sm text-zinc-500">Todavía no cargaste ningún mensaje.</p>
        )}
        {messageList.map((m) => (
          <div
            key={m.id}
            className="flex items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-white p-3"
          >
            <div>
              <p className="text-sm font-semibold text-zinc-800">{m.text}</p>
              {m.scheduleStart && m.scheduleEnd && (
                <span className="mt-1 inline-block rounded-full bg-amber-50 px-2 py-0.5 text-[11px] text-amber-700">
                  ⏰ {m.scheduleStart}–{m.scheduleEnd}
                </span>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <form action={toggleMarqueeMessageAction}>
                <input type="hidden" name="id" value={m.id} />
                <input type="hidden" name="text" value={m.text} />
                <input type="hidden" name="sortOrder" value={m.sortOrder} />
                <input type="hidden" name="active" value={(!m.active).toString()} />
                <input type="hidden" name="scheduleStart" value={m.scheduleStart ?? ""} />
                <input type="hidden" name="scheduleEnd" value={m.scheduleEnd ?? ""} />
                <button
                  type="submit"
                  className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                    m.active
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-zinc-100 text-zinc-500"
                  }`}
                >
                  {m.active ? "Activo" : "Oculto"}
                </button>
              </form>
              <form action={deleteMarqueeMessageAction}>
                <input type="hidden" name="id" value={m.id} />
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
