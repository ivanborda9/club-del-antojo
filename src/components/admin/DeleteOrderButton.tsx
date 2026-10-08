"use client";

import { deleteOrderAction } from "@/app/admin/(dashboard)/pedidos/actions";

export function DeleteOrderButton({ id, customerName }: { id: string; customerName: string }) {
  return (
    <form
      action={deleteOrderAction}
      onSubmit={(e) => {
        if (
          !window.confirm(
            `¿Eliminar el pedido de "${customerName}"? Esta acción no se puede deshacer.`
          )
        ) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        className="flex h-10 w-full items-center justify-center gap-2 rounded-full border border-red-200 text-sm font-semibold text-red-600"
      >
        🗑️ Eliminar pedido
      </button>
    </form>
  );
}
