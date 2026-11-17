"use client";

import { useState } from "react";
import {
  addProductVariantAction,
  deleteProductVariantAction,
  updateProductVariantStockAction,
} from "@/app/admin/(dashboard)/productos/actions";
import type { ProductVariantRow } from "@/lib/db/schema";

type Props = {
  productId: string;
  variants: ProductVariantRow[];
};

export function ProductVariantsControl({ productId, variants }: Props) {
  const [name, setName] = useState("");

  return (
    <div className="rounded-2xl border border-orange-100 bg-orange-50/50 p-3">
      <p className="text-sm font-semibold text-zinc-800">Variedades para elegir</p>
      <p className="mt-1 text-xs text-zinc-500">
        Para productos como un combo donde el cliente tiene que elegir una opción (ej.
        sabor de pizza especial). Si cargás variedades acá, la disponibilidad depende
        del stock de cada una — el campo &quot;Stock actual&quot; de arriba deja de
        usarse para este producto.
      </p>

      {variants.length > 0 && (
        <ul className="mt-3 space-y-2">
          {variants.map((variant) => (
            <li
              key={variant.id}
              className="flex items-center gap-2 rounded-xl border border-orange-100 bg-white p-2"
            >
              <span className="flex-1 text-sm font-medium text-zinc-800">{variant.name}</span>
              <form action={updateProductVariantStockAction} className="flex items-center gap-1">
                <input type="hidden" name="id" value={variant.id} />
                <input type="hidden" name="productId" value={productId} />
                <input
                  name="stock"
                  type="number"
                  step="1"
                  min="0"
                  defaultValue={variant.stock}
                  className="input h-8 w-20 text-sm"
                />
                <button
                  type="submit"
                  className="h-8 rounded-full bg-zinc-800 px-3 text-xs font-bold text-white"
                >
                  Guardar
                </button>
              </form>
              <form action={deleteProductVariantAction}>
                <input type="hidden" name="id" value={variant.id} />
                <input type="hidden" name="productId" value={productId} />
                <button type="submit" className="px-1 text-sm text-red-600">
                  Eliminar
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}

      <form
        action={addProductVariantAction}
        onSubmit={() => setName("")}
        className="mt-3 flex items-end gap-2"
      >
        <input type="hidden" name="productId" value={productId} />
        <label className="flex-1 block">
          <span className="mb-1 block text-xs font-medium text-zinc-600">Nueva variedad</span>
          <input
            name="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input"
            placeholder="Ej: Napolitana"
          />
        </label>
        <label className="block w-20">
          <span className="mb-1 block text-xs font-medium text-zinc-600">Stock</span>
          <input name="stock" type="number" step="1" min="0" defaultValue={0} className="input" />
        </label>
        <button
          type="submit"
          className="h-10 shrink-0 rounded-full bg-orange-600 px-4 text-xs font-bold text-white"
        >
          Agregar
        </button>
      </form>
    </div>
  );
}
