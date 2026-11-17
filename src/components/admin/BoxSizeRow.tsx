"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import {
  deleteBoxSizeAction,
  updateBoxSizeAction,
} from "@/app/admin/(dashboard)/box/actions";
import { formatPrice } from "@/config/site";
import type { BoxSizeRow as BoxSizeRowType } from "@/lib/db/schema";

export function BoxSizeRow({ size }: { size: BoxSizeRowType }) {
  const [imageUrl, setImageUrl] = useState<string | null>(size.imageUrl);
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
    <div className="rounded-2xl border border-zinc-200 bg-white p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-orange-50 text-2xl">
            {imageUrl ? (
              <Image src={imageUrl} alt="" width={56} height={56} className="h-full w-full object-contain p-1" />
            ) : (
              "🎁"
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-800">{size.name}</p>
            <p className="text-sm text-orange-600">{formatPrice(size.price)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <form action={updateBoxSizeAction}>
            <input type="hidden" name="id" value={size.id} />
            <input type="hidden" name="name" value={size.name} />
            <input type="hidden" name="price" value={size.price} />
            <input type="hidden" name="sortOrder" value={size.sortOrder} />
            <input type="hidden" name="imageUrl" value={size.imageUrl ?? ""} />
            <input type="hidden" name="stock" value={size.stock} />
            <input type="hidden" name="active" value={(!size.active).toString()} />
            <button
              type="submit"
              className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                size.active ? "bg-emerald-50 text-emerald-700" : "bg-zinc-100 text-zinc-500"
              }`}
            >
              {size.active ? "Activo" : "Oculto"}
            </button>
          </form>
          <form action={deleteBoxSizeAction}>
            <input type="hidden" name="id" value={size.id} />
            <button type="submit" className="text-sm text-red-600">
              Eliminar
            </button>
          </form>
        </div>
      </div>

      <form
        action={updateBoxSizeAction}
        className="mt-3 flex flex-wrap items-end gap-3 border-t border-zinc-100 pt-3"
      >
        <input type="hidden" name="id" value={size.id} />
        <input type="hidden" name="name" value={size.name} />
        <input type="hidden" name="price" value={size.price} />
        <input type="hidden" name="sortOrder" value={size.sortOrder} />
        <input type="hidden" name="active" value={size.active.toString()} />
        <input type="hidden" name="imageUrl" value={imageUrl ?? ""} />

        <label className="block">
          <span className="mb-1 block text-xs font-medium text-zinc-600">Foto</span>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={uploading}
            className="block text-xs text-zinc-600 file:mr-2 file:rounded-full file:border-0 file:bg-orange-600 file:px-2.5 file:py-1 file:text-xs file:font-semibold file:text-white"
          />
          {uploading && <p className="text-xs text-zinc-500">Subiendo…</p>}
          {uploadError && <p className="text-xs text-red-600">{uploadError}</p>}
        </label>

        <label className="block w-24">
          <span className="mb-1 block text-xs font-medium text-zinc-600">Stock</span>
          <input name="stock" type="number" step="1" min="0" defaultValue={size.stock} className="input" />
        </label>

        <button
          type="submit"
          disabled={uploading}
          className="h-10 rounded-full bg-zinc-800 px-4 text-xs font-bold text-white disabled:opacity-50"
        >
          Guardar
        </button>
      </form>
    </div>
  );
}
