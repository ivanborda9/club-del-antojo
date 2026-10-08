"use client";

import { useState } from "react";

type Props = {
  action: (formData: FormData) => void;
};

export function MarqueeCreateForm({ action }: Props) {
  const [scheduleEnabled, setScheduleEnabled] = useState(false);

  return (
    <form
      action={action}
      className="mt-4 max-w-lg space-y-3 rounded-2xl border border-zinc-200 bg-white p-4"
    >
      <p className="text-sm font-semibold text-zinc-800">Nuevo mensaje</p>
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-zinc-600">Texto</span>
        <input
          name="text"
          required
          className="input"
          placeholder="Ej: 3 cuotas sin interés con todas las tarjetas"
        />
      </label>
      <label className="block max-w-32">
        <span className="mb-1 block text-xs font-medium text-zinc-600">Orden</span>
        <input name="sortOrder" type="number" defaultValue={0} className="input" />
      </label>

      <div className="rounded-2xl border border-orange-100 bg-orange-50/50 p-3">
        <label className="flex items-center gap-2 text-sm font-medium text-zinc-700">
          <input
            type="checkbox"
            name="scheduleEnabled"
            checked={scheduleEnabled}
            onChange={(e) => setScheduleEnabled(e.target.checked)}
            className="h-4 w-4"
          />
          Mostrar solo en un horario
        </label>
        {scheduleEnabled && (
          <div className="mt-3 grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-zinc-600">Desde</span>
              <input
                name="scheduleStart"
                type="time"
                required={scheduleEnabled}
                defaultValue="08:00"
                className="input"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-zinc-600">Hasta</span>
              <input
                name="scheduleEnd"
                type="time"
                required={scheduleEnabled}
                defaultValue="22:00"
                className="input"
              />
            </label>
          </div>
        )}
      </div>

      <button
        type="submit"
        className="h-10 rounded-full bg-orange-600 px-5 text-sm font-bold text-white"
      >
        Agregar mensaje
      </button>
    </form>
  );
}
