"use client";

import { useState } from "react";
import {
  clearCategoryScheduleAction,
  setCategoryScheduleAction,
} from "@/app/admin/(dashboard)/productos/actions";

type Props = {
  category: string;
  scheduleStart: string | null;
  scheduleEnd: string | null;
};

export function CategoryScheduleControl({ category, scheduleStart, scheduleEnd }: Props) {
  const [open, setOpen] = useState(false);
  const hasSchedule = Boolean(scheduleStart && scheduleEnd);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
          hasSchedule ? "bg-amber-100 text-amber-700" : "bg-zinc-100 text-zinc-500"
        }`}
      >
        ⏰ {hasSchedule ? `${scheduleStart}–${scheduleEnd}` : "Horario"}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-20 mt-2 w-64 rounded-2xl border border-zinc-200 bg-white p-3 shadow-lg">
          <p className="text-xs font-semibold text-zinc-700">
            Restringir &quot;{category}&quot; a un horario
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            Fuera de ese horario, toda la categoría desaparece de la tienda (sin
            rastro, ni siquiera la pestaña).
          </p>
          <form action={setCategoryScheduleAction} className="mt-2 space-y-2">
            <input type="hidden" name="category" value={category} />
            <div className="grid grid-cols-2 gap-2">
              <label className="block">
                <span className="mb-1 block text-[11px] text-zinc-500">Desde</span>
                <input
                  type="time"
                  name="scheduleStart"
                  required
                  defaultValue={scheduleStart ?? "20:00"}
                  className="input text-sm"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-[11px] text-zinc-500">Hasta</span>
                <input
                  type="time"
                  name="scheduleEnd"
                  required
                  defaultValue={scheduleEnd ?? "08:00"}
                  className="input text-sm"
                />
              </label>
            </div>
            <button
              type="submit"
              className="h-9 w-full rounded-full bg-orange-600 text-xs font-bold text-white"
            >
              Guardar
            </button>
          </form>
          {hasSchedule && (
            <form action={clearCategoryScheduleAction} className="mt-2">
              <input type="hidden" name="category" value={category} />
              <button type="submit" className="w-full text-center text-xs text-red-600">
                Quitar restricción (disponible todo el día)
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
