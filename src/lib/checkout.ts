import { randomUUID } from "crypto";
import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { orderItems, orders, products } from "@/lib/db/schema";
import { getUpsellOffersForProductIds } from "@/lib/db/queries";
import { isWithinSchedule } from "@/lib/schedule";
import { notifyRidersOfNewOrder } from "@/lib/push";

export type CheckoutItemInput = { productId: string; quantity: number };
export type Buyer = { name: string; phone: string; address: string; notes?: string };

export class CheckoutError extends Error {}

export type CreatedOrder = {
  orderId: string;
  total: number;
  items: { productId: string; name: string; unitPrice: number; quantity: number }[];
};

// Recalcula todo desde la base (nunca confía en precios/stock que mande el
// cliente), reserva el stock y deja el pedido registrado para el admin.
export async function createOrderFromCart(
  itemsInput: CheckoutItemInput[],
  buyer: Buyer,
  paymentMethod: "mercadopago" | "transferencia" | "efectivo"
): Promise<CreatedOrder> {
  if (!itemsInput.length) throw new CheckoutError("El carrito está vacío.");

  const resolved: {
    productId: string;
    name: string;
    unitPrice: number;
    unitCost: number;
    quantity: number;
  }[] = [];

  for (const { productId, quantity } of itemsInput) {
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new CheckoutError("Cantidad inválida en el carrito.");
    }
    const rows = await db.select().from(products).where(eq(products.id, productId)).limit(1);
    const product = rows[0];
    if (!product || !product.active) {
      throw new CheckoutError(`Uno de los productos ya no está disponible.`);
    }
    if (!isWithinSchedule(product.scheduleStart, product.scheduleEnd)) {
      throw new CheckoutError(`"${product.name}" no está disponible en este horario.`);
    }
    if (product.stock < quantity) {
      throw new CheckoutError(
        `No hay suficiente stock de "${product.name}" (quedan ${product.stock}).`
      );
    }
    resolved.push({
      productId: product.id,
      name: product.name,
      unitPrice: product.salePrice,
      unitCost: product.costPrice,
      quantity,
    });
  }

  // Ofertas "antes de pagar" (ej. llevás alcohol → hielo con descuento, o
  // 2x1 en el mismo producto): se recalculan acá, nunca se confía en un
  // precio que mande el cliente. Si el producto gatillo y el producto
  // ofrecido están los dos en el carrito, se descuenta UNA unidad de este
  // último al precio especial — el resto de sus unidades (si pidió más de
  // una) van al precio normal.
  const resolvedProductIds = resolved.map((it) => it.productId);
  const upsellOffers = await getUpsellOffersForProductIds(resolvedProductIds);
  const discountedProductIds = new Set<string>();
  for (const offer of upsellOffers) {
    if (discountedProductIds.has(offer.offerProductId)) continue;
    const offerIndex = resolved.findIndex((it) => it.productId === offer.offerProductId);
    if (offerIndex === -1) continue;

    const sameProduct = offer.triggerProductId === offer.offerProductId;
    const offerItem = resolved[offerIndex];
    // "2x1"/2da unidad más barata del mismo producto: hace falta una
    // segunda unidad además de la que gatilla la oferta.
    if (sameProduct && offerItem.quantity < 2) continue;
    if (!sameProduct && !resolved.some((it) => it.productId === offer.triggerProductId)) continue;

    discountedProductIds.add(offer.offerProductId);
    if (offerItem.quantity === 1) {
      offerItem.unitPrice = offer.offerPrice;
    } else {
      resolved[offerIndex] = { ...offerItem, quantity: offerItem.quantity - 1 };
      resolved.push({ ...offerItem, quantity: 1, unitPrice: offer.offerPrice });
    }
  }

  const total = resolved.reduce((sum, it) => sum + it.unitPrice * it.quantity, 0);
  const orderId = randomUUID();

  // Efectivo se cobra al entregar: no hay nada que esperar para despacharlo,
  // entra directo como "pagado" al pool de repartidores. Transferencia sí
  // espera a que el admin confirme el comprobante.
  const status = paymentMethod === "efectivo" ? "pagado" : "pendiente_pago";

  await db.insert(orders).values({
    id: orderId,
    customerName: buyer.name,
    phone: buyer.phone,
    address: buyer.address,
    notes: buyer.notes || null,
    paymentMethod,
    status,
    total,
  });

  await db.insert(orderItems).values(
    resolved.map((it) => ({
      id: randomUUID(),
      orderId,
      productId: it.productId,
      productName: it.name,
      unitPrice: it.unitPrice,
      unitCost: it.unitCost,
      quantity: it.quantity,
    }))
  );

  // Reservamos el stock ya en este momento (se restaura si el pedido se cancela).
  for (const it of resolved) {
    await db
      .update(products)
      .set({ stock: sql`${products.stock} - ${it.quantity}` })
      .where(eq(products.id, it.productId));
  }

  if (status === "pagado") {
    await notifyRidersOfNewOrder();
  }

  return {
    orderId,
    total,
    items: resolved.map((it) => ({
      productId: it.productId,
      name: it.name,
      unitPrice: it.unitPrice,
      quantity: it.quantity,
    })),
  };
}

export async function cancelOrderAndRestoreStock(orderId: string): Promise<void> {
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  for (const item of items) {
    await db
      .update(products)
      .set({ stock: sql`${products.stock} + ${item.quantity}` })
      .where(eq(products.id, item.productId));
  }
  await db
    .update(orders)
    .set({ status: "cancelado", updatedAt: sql`(current_timestamp)` })
    .where(eq(orders.id, orderId));
}
