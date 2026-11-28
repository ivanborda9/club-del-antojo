"use client";

import Image from "next/image";
import Link from "next/link";
import QRCode from "qrcode";
import { useEffect, useRef, useState } from "react";
import { buildWhatsappOrderLink, formatPrice, siteConfig } from "@/config/site";
import { StoreClosedDetails, StoreStatusBar, useStoreOpen } from "@/components/StoreStatusBadge";
import { useCart } from "@/context/CartContext";
import { CASH_DISCOUNT_RATE } from "@/lib/pricing";
import type { PaymentMethod, Product } from "@/types";

type QrPaymentState = {
  orderId: string;
  qrImage: string | null;
  total: number;
  status: "esperando" | "pagado" | "cancelado";
};

type UpsellOffer = {
  triggerProductId: string;
  offerProductId: string;
  offerPrice: number;
  offerProduct: Product;
};

type CartPromo = {
  triggerCategory: string;
  excludeCategory: string;
  discountPercent: number;
  active: boolean;
  eligibleProductIds: string[];
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
  const [cartPromo, setCartPromo] = useState<CartPromo | null>(null);
  const [shippingCost, setShippingCost] = useState(0);
  const [shippingLoading, setShippingLoading] = useState(false);
  const [qrPayment, setQrPayment] = useState<QrPaymentState | null>(null);
  const cancellingRef = useRef(false);

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

  useEffect(() => {
    let cancelled = false;
    fetch("/api/cart-promo")
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setCartPromo(data);
      })
      .catch(() => {
        if (!cancelled) setCartPromo(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Cotización de envío: solo para que el cliente vea un estimado antes de
  // pagar — el costo real siempre lo recalcula el servidor al crear el
  // pedido (geocodifica de nuevo, nunca confía en esto). Con debounce para
  // no pegarle a la API en cada tecla.
  useEffect(() => {
    if (!address.trim()) {
      // Dirección vacía: no hay nada que cotizar, solo resetea el estado.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShippingCost(0);
      setShippingLoading(false);
      return;
    }
    setShippingLoading(true);
    let cancelled = false;
    const timer = setTimeout(() => {
      fetch("/api/shipping-quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (!cancelled) setShippingCost(data.cost ?? 0);
        })
        .catch(() => {
          if (!cancelled) setShippingCost(0);
        })
        .finally(() => {
          if (!cancelled) setShippingLoading(false);
        });
    }, 700);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [address]);

  // Mientras se espera que escaneen el QR: cada 3s preguntamos nuestro
  // propio estado (lo actualiza el webhook de Mercado Pago cuando se
  // confirma el pago, no hace falta volver a consultarle a MP acá).
  useEffect(() => {
    if (!qrPayment || qrPayment.status !== "esperando") return;
    let cancelled = false;
    const interval = setInterval(() => {
      fetch(`/api/orders/${qrPayment.orderId}/status`)
        .then((res) => res.json())
        .then((data) => {
          if (cancelled) return;
          if (data.status === "pagado") {
            setQrPayment((prev) => (prev ? { ...prev, status: "pagado" } : prev));
            clear();
          } else if (data.status === "cancelado") {
            setQrPayment((prev) => (prev ? { ...prev, status: "cancelado" } : prev));
          }
        })
        .catch(() => {
          // Reintenta en el próximo tick; un error de red puntual no corta el polling.
        });
    }, 3000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qrPayment?.orderId, qrPayment?.status]);

  // Mismo criterio que el servidor para el descuento: alcanza con que haya
  // algo de la categoría gatillo en el carrito. La categoría "excluida" acá
  // solo decide si mostramos el cartel (no tiene sentido invitar a agregar
  // una bebida si ya agregó una) — una vez que agrega una elegible, el
  // cartel se oculta solo y pasa a verse la línea de descuento.
  const hasCartPromoTrigger = Boolean(
    cartPromo?.active &&
      items.some(
        (it) =>
          it.product.category === cartPromo.triggerCategory ||
          it.product.parentCategory === cartPromo.triggerCategory
      )
  );
  const hasCartPromoExcludeItem = Boolean(
    cartPromo &&
      items.some(
        (it) =>
          it.product.category === cartPromo.excludeCategory ||
          it.product.parentCategory === cartPromo.excludeCategory
      )
  );
  const showCartPromoBanner = hasCartPromoTrigger && !hasCartPromoExcludeItem;
  const cartPromoDiscount =
    hasCartPromoTrigger && cartPromo
      ? items.reduce((sum, it) => {
          if (!cartPromo.eligibleProductIds.includes(it.product.id)) return sum;
          return sum + Math.round(it.product.salePrice * it.quantity * (cartPromo.discountPercent / 100));
        }, 0)
      : 0;

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
  const subtotalAfterUpsells = totalPrice - upsellDiscount - cartPromoDiscount;
  // Mismo redondeo que el servidor (por unidad, no sobre el total) — acá
  // alcanza con la aproximación sobre el subtotal para la vidriera, el
  // cobro real siempre lo recalcula el servidor.
  const cashDiscount =
    method === "efectivo" ? Math.round(subtotalAfterUpsells * CASH_DISCOUNT_RATE) : 0;
  // El envío no se descuenta con nada (ni la promo, ni el 5% de
  // efectivo): es el costo real de la entrega, se suma aparte.
  const displayTotal = subtotalAfterUpsells - cashDiscount + shippingCost;

  const storeOpen = useStoreOpen();
  const isFormValid = name.trim() && phone.trim() && address.trim();
  const canSubmit = isFormValid && storeOpen !== false;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || items.length === 0) return;
    setError(null);
    setLoading(true);

    const payload = {
      items: items.map(({ product, quantity, variantId }) => ({
        productId: product.id,
        quantity,
        variantId,
      })),
      buyer: { name, phone, address, notes },
    };

    if (method === "qr") {
      try {
        const res = await fetch("/api/checkout/qr", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok || !data.qrData) {
          throw new Error(data.error ?? "No se pudo generar el QR de pago.");
        }
        const qrImage = await QRCode.toDataURL(data.qrData, { margin: 1, width: 280 }).catch(
          () => null
        );
        setQrPayment({ orderId: data.orderId, qrImage, total: data.total, status: "esperando" });
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudo generar el QR de pago.");
      } finally {
        setLoading(false);
      }
      return;
    }

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
          (it: { name: string; variantName?: string; quantity: number; unitPrice: number }) =>
            `• ${it.quantity}x ${it.name}${it.variantName ? ` (${it.variantName})` : ""} — ${formatPrice(it.unitPrice * it.quantity)}`
        )
        .join("\n");

      const message = [
        `Pedido para ${siteConfig.name}`,
        "",
        summary,
        order.shippingCost > 0 ? `• Envío — ${formatPrice(order.shippingCost)}` : null,
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

  async function handleCancelQr() {
    if (!qrPayment || cancellingRef.current) return;
    cancellingRef.current = true;
    try {
      await fetch("/api/checkout/qr/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: qrPayment.orderId }),
      });
    } catch {
      // Si falla la cancelación, igual dejamos elegir otro medio de pago —
      // el pedido queda "pendiente_pago" y el webhook/expiración de
      // Mercado Pago lo terminan de resolver solos.
    } finally {
      cancellingRef.current = false;
      setQrPayment(null);
    }
  }

  if (items.length === 0 && !transferSent && !cashConfirmed && !qrPayment) {
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

  if (qrPayment?.status === "pagado") {
    return (
      <div className="safe-bottom mx-auto max-w-md px-4 py-10 text-center">
        <p className="text-5xl">✅</p>
        <h1 className="mt-2 text-lg font-bold text-zinc-800">¡Pago recibido!</h1>
        <p className="mt-2 text-sm text-zinc-500">
          Ya confirmamos tu pago de {formatPrice(qrPayment.total)}. Estamos preparando tu
          pedido.
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

  if (qrPayment) {
    return (
      <div className="safe-bottom mx-auto max-w-md px-4 py-10 text-center">
        <h1 className="text-lg font-bold text-zinc-800">Escaneá para pagar</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Abrí Mercado Pago, Cuenta DNI, Ualá o la app de tu banco y escaneá este código.
        </p>

        {qrPayment.status === "cancelado" ? (
          <div className="mt-6 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
            Este QR ya no es válido (venció o se canceló). Elegí otra forma de pago.
            <button
              type="button"
              onClick={() => setQrPayment(null)}
              className="mt-3 flex h-10 w-full items-center justify-center rounded-full bg-red-600 text-sm font-bold text-white"
            >
              Elegir otro medio de pago
            </button>
          </div>
        ) : (
          <>
            <div className="mx-auto mt-5 flex h-[280px] w-[280px] items-center justify-center rounded-2xl border border-orange-100 bg-white p-3">
              {qrPayment.qrImage ? (
                // eslint-disable-next-line @next/next/no-img-element -- data: URL generada en el cliente, no una imagen remota.
                <img src={qrPayment.qrImage} alt="Código QR para pagar" className="h-full w-full" />
              ) : (
                <p className="text-xs text-zinc-400">No se pudo generar la imagen del QR.</p>
              )}
            </div>
            <p className="mt-3 text-base font-bold text-zinc-800">
              Total: {formatPrice(qrPayment.total)}
            </p>
            <p className="mt-1 flex items-center justify-center gap-1.5 text-xs text-zinc-500">
              <span className="h-2 w-2 animate-pulse rounded-full bg-orange-500" />
              Esperando el pago…
            </p>
            <button
              type="button"
              onClick={handleCancelQr}
              className="mt-6 flex h-10 w-full items-center justify-center rounded-full border border-zinc-200 text-sm font-semibold text-zinc-600"
            >
              Cancelar y elegir otro medio de pago
            </button>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="safe-bottom">
      <StoreStatusBar />
      <div className="mx-auto max-w-md px-4 py-6">
      <div className="mb-3">
        <StoreClosedDetails />
      </div>
      <h1 className="text-lg font-bold text-zinc-800">Terminar pedido</h1>
      <p className="mt-1 text-xs text-zinc-500">🚚 {siteConfig.deliveryNote}</p>

      <div className="mt-4 rounded-2xl border border-orange-100 bg-white p-4">
        <p className="text-sm font-semibold text-zinc-800">Tu pedido</p>
        <ul className="mt-2 space-y-1 text-sm text-zinc-600">
          {items.map(({ product, quantity, variantId, variantName }) => (
            <li key={`${product.id}-${variantId ?? ""}`} className="flex justify-between">
              <span>
                {quantity}x {product.name}
                {variantName && <span className="text-zinc-400"> · {variantName}</span>}
              </span>
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
        {cartPromoDiscount > 0 && (
          <div className="mt-1 flex justify-between text-sm text-emerald-600">
            <span>🥤 Descuento por bebida</span>
            <span>−{formatPrice(cartPromoDiscount)}</span>
          </div>
        )}
        {cashDiscount > 0 && (
          <div className="mt-1 flex justify-between text-sm text-emerald-600">
            <span>💵 5% off por pagar en efectivo</span>
            <span>−{formatPrice(cashDiscount)}</span>
          </div>
        )}
        {address.trim() && (
          <div className="mt-1 flex justify-between text-sm text-zinc-600">
            <span>🚚 Envío</span>
            <span>{shippingLoading ? "Calculando…" : formatPrice(shippingCost)}</span>
          </div>
        )}
        <div className="mt-2 flex justify-between border-t border-orange-100 pt-2 text-sm font-bold text-zinc-800">
          <span>Total</span>
          <span>{formatPrice(displayTotal)}</span>
        </div>
      </div>

      {showCartPromoBanner && cartPromo && (
        <Link
          href="/"
          className="mt-3 flex items-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-medium text-sky-800"
        >
          <span className="text-base leading-none">🥤</span>
          <span>¡Agregá una bebida y llevate un {cartPromo.discountPercent}% de descuento!</span>
        </Link>
      )}

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
            <PaymentOption
              id="qr"
              label="Pagar con QR"
              description="Escaneás con Mercado Pago, Cuenta DNI, Ualá o tu banco"
              selected={method === "qr"}
              onSelect={() => setMethod("qr")}
            />
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        {storeOpen === false && (
          <p className="text-center text-sm font-semibold text-red-600">
            Estamos cerrados en este momento — no se pueden confirmar pedidos hasta que
            volvamos a abrir.
          </p>
        )}

        <button
          type="submit"
          disabled={!canSubmit || loading}
          className="flex h-12 w-full items-center justify-center rounded-full bg-orange-600 text-sm font-bold text-white disabled:opacity-50"
        >
          {loading
            ? "Procesando…"
            : method === "mercadopago"
              ? `Pagar ${formatPrice(displayTotal)} con Mercado Pago`
              : method === "qr"
                ? `Generar QR para pagar ${formatPrice(displayTotal)}`
                : method === "efectivo"
                  ? "Confirmar pedido (pago en efectivo)"
                  : "Confirmar pedido y ver datos de transferencia"}
        </button>
      </form>
      </div>
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
