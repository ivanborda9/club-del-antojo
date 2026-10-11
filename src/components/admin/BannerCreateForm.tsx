"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import type { ProductRow } from "@/lib/db/schema";

type Props = {
  action: (formData: FormData) => void;
  products: ProductRow[];
  categories: string[];
};

export function BannerCreateForm({ action, products, categories }: Props) {
  const [linkType, setLinkType] = useState<"" | "product" | "category">("");
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
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
    <form
      action={action}
      className="mt-4 max-w-lg space-y-3 rounded-2xl border border-zinc-200 bg-white p-4"
    >
      <p className="text-sm font-semibold text-zinc-800">Nuevo banner</p>
      <input type="hidden" name="imageUrl" value={imageUrl ?? ""} />

      <div>
        <span className="mb-1 block text-xs font-medium text-zinc-600">
          Imagen del banner (opcional)
        </span>
        <div className="flex items-center gap-3">
          <div className="flex h-16 w-28 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-orange-50 text-3xl">
            {imageUrl ? (
              <Image src={imageUrl} alt="" width={112} height={64} className="h-full w-full object-cover" />
            ) : (
              "🖼️"
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
              <button type="button" onClick={() => setImageUrl(null)} className="text-xs text-red-600">
                Quitar imagen
              </button>
            )}
            {!imageUrl && (
              <p className="text-xs text-zinc-400">Sin imagen se muestra la tarjeta con emoji y texto.</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-[1fr_auto] gap-3">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-zinc-600">Título</span>
          <input name="title" required className="input" placeholder="2x1 en golosinas" />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-zinc-600">Emoji</span>
          <input name="emoji" defaultValue="🎉" className="input w-16 text-center" />
        </label>
      </div>
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-zinc-600">
          Subtítulo (opcional)
        </span>
        <input name="subtitle" className="input" placeholder="Válido hasta el domingo" />
      </label>
      <label className="block max-w-32">
        <span className="mb-1 block text-xs font-medium text-zinc-600">Orden</span>
        <input name="sortOrder" type="number" defaultValue={0} className="input" />
      </label>

      <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-3">
        <span className="mb-1 block text-xs font-medium text-zinc-700">
          Al tocarlo, llevar a…
        </span>
        <select
          name="linkType"
          value={linkType}
          onChange={(e) => setLinkType(e.target.value as typeof linkType)}
          className="input"
        >
          <option value="">Ningún lado (solo informativo)</option>
          <option value="product">Un producto</option>
          <option value="category">Una categoría</option>
        </select>

        {linkType === "product" && (
          <select name="linkProductId" required className="input mt-2">
            <option value="">Elegí un producto…</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.emoji} {p.name}
              </option>
            ))}
          </select>
        )}

        {linkType === "category" && (
          <select name="linkCategory" required className="input mt-2">
            <option value="">Elegí una categoría…</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        )}
      </div>

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
        Agregar banner
      </button>
    </form>
  );
}
