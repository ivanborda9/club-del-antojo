"use client";

import { deleteRiderAction } from "@/app/admin/(dashboard)/riders/actions";

export function DeleteRiderButton({ id, name }: { id: string; name: string }) {
  return (
    <form
      action={deleteRiderAction}
      onSubmit={(e) => {
        if (!window.confirm(`¿Eliminar a ${name}? Esta acción no se puede deshacer.`)) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button type="submit" className="text-sm text-red-600">
        Eliminar
      </button>
    </form>
  );
}
