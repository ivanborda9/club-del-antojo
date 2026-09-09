"use client";

import Image from "next/image";
import { useActionState, useMemo, useRef, useState } from "react";
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
  const [imageUrl, setImageUrl] = useState<string | null>(product?.imageUrl ?? null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [scheduleEnabled, setScheduleEnabled] = useState(
    Boolean(product?.scheduleStart && product?.scheduleEnd)
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const margin = useMemo(() => marginPercent(costPrice, salePrice), [costPrice, salePrice]);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "No se pudo subir la imagen.");
      setImageUrl(data.url);
    } catch (err) {
      console.error("Error al subir imagen:", err);
      setUploadError(
        err instanceof Error ? err.message : "No se pudo subir la imagen. Probá con otro archivo."
      );
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <form action={formAction} className="max-w-lg space-y-3">
      <input type="hidden" name="imageUrl" value={imageUrl ?? ""} />

      <Field label="Foto del producto (opcional)">
        <div className="flex items-center gap-3">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-orange-50 text-3xl">
            {imageUrl ? (
              <Image src={imageUrl} alt="" width={64} height={64} className="h-full w-full object-cover" />
            ) : (
              product?.emoji ?? "🛒"
            )}
          </div>
          <div className="flex-1 space-y-1">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleFileChange}
              disabled={uploading}
              className="block w-full text-sm text-zinc-600 file:mr-3 file:rounded-full file:border-0 file:bg-orange-600 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-white"
            />
            {uploading && <p className="text-xs text-zinc-500">Subiendo…</p>}
            {uploadError && <p className="text-xs text-red-600">{uploadError}</p>}
            {imageUrl && !uploading && (
              <button
                type="button"
                onClick={() => setImageUrl(null)}
                className="text-xs text-red-600"
              >
                Quitar imagen
              </button>
            )}
          </div>
        </div>
      </Field>

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
        <Field label="Emoji (si no hay foto)">
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

      <div className="rounded-2xl border border-orange-100 bg-orange-50/50 p-3">
        <label className="flex items-center gap-2 text-sm font-medium text-zinc-700">
          <input
            type="checkbox"
            checked={scheduleEnabled}
            onChange={(e) => setScheduleEnabled(e.target.checked)}
            className="h-4 w-4"
          />
          Restringir a un horario (ej: solo de noche)
        </label>
        {scheduleEnabled && (
          <>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <Field label="Disponible desde">
                <input
                  name="scheduleStart"
                  type="time"
                  required={scheduleEnabled}
                  defaultValue={product?.scheduleStart ?? "22:00"}
                  className="input"
                />
              </Field>
              <Field label="Disponible hasta">
                <input
                  name="scheduleEnd"
                  type="time"
                  required={scheduleEnabled}
                  defaultValue={product?.scheduleEnd ?? "06:00"}
                  className="input"
                />
              </Field>
            </div>
            <p className="mt-2 text-xs text-zinc-500">
              Fuera de este horario, el producto desaparece de la tienda (aunque esté
              &quot;Visible&quot;) y no se puede comprar. Si el horario cruza la
              medianoche (ej: 22:00 a 06:00), se toma como nocturno automáticamente.
            </p>
          </>
        )}
      </div>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending || uploading}
        className="flex h-11 items-center justify-center rounded-full bg-orange-600 px-6 text-sm font-bold text-white disabled:opacity-50"
      >
        {pending ? "Guardando…" : uploading ? "Esperando imagen…" : "Guardar producto"}
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
