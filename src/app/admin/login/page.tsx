"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "./actions";

const initialState: LoginState = { error: null };

export default function AdminLoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-sm flex-col justify-center px-6">
      <h1 className="text-xl font-bold text-zinc-800">Panel de administración</h1>
      <p className="mt-1 text-sm text-zinc-500">Club del Antojo</p>

      <form action={formAction} className="mt-6 space-y-3">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-zinc-600">
            Contraseña
          </span>
          <input
            type="password"
            name="password"
            required
            autoFocus
            className="input"
          />
        </label>

        {state.error && <p className="text-sm text-red-600">{state.error}</p>}

        <button
          type="submit"
          disabled={pending}
          className="flex h-11 w-full items-center justify-center rounded-full bg-orange-600 text-sm font-bold text-white disabled:opacity-50"
        >
          {pending ? "Ingresando…" : "Ingresar"}
        </button>
      </form>
    </div>
  );
}
