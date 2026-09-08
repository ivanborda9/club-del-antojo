"use client";

import { useActionState, useMemo, useState } from "react";
import { marginPercent } from "@/lib/margin";
import type { ProductFormState } from "@/app/admin/(dashboard)/productos/actions";
import type { ProductRow } from "@/lib/db/schema";

type Props = {
  action: (state: ProductFormState, formData: FormData) => Promise<ProductFormState>;
  product?: ProductRow;
  categories: string[];
};

const initialState: ProductFormState = { error: null };

export function ProductForm({ action, product, categories }: Props) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const [costPrice, setCostPrice] = useState(product?.costPrice ?? 0);
  const [salePrice, setSalePrice] = useState(product?.salePrice ?? 0);

  const margin = useMemo(() => marginPercent(costPrice, salePrice), [costPrice, salePrice]);

  return (
    <form action={formAction} className="max-w-lg space-y-3">
      <Field label="Nombre">
        <input
          name="name"
          required
          defaultValue={product?.name}
          className="input"
          placeholder="Ej: Alfajor Jorgito Blanco"
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Categoría">
          <input
            name="category"
            required
            list="categorias"
            defaultValue={product?.category}
            className="input"
          />
          <datalist id="categorias">
            {categories.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </Field>
        <Field label="Emoji / ícono">
          <input name="emoji" defaultValue={product?.emoji ?? "🛒"} className="input" />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Precio de costo">
          <input
            name="costPrice"
            type="number"
            step="0.01"
            min="0"
            required
            defaultValue={product?.costPrice ?? 0}
            onChange={(e) => setCostPrice(Number(e.target.value) || 0)}
            className="input"
          />
        </Field>
        <Field label="Precio de venta">
          <input
            name="salePrice"
            type="number"
            step="0.01"
            min="0"
            required
            defaultValue={product?.salePrice ?? 0}
            onChange={(e) => setSalePrice(Number(e.target.value) || 0)}
            className="input"
          />
        </Field>
      </div>

      <p className="text-sm text-zinc-600">
        Ganancia sobre el precio de venta:{" "}
        <span
          className={`font-bold ${margin < 0 ? "text-red-600" : "text-emerald-600"}`}
        >
          {margin.toFixed(1)}%
        </span>
      </p>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Stock actual">
          <input
            name="stock"
            type="number"
            step="1"
            min="0"
            required
            defaultValue={product?.stock ?? 0}
            className="input"
          />
        </Field>
        <Field label="Aviso de stock bajo desde">
          <input
            name="lowStockThreshold"
            type="number"
            step="1"
            min="0"
            required
            defaultValue={product?.lowStockThreshold ?? 5}
            className="input"
          />
        </Field>
      </div>

      <label className="flex items-center gap-2 text-sm text-zinc-700">
        <input
          type="checkbox"
          name="active"
          defaultChecked={product?.active ?? true}
          className="h-4 w-4"
        />
        Visible en la tienda
      </label>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="flex h-11 items-center justify-center rounded-full bg-orange-600 px-6 text-sm font-bold text-white disabled:opacity-50"
      >
        {pending ? "Guardando…" : "Guardar producto"}
      </button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-zinc-600">{label}</span>
      {children}
    </label>
  );
}
