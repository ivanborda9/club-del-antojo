import { randomUUID } from "crypto";
import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { boxSizes, orderItems, orders, products } from "@/lib/db/schema";
import { isWithinSchedule } from "@/lib/schedule";
import { notifyRidersOfNewOrder } from "@/lib/push";
import { CheckoutError } from "@/lib/checkout";
import type { Buyer, CheckoutItemInput } from "@/lib/checkout";

export type BoxGift = { recipientName: string; message: string };

export type CreatedBoxOrder = { orderId: string; total: number; boxSizeName: string };

// "Armá tu Box": precio fijo según el tamaño (no la suma de lo elegido). Los
// productos elegidos quedan en order_items igual, para que el admin sepa
// qué poner adentro, y restan stock real — pero no se cobran por separado.
// La cantidad de productos no tiene tope automático (se coordina con el
// cliente), solo se valida que cada uno exista, esté activo y tenga stock.
export async function createBoxOrderFromSelection(
  boxSizeId: string,
  itemsInput: CheckoutItemInput[],
  buyer: Buyer,
  gift: BoxGift,
  paymentMethod: "mercadopago" | "transferencia" | "efectivo"
): Promise<CreatedBoxOrder> {
  if (!itemsInput.length) {
    throw new CheckoutError("Elegí al menos un producto para el box.");
  }
  if (!gift.recipientName.trim()) {
    throw new CheckoutError("Falta el nombre de quién recibe el regalo.");
  }

  const sizeRows = await db.select().from(boxSizes).where(eq(boxSizes.id, boxSizeId)).limit(1);
  const size = sizeRows[0];
  if (!size || !size.active) {
    throw new CheckoutError("Ese tamaño de box ya no está disponible.");
  }

  const resolved: {
    productId: string;
    name: string;
    unitPrice: number;
    unitCost: number;
    quantity: number;
  }[] = [];

  for (const { productId, quantity } of itemsInput) {
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new CheckoutError("Cantidad inválida en el box.");
    }
    const rows = await db.select().from(products).where(eq(products.id, productId)).limit(1);
    const product = rows[0];
    if (!product || !product.active) {
      throw new CheckoutError("Uno de los productos elegidos ya no está disponible.");
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

  const total = size.price;
  const orderId = randomUUID();
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
    isBox: true,
    boxSizeName: size.name,
    giftRecipientName: gift.recipientName.trim(),
    giftMessage: gift.message.trim() || null,
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

  for (const it of resolved) {
    await db
      .update(products)
      .set({ stock: sql`${products.stock} - ${it.quantity}` })
      .where(eq(products.id, it.productId));
  }

  if (status === "pagado") {
    await notifyRidersOfNewOrder();
  }

  return { orderId, total, boxSizeName: size.name };
}
