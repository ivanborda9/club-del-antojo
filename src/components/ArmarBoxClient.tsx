"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { paletteFor } from "@/components/CategoryTabs";
import { buildWhatsappOrderLink, formatPrice, siteConfig } from "@/config/site";
import { CASH_DISCOUNT_RATE } from "@/lib/pricing";
import type { BoxSizeRow } from "@/lib/db/schema";
import type { PaymentMethod, Product } from "@/types";

type Props = {
  sizes: BoxSizeRow[];
  products: Product[];
};

export function ArmarBoxClient({ sizes, products }: Props) {
  const [sizeId, setSizeId] = useState<string | null>(null);
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [giftMessage, setGiftMessage] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("mercadopago");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transferSent, setTransferSent] = useState(false);
  const [cashConfirmed, setCashConfirmed] = useState(false);
  const [orderSummary, setOrderSummary] = useState<string | null>(null);

  const selectedSize = sizes.find((s) => s.id === sizeId) ?? null;
  const chosenItems = useMemo(
    () =>
      Object.entries(quantities)
        .filter(([, qty]) => qty > 0)
        .map(([productId, quantity]) => ({
          product: products.find((p) => p.id === productId)!,
          quantity,
        }))
        .filter((it) => it.product),
    [quantities, products]
  );
  const totalItems = chosenItems.reduce((sum, it) => sum + it.quantity, 0);
  const cashDiscount =
    method === "efectivo" && selectedSize
      ? Math.round(selectedSize.price * CASH_DISCOUNT_RATE)
      : 0;
  const displayBoxPrice = selectedSize ? selectedSize.price - cashDiscount : 0;

  function setQty(productId: string, qty: number, maxStock: number) {
    const clamped = Math.max(0, Math.min(qty, maxStock));
    setQuantities((prev) => ({ ...prev, [productId]: clamped }));
  }

  const isFormValid =
    name.trim() && phone.trim() && address.trim() && recipientName.trim() && selectedSize;

  async function handleSubmit() {
    if (!isFormValid || !selectedSize || chosenItems.length === 0) return;
    setError(null);
    setLoading(true);

    const payload = {
      boxSizeId: selectedSize.id,
      items: chosenItems.map((it) => ({ productId: it.product.id, quantity: it.quantity })),
      buyer: { name, phone, address },
      gift: { recipientName, message: giftMessage },
    };

    if (method === "mercadopago") {
      try {
        const res = await fetch("/api/checkout/box/mercadopago", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok || !data.initPoint) {
          throw new Error(data.error ?? "No se pudo iniciar el pago.");
        }
        window.location.assign(data.initPoint);
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudo iniciar el pago.");
        setLoading(false);
      }
      return;
    }

    try {
      const endpoint =
        method === "efectivo" ? "/api/checkout/box/efectivo" : "/api/checkout/box/transferencia";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const order = await res.json();
      if (!res.ok) throw new Error(order.error ?? "No se pudo crear el pedido.");

      const itemsSummary = chosenItems
        .map((it) => `• ${it.quantity}x ${it.product.name}`)
        .join("\n");

      const message = [
        `Pedido "Armá tu Box" para ${siteConfig.name}`,
        "",
        `Tamaño: ${selectedSize.name} — ${formatPrice(order.total)}`,
        "",
        "Productos para el box:",
        itemsSummary,
        "",
        `Para: ${recipientName}`,
        giftMessage ? `Mensaje para la tarjeta: "${giftMessage}"` : null,
        "",
        `Nombre: ${name}`,
        `Teléfono: ${phone}`,
        `Dirección de envío: ${address}`,
        "",
        method === "efectivo" ? "Pago en efectivo contra entrega." : "Pago por transferencia. Adjunto el comprobante.",
      ]
        .filter(Boolean)
        .join("\n");

      setOrderSummary(message);
      window.open(buildWhatsappOrderLink(message), "_blank", "noopener,noreferrer");
      if (method === "efectivo") setCashConfirmed(true);
      else setTransferSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear el pedido.");
    } finally {
      setLoading(false);
    }
  }

  if (cashConfirmed || transferSent) {
    return (
      <div className="safe-bottom mx-auto max-w-md px-4 py-10">
        <h1 className="text-lg font-bold text-zinc-800">¡Listo! Pedido de tu box confirmado</h1>
        <p className="mt-2 text-sm text-zinc-500">
          Te abrimos WhatsApp con el detalle. Nosotros armamos el box y le ponemos tu
          mensaje en la tarjeta.
        </p>
        {orderSummary && (
          <pre className="mt-4 whitespace-pre-wrap rounded-2xl border border-orange-100 bg-white p-4 text-xs text-zinc-600">
            {orderSummary}
          </pre>
        )}
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
    <div className="safe-bottom mx-auto max-w-md pb-28">
      <header className="bg-gradient-to-r from-fuchsia-600 via-purple-600 to-indigo-600 px-4 py-3.5 shadow-sm">
        <Link href="/" className="text-xs text-white/80 underline underline-offset-2">
          ← Volver a la tienda
        </Link>
        <h1 className="mt-1 text-lg font-extrabold tracking-tight text-white drop-shadow-sm">
          🎁 Armá tu Box
        </h1>
        <p className="text-xs text-purple-50">
          Elegí el tamaño, los productos y le ponemos tu mensaje en la tarjeta.
        </p>
      </header>

      <div className="px-4">
        {/* Paso 1: tamaño */}
        <section className="mt-5">
          <p className="text-sm font-bold text-zinc-800">1. Elegí el tamaño</p>
          <div className="mt-2 grid grid-cols-2 gap-3">
            {sizes.map((size, i) => (
              <button
                key={size.id}
                type="button"
                onClick={() => setSizeId(size.id)}
                className={`rounded-2xl p-4 text-left transition active:scale-95 ${
                  sizeId === size.id
                    ? `bg-gradient-to-br ${paletteFor(i)} text-white shadow-md shadow-black/10`
                    : "border-2 border-zinc-100 bg-white text-zinc-800 hover:border-zinc-200"
                }`}
              >
                <p className="text-base font-extrabold">{size.name}</p>
                <p
                  className={`mt-1 text-sm font-bold ${
                    sizeId === size.id ? "text-white" : "text-purple-600"
                  }`}
                >
                  {formatPrice(size.price)}
                </p>
              </button>
            ))}
          </div>
          {sizes.length === 0 && (
            <p className="mt-2 text-sm text-zinc-500">
              Todavía no hay tamaños configurados. Probá más tarde.
            </p>
          )}
        </section>

      {/* Paso 2: productos */}
      {selectedSize && (
        <section className="mt-6">
          <p className="text-sm font-bold text-zinc-800">
            2. Elegí los productos para tu box {selectedSize.name}
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            No hay límite fijo de cantidad — elegí lo que te gustaría y lo
            coordinamos con vos si hace falta ajustar algo.
          </p>

          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {products.map((product) => {
              const qty = quantities[product.id] ?? 0;
              return (
                <div
                  key={product.id}
                  className="flex flex-col rounded-2xl border border-zinc-100 bg-white p-2.5"
                >
                  <div className="flex aspect-square items-center justify-center overflow-hidden rounded-xl bg-orange-50 text-3xl">
                    {product.imageUrl ? (
                      <Image
                        src={product.imageUrl}
                        alt={product.name}
                        width={100}
                        height={100}
                        className="h-full w-full object-contain p-1"
                      />
                    ) : (
                      product.emoji
                    )}
                  </div>
                  <p className="mt-1.5 line-clamp-2 min-h-[2.2rem] text-xs font-medium text-zinc-800">
                    {product.name}
                  </p>
                  <div className="mt-1.5 flex items-center justify-between rounded-full bg-zinc-100">
                    <button
                      type="button"
                      onClick={() => setQty(product.id, qty - 1, product.stock)}
                      disabled={qty === 0}
                      className="h-7 w-7 text-sm font-bold text-zinc-600 active:scale-95 disabled:opacity-30"
                    >
                      −
                    </button>
                    <span className="text-xs font-bold text-zinc-800">{qty}</span>
                    <button
                      type="button"
                      onClick={() => setQty(product.id, qty + 1, product.stock)}
                      disabled={qty >= product.stock}
                      className="h-7 w-7 text-sm font-bold text-zinc-600 active:scale-95 disabled:opacity-30"
                    >
                      +
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Paso 3: datos + mensaje de tarjeta */}
      {selectedSize && totalItems > 0 && (
        <section className="mt-6 space-y-3 rounded-2xl border border-purple-100 bg-purple-50/50 p-4">
          <p className="text-sm font-bold text-zinc-800">
            3. Datos de envío y tarjeta de regalo
          </p>

          <Field label="Tu nombre">
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input"
              placeholder="Cómo te llamás"
            />
          </Field>
          <Field label="Tu teléfono / WhatsApp">
            <input
              required
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="input"
              placeholder="Ej: 3411234567"
            />
          </Field>
          <Field label="¿Para quién es el regalo?">
            <input
              required
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              className="input"
              placeholder="Nombre de quien lo recibe"
            />
          </Field>
          <Field label={`Dirección de envío en ${siteConfig.city}`}>
            <input
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="input"
              placeholder="Calle, número, piso/depto, referencia"
            />
          </Field>
          <Field label="Mensaje para la tarjeta (opcional)">
            <textarea
              value={giftMessage}
              onChange={(e) => setGiftMessage(e.target.value)}
              className="input min-h-20 resize-none"
              placeholder="Ej: ¡Feliz cumple! Te quiero mucho."
              maxLength={300}
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
            type="button"
            onClick={handleSubmit}
            disabled={!isFormValid || loading}
            className="flex h-12 w-full items-center justify-center rounded-full bg-gradient-to-r from-fuchsia-600 to-purple-600 text-sm font-bold text-white disabled:opacity-50"
          >
            {loading
              ? "Procesando…"
              : method === "mercadopago"
                ? `Pagar ${formatPrice(displayBoxPrice)} con Mercado Pago`
                : method === "efectivo"
                  ? `Confirmar box (${formatPrice(displayBoxPrice)} en efectivo)`
                  : "Confirmar box y ver datos de transferencia"}
          </button>
        </section>
      )}
      </div>

      {selectedSize && totalItems > 0 && (
        <div className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-purple-100 bg-white/95 px-4 py-3 backdrop-blur">
          <div className="mx-auto flex max-w-md items-center justify-between text-sm">
            <span className="font-semibold text-zinc-700">
              {totalItems} {totalItems === 1 ? "producto elegido" : "productos elegidos"}
            </span>
            <span className="font-extrabold text-purple-700">
              Box {selectedSize.name} — {formatPrice(displayBoxPrice)}
              {cashDiscount > 0 && (
                <span className="ml-1 text-xs font-medium text-emerald-600">(5% off)</span>
              )}
            </span>
          </div>
        </div>
      )}
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
        selected ? "border-purple-600 bg-white" : "border-zinc-200 bg-white"
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
