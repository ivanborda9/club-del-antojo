"use client";

import { useState } from "react";
import {
  clearProductUpsellAction,
  setProductUpsellAction,
} from "@/app/admin/(dashboard)/productos/actions";
import { formatPrice } from "@/config/site";
import type { ProductRow } from "@/lib/db/schema";

type Upsell = {
  offerProductId: string;
  offerPrice: number;
  offerProductName: string;
};

type Props = {
  triggerProductId: string;
  allProducts: ProductRow[];
  upsell: Upsell | null;
};

export function ProductUpsellControl({ triggerProductId, allProducts, upsell }: Props) {
  const [offerProductId, setOfferProductId] = useState(
    upsell?.offerProductId ?? ""
  );
  // String, no number: si fuera number, al borrar el único dígito el campo
  // cae a 0 y React lo vuelve a mostrar en el input — no se puede dejar
  // vacío para escribir un valor nuevo.
  const [offerPriceText, setOfferPriceText] = useState(
    upsell ? String(upsell.offerPrice) : ""
  );
  const offerPrice = Number(offerPriceText) || 0;

  const selectedProduct = allProducts.find((p) => p.id === offerProductId);
  // Precio sugerido: mantiene al menos la mitad de la ganancia normal. Es
  // solo una guía al precargar el campo — el precio final queda a criterio
  // de cada uno, se puede bajar más si se quiere.
  const suggestedMinPrice = selectedProduct
    ? (selectedProduct.salePrice + selectedProduct.costPrice) / 2
    : 0;
  const belowSuggested = Boolean(selectedProduct) && offerPriceText !== "" && offerPrice < suggestedMinPrice;

  return (
    <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-3">
      <p className="text-sm font-semibold text-zinc-700">
        Oferta antes de pagar (opcional)
      </p>
      <p className="mt-1 text-xs text-zinc-500">
        Si el cliente lleva este producto, en el checkout le aparece un cartel
        ofreciendo otro producto a precio especial antes de pagar. Para un
        2x1 o &quot;2da unidad más barata&quot;, elegí el mismo producto como
        oferta.
      </p>

      {upsell && (
        <p className="mt-2 rounded-xl bg-white px-3 py-2 text-xs text-zinc-600">
          Oferta actual: agregar <strong>{upsell.offerProductName}</strong> por{" "}
          <strong>{formatPrice(upsell.offerPrice)}</strong>
        </p>
      )}

      <form action={setProductUpsellAction} className="mt-2 space-y-2">
        <input type="hidden" name="triggerProductId" value={triggerProductId} />
        <label className="block">
          <span className="mb-1 block text-[11px] text-zinc-500">
            Producto a ofrecer
          </span>
          <select
            name="offerProductId"
            value={offerProductId}
            onChange={(e) => {
              const id = e.target.value;
              setOfferProductId(id);
              const p = allProducts.find((prod) => prod.id === id);
              if (p) setOfferPriceText(String(Math.ceil((p.salePrice + p.costPrice) / 2)));
            }}
            className="input text-sm"
          >
            <option value="">Elegí un producto…</option>
            {allProducts.map((p) => (
              <option key={p.id} value={p.id}>
                {p.emoji} {p.name}
                {p.id === triggerProductId ? " (este mismo producto)" : ""}
              </option>
            ))}
          </select>
        </label>
        {selectedProduct && (
          <p className="text-[11px] text-zinc-500">
            Ganancia normal: {formatPrice(selectedProduct.salePrice - selectedProduct.costPrice)}
            {" · "}Precio sugerido (mantiene al menos la mitad):{" "}
            <strong>{formatPrice(suggestedMinPrice)}</strong>
          </p>
        )}
        <label className="block max-w-40">
          <span className="mb-1 block text-[11px] text-zinc-500">Precio especial</span>
          <input
            name="offerPrice"
            type="number"
            step="0.01"
            min="0"
            value={offerPriceText}
            onChange={(e) => setOfferPriceText(e.target.value)}
            className="input text-sm"
            placeholder="Ej: 500"
          />
        </label>
        {belowSuggested && (
          <p className="text-[11px] text-amber-600">
            Con este precio ganás menos de la mitad de lo normal en esa unidad. Sugerido:{" "}
            {formatPrice(suggestedMinPrice)}
          </p>
        )}
        <button
          type="submit"
          disabled={!offerProductId}
          className="h-9 w-full rounded-full bg-orange-600 text-xs font-bold text-white disabled:opacity-50"
        >
          Guardar oferta
        </button>
      </form>

      {upsell && (
        <form action={clearProductUpsellAction} className="mt-2">
          <input type="hidden" name="triggerProductId" value={triggerProductId} />
          <button type="submit" className="w-full text-center text-xs text-red-600">
            Quitar oferta
          </button>
        </form>
      )}
    </div>
  );
}
