"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { buildWhatsappOrderLink, formatPrice, siteConfig } from "@/config/site";
import { useCart } from "@/context/CartContext";
import { CASH_DISCOUNT_RATE } from "@/lib/pricing";
import type { PaymentMethod, Product } from "@/types";

type UpsellOffer = {
  triggerProductId: string;
  offerProductId: string;
  offerPrice: number;
  offerProduct: Product;
};

export default function CheckoutPage() {
  const { items, totalPrice, addItem, clear } = useCart();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("mercadopago");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transferSent, setTransferSent] = useState(false);
  const [cashConfirmed, setCashConfirmed] = useState(false);
  const [upsellOffers, setUpsellOffers] = useState<UpsellOffer[]>([]);

  const cartProductIds = items.map((item) => item.product.id).sort().join(",");

  useEffect(() => {
    let cancelled = false;
    const productIds = cartProductIds ? cartProductIds.split(",") : [];
    fetch("/api/upsells", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productIds }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setUpsellOffers(data.offers ?? []);
      })
      .catch(() => {
        if (!cancelled) setUpsellOffers([]);
      });
    return () => {
      cancelled = true;
    };
  }, [cartProductIds]);

  // Línea de descuento a mostrar: para cada oferta aplicable, si ya se
  // cumplió (producto ofrecido en el carrito, y si es "2x1" del mismo
  // producto con 2+ unidades) restamos una unidad al precio especial. El
  // total real siempre lo recalcula el servidor igual — esto es solo la
  // vidriera para que el cliente vea el descuento antes de pagar.
  const appliedUpsells = upsellOffers.filter((offer) => {
    const cartItem = items.find((it) => it.product.id === offer.offerProductId);
    if (!cartItem) return false;
    const sameProduct = offer.triggerProductId === offer.offerProductId;
    return sameProduct ? cartItem.quantity >= 2 : true;
  });
  const upsellDiscount = appliedUpsells.reduce(
    (sum, offer) => sum + Math.max(0, offer.offerProduct.salePrice - offer.offerPrice),
    0
  );
  const pendingUpsells = upsellOffers.filter(
    (offer) => !appliedUpsells.some((a) => a.offerProductId === offer.offerProductId)
  );
  const subtotalAfterUpsells = totalPrice - upsellDiscount;
  // Mismo redondeo que el servidor (por unidad, no sobre el total) — acá
  // alcanza con la aproximación sobre el subtotal para la vidriera, el
  // cobro real siempre lo recalcula el servidor.
  const cashDiscount =
    method === "efectivo" ? Math.round(subtotalAfterUpsells * CASH_DISCOUNT_RATE) : 0;
  const displayTotal = subtotalAfterUpsells - cashDiscount;

  const isFormValid = name.trim() && phone.trim() && address.trim();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isFormValid || items.length === 0) return;
    setError(null);
    setLoading(true);

    const payload = {
      items: items.map(({ product, quantity }) => ({
        productId: product.id,
        quantity,
      })),
      buyer: { name, phone, address, notes },
    };

    if (method === "mercadopago") {
      try {
        const res = await fetch("/api/checkout/mercadopago", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok || !data.initPoint) {
          throw new Error(data.error ?? "No se pudo iniciar el pago.");
        }
        window.location.href = data.initPoint;
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudo iniciar el pago.");
        setLoading(false);
      }
      return;
    }

    // Transferencia y efectivo: creamos el pedido en el servidor (valida
    // stock y precios reales) y armamos el mensaje de WhatsApp con esos
    // datos ya confirmados.
    try {
      const endpoint = method === "efectivo" ? "/api/checkout/efectivo" : "/api/checkout/transferencia";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const order = await res.json();
      if (!res.ok) throw new Error(order.error ?? "No se pudo crear el pedido.");

      const summary = order.items
        .map(
          (it: { name: string; quantity: number; unitPrice: number }) =>
            `• ${it.quantity}x ${it.name} — ${formatPrice(it.unitPrice * it.quantity)}`
        )
        .join("\n");

      const message = [
        `Pedido para ${siteConfig.name}`,
        "",
        summary,
        "",
        `Total: ${formatPrice(order.total)}`,
        "",
        `Nombre: ${name}`,
        `Teléfono: ${phone}`,
        `Dirección de envío: ${address}`,
        notes ? `Notas: ${notes}` : null,
        "",
        method === "efectivo" ? "Pago en efectivo contra entrega." : "Pago por transferencia. Adjunto el comprobante.",
      ]
        .filter(Boolean)
        .join("\n");

      window.open(buildWhatsappOrderLink(message), "_blank", "noopener,noreferrer");
      if (method === "efectivo") setCashConfirmed(true);
      else setTransferSent(true);
      clear();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear el pedido.");
    } finally {
      setLoading(false);
    }
  }

  if (items.length === 0 && !transferSent && !cashConfirmed) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-6 text-center">
        <p className="text-sm text-zinc-500">Tu carrito está vacío.</p>
        <Link
          href="/"
          className="mt-4 flex h-11 items-center justify-center rounded-full bg-orange-600 px-6 text-sm font-bold text-white"
        >
          Ver productos
        </Link>
      </div>
    );
  }

  if (cashConfirmed) {
    return (
      <div className="safe-bottom mx-auto max-w-md px-4 py-10">
        <h1 className="text-lg font-bold text-zinc-800">¡Listo! Pedido confirmado</h1>
        <p className="mt-2 text-sm text-zinc-500">
          Te abrimos WhatsApp con el detalle del pedido. Pagás en efectivo cuando te lo
          entregue el repartidor.
        </p>

        <Link
          href="/"
          className="mt-6 flex h-11 items-center justify-center rounded-full bg-orange-600 px-6 text-sm font-bold text-white"
        >
          Volver al inicio
        </Link>
      </div>
    );
  }

  if (transferSent) {
    return (
      <div className="safe-bottom mx-auto max-w-md px-4 py-10">
        <h1 className="text-lg font-bold text-zinc-800">¡Listo! Enviá el comprobante</h1>
        <p className="mt-2 text-sm text-zinc-500">
          Te abrimos WhatsApp con el detalle del pedido. Transferí el total y mandanos
          el comprobante para confirmar tu compra.
        </p>

        <div className="mt-5 rounded-2xl border border-orange-100 bg-white p-4">
          <p className="text-sm font-semibold text-zinc-800">Datos para transferir</p>
          <dl className="mt-2 space-y-1 text-sm text-zinc-600">
            <div className="flex justify-between">
              <dt>Titular</dt>
              <dd>{siteConfig.bank.holderName}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Alias</dt>
              <dd className="font-mono">{siteConfig.bank.alias}</dd>
            </div>
            <div className="flex justify-between">
              <dt>CBU/CVU</dt>
              <dd className="font-mono">{siteConfig.bank.cbu}</dd>
            </div>
          </dl>
        </div>

        <Link
          href="/"
          className="mt-6 flex h-11 items-center justify-center rounded-full bg-orange-600 px-6 text-sm font-bold text-white"
        >
          Volver al inicio
        </Link>
      </div>
    );
  }

  return (
    <div className="safe-bottom mx-auto max-w-md px-4 py-6">
      <h1 className="text-lg font-bold text-zinc-800">Terminar pedido</h1>
      <p className="mt-1 text-xs text-zinc-500">🚚 {siteConfig.deliveryNote}</p>

      <div className="mt-4 rounded-2xl border border-orange-100 bg-white p-4">
        <p className="text-sm font-semibold text-zinc-800">Tu pedido</p>
        <ul className="mt-2 space-y-1 text-sm text-zinc-600">
          {items.map(({ product, quantity }) => (
            <li key={product.id} className="flex justify-between">
              <span>{quantity}x {product.name}</span>
              <span>{formatPrice(product.salePrice * quantity)}</span>
            </li>
          ))}
        </ul>
        {upsellDiscount > 0 && (
          <div className="mt-1 flex justify-between text-sm text-emerald-600">
            <span>🎉 Descuento especial</span>
            <span>−{formatPrice(upsellDiscount)}</span>
          </div>
        )}
        {cashDiscount > 0 && (
          <div className="mt-1 flex justify-between text-sm text-emerald-600">
            <span>💵 5% off por pagar en efectivo</span>
            <span>−{formatPrice(cashDiscount)}</span>
          </div>
        )}
        <div className="mt-2 flex justify-between border-t border-orange-100 pt-2 text-sm font-bold text-zinc-800">
          <span>Total</span>
          <span>{formatPrice(displayTotal)}</span>
        </div>
      </div>

      {pendingUpsells.map((offer) => (
        <div
          key={offer.triggerProductId}
          className="mt-3 overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 p-3.5 text-white shadow-lg"
        >
          <p className="text-xs font-extrabold uppercase tracking-wide text-emerald-50">
            🎁 Oferta especial para vos
          </p>
          <div className="mt-2 flex items-center gap-3">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white text-4xl shadow-sm">
              {offer.offerProduct.imageUrl ? (
                <Image
                  src={offer.offerProduct.imageUrl}
                  alt=""
                  width={80}
                  height={80}
                  className="h-full w-full object-contain p-1"
                />
              ) : (
                offer.offerProduct.emoji
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 text-sm font-bold leading-tight">
                {offer.offerProduct.name}
              </p>
              <p className="mt-1 flex items-baseline gap-1.5">
                <span className="text-lg font-extrabold">{formatPrice(offer.offerPrice)}</span>
                {offer.offerProduct.salePrice > offer.offerPrice && (
                  <span className="text-xs font-medium text-emerald-100 line-through">
                    {formatPrice(offer.offerProduct.salePrice)}
                  </span>
                )}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => addItem(offer.offerProduct)}
            className="mt-3 h-11 w-full rounded-full bg-white text-sm font-extrabold text-emerald-700 shadow-sm active:scale-[0.98] transition"
          >
            Sí, lo quiero agregar
          </button>
        </div>
      ))}

      <form onSubmit={handleSubmit} className="mt-5 space-y-3">
        <Field label="Nombre y apellido">
          <input
            required
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input"
            placeholder="Cómo te llamás"
          />
        </Field>
        <Field label="Teléfono / WhatsApp">
          <input
            required
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="input"
            placeholder="Ej: 3411234567"
          />
        </Field>
        <Field label={`Dirección de envío en ${siteConfig.city}`}>
          <input
            required
            autoComplete="street-address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="input"
            placeholder="Calle, número, piso/depto, referencia"
          />
        </Field>
        <Field label="Notas (opcional)">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="input min-h-16 resize-none"
            placeholder="Ej: timbre roto, dejar en portería, etc."
          />
        </Field>

        <div>
          <p className="mb-2 text-sm font-semibold text-zinc-800">Forma de pago</p>
          <div className="space-y-2">
            <PaymentOption
              id="mercadopago"
              label="Mercado Pago"
              description="Tarjeta, débito o dinero en cuenta"
              selected={method === "mercadopago"}
              onSelect={() => setMethod("mercadopago")}
            />
            <PaymentOption
              id="transferencia"
              label="Transferencia bancaria"
              description="Te mostramos los datos y confirmás por WhatsApp"
              selected={method === "transferencia"}
              onSelect={() => setMethod("transferencia")}
            />
            <PaymentOption
              id="efectivo"
              label="Efectivo 💵 5% off"
              description="Pagás en el momento, cuando te entreguen el pedido"
              selected={method === "efectivo"}
              onSelect={() => setMethod("efectivo")}
            />
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={!isFormValid || loading}
          className="flex h-12 w-full items-center justify-center rounded-full bg-orange-600 text-sm font-bold text-white disabled:opacity-50"
        >
          {loading
            ? "Procesando…"
            : method === "mercadopago"
              ? `Pagar ${formatPrice(displayTotal)} con Mercado Pago`
              : method === "efectivo"
                ? "Confirmar pedido (pago en efectivo)"
                : "Confirmar pedido y ver datos de transferencia"}
        </button>
      </form>
    </div>
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

function PaymentOption({
  id,
  label,
  description,
  selected,
  onSelect,
}: {
  id: string;
  label: string;
  description: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <label
      htmlFor={id}
      className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-3 ${
        selected ? "border-orange-600 bg-orange-50" : "border-orange-100 bg-white"
      }`}
    >
      <input
        id={id}
        type="radio"
        name="payment-method"
        checked={selected}
        onChange={onSelect}
        className="mt-1"
      />
      <span>
        <span className="block text-sm font-semibold text-zinc-800">{label}</span>
        <span className="block text-xs text-zinc-500">{description}</span>
      </span>
    </label>
  );
}
