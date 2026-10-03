"use client";

import { useActionState } from "react";
import { createRiderAction, type RiderFormState } from "@/app/admin/(dashboard)/riders/actions";

const initialState: RiderFormState = { error: null };

export function RiderCreateForm() {
  const [state, formAction, pending] = useActionState(createRiderAction, initialState);

  return (
    <form
      action={formAction}
      className="mt-4 max-w-lg space-y-3 rounded-2xl border border-zinc-200 bg-white p-4"
    >
      <p className="text-sm font-semibold text-zinc-800">Nuevo repartidor</p>
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-zinc-600">Nombre</span>
          <input name="name" required className="input" placeholder="Nombre y apellido" />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-zinc-600">Teléfono</span>
          <input name="phone" required className="input" placeholder="341..." />
        </label>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-zinc-600">Usuario</span>
          <input name="username" required className="input" placeholder="sin espacios" />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-zinc-600">Contraseña</span>
          <input
            name="password"
            type="password"
            required
            minLength={6}
            className="input"
            placeholder="mínimo 6 caracteres"
          />
        </label>
      </div>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="h-10 rounded-full bg-orange-600 px-5 text-sm font-bold text-white disabled:opacity-50"
      >
        {pending ? "Creando…" : "Crear repartidor"}
      </button>
    </form>
  );
}
