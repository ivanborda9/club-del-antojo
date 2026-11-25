"use client";

import { useActionState } from "react";
import { setStoreOriginAction, type StoreOriginFormState } from "@/app/admin/(dashboard)/envios/actions";

const initialState: StoreOriginFormState = { error: null, success: false };

export function StoreOriginForm({ currentAddress }: { currentAddress: string | null }) {
  const [state, formAction, pending] = useActionState(setStoreOriginAction, initialState);

  return (
    <form action={formAction} className="space-y-2">
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-zinc-600">
          Dirección de tu local (punto de partida para calcular distancias)
        </span>
        <input
          name="address"
          required
          defaultValue={currentAddress ?? ""}
          className="input"
          placeholder="Calle, número, ciudad"
        />
      </label>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state.success && (
        <p className="text-sm text-emerald-600">Ubicación guardada correctamente.</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="h-10 rounded-full bg-orange-600 px-5 text-sm font-bold text-white disabled:opacity-50"
      >
        {pending ? "Ubicando…" : "Guardar ubicación"}
      </button>
    </form>
  );
}
