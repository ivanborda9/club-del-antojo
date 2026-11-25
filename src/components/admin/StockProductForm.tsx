"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { createSimpleProductAction } from "@/app/admin/(dashboard)/stock/actions";

type Props = {
  categories: string[];
  parentCategories: string[];
};

// Alta simplificada de producto para el rol "staff": sin precio de costo
// ni margen (eso queda para el dueño/a desde Productos).
export function StockProductForm({ categories, parentCategories }: Props) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      setUploadError(
        err instanceof Error ? err.message : "No se pudo subir la imagen. Probá con otro archivo."
      );
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <form action={createSimpleProductAction} className="max-w-lg space-y-3">
      <input type="hidden" name="imageUrl" value={imageUrl ?? ""} />

      <label className="block">
        <span className="mb-1 block text-xs font-medium text-zinc-600">
          Foto del producto (opcional)
        </span>
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-orange-50 text-2xl">
            {imageUrl ? (
              <Image src={imageUrl} alt="" width={56} height={56} className="h-full w-full object-contain p-1" />
            ) : (
              "🛒"
            )}
          </div>
          <div className="flex-1 space-y-1">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              disabled={uploading}
              className="block w-full text-sm text-zinc-600 file:mr-3 file:rounded-full file:border-0 file:bg-orange-600 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-white"
            />
            {uploading && <p className="text-xs text-zinc-500">Subiendo…</p>}
            {uploadError && <p className="text-xs text-red-600">{uploadError}</p>}
            {imageUrl && !uploading && (
              <button type="button" onClick={() => setImageUrl(null)} className="text-xs text-red-600">
                Quitar imagen
              </button>
            )}
          </div>
        </div>
      </label>

      <label className="block">
        <span className="mb-1 block text-xs font-medium text-zinc-600">Nombre</span>
        <input name="name" required className="input" placeholder="Ej: Alfajor Jorgito Blanco" />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-zinc-600">
            Categoría padre (opcional)
          </span>
          <input name="parentCategory" list="categorias-padre" className="input" placeholder="Ej: Kiosco" />
          <datalist id="categorias-padre">
            {parentCategories.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-zinc-600">Categoría</span>
          <input name="category" required list="categorias" className="input" />
          <datalist id="categorias">
            {categories.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </label>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-zinc-600">Emoji (si no hay foto)</span>
          <input name="emoji" defaultValue="🛒" className="input" />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-zinc-600">Precio de venta</span>
          <input name="salePrice" type="number" step="0.01" min="0" required className="input" />
        </label>
      </div>

      <label className="block max-w-32">
        <span className="mb-1 block text-xs font-medium text-zinc-600">Stock inicial</span>
        <input name="stock" type="number" step="1" min="0" required defaultValue={0} className="input" />
      </label>

      <button
        type="submit"
        disabled={uploading}
        className="flex h-11 items-center justify-center rounded-full bg-orange-600 px-6 text-sm font-bold text-white disabled:opacity-50"
      >
        {uploading ? "Esperando imagen…" : "Agregar producto"}
      </button>
    </form>
  );
}
