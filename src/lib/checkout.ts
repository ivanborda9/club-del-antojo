import { randomUUID } from "crypto";
import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { orderItems, orders, products } from "@/lib/db/schema";
import { isWithinSchedule } from "@/lib/schedule";

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
  paymentMethod: "mercadopago" | "transferencia"
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

  const total = resolved.reduce((sum, it) => sum + it.unitPrice * it.quantity, 0);
  const orderId = randomUUID();

  await db.insert(orders).values({
    id: orderId,
    customerName: buyer.name,
    phone: buyer.phone,
    address: buyer.address,
    notes: buyer.notes || null,
    paymentMethod,
    status: "pendiente_pago",
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
