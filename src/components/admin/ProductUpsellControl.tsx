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
  const [offerPrice, setOfferPrice] = useState(upsell?.offerPrice ?? 0);

  const selectedProduct = allProducts.find((p) => p.id === offerProductId);
  // Nunca se puede ofrecer a un precio que deje menos de la mitad de la
  // ganancia normal de ese producto (protege el margen aunque sea una
  // oferta agresiva).
  const minOfferPrice = selectedProduct
    ? (selectedProduct.salePrice + selectedProduct.costPrice) / 2
    : 0;
  const belowMin = Boolean(selectedProduct) && offerPrice < minOfferPrice;

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
              if (p) setOfferPrice(Math.ceil((p.salePrice + p.costPrice) / 2));
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
            {" · "}Precio mínimo permitido (mantiene al menos la mitad):{" "}
            <strong>{formatPrice(minOfferPrice)}</strong>
          </p>
        )}
        <label className="block max-w-40">
          <span className="mb-1 block text-[11px] text-zinc-500">Precio especial</span>
          <input
            name="offerPrice"
            type="number"
            step="0.01"
            min={minOfferPrice}
            value={offerPrice}
            onChange={(e) => setOfferPrice(Number(e.target.value))}
            className="input text-sm"
            placeholder="Ej: 500"
          />
        </label>
        {belowMin && (
          <p className="text-[11px] text-red-600">
            Ese precio deja menos de la mitad de la ganancia normal. Mínimo:{" "}
            {formatPrice(minOfferPrice)}
          </p>
        )}
        <button
          type="submit"
          disabled={!offerProductId || belowMin}
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
