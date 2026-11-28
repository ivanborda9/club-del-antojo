import { randomUUID } from "crypto";
import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { boxSizes, orderItems, orders, products } from "@/lib/db/schema";
import { isStoreOpenNow } from "@/lib/db/queries";
import { isWithinSchedule } from "@/lib/schedule";
import { notifyAdminsOfNewOrder, notifyRidersOfNewOrder } from "@/lib/push";
import { CheckoutError } from "@/lib/checkout";
import { CASH_DISCOUNT_RATE } from "@/lib/pricing";
import { calculateShippingForAddress } from "@/lib/shippingCalculator";
import type { Buyer, CheckoutItemInput } from "@/lib/checkout";

export type BoxGift = { recipientName: string; message: string };

export type CreatedBoxOrder = {
  orderId: string;
  total: number;
  shippingCost: number;
  boxSizeName: string;
};

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
  paymentMethod: "mercadopago" | "transferencia" | "efectivo" | "qr"
): Promise<CreatedBoxOrder> {
  if (!itemsInput.length) {
    throw new CheckoutError("Elegí al menos un producto para el box.");
  }
  if (!(await isStoreOpenNow())) {
    throw new CheckoutError(
      "En este momento no estamos atendiendo. Volvé a intentar cuando volvamos a abrir."
    );
  }
  if (!gift.recipientName.trim()) {
    throw new CheckoutError("Falta el nombre de quién recibe el regalo.");
  }

  const sizeRows = await db.select().from(boxSizes).where(eq(boxSizes.id, boxSizeId)).limit(1);
  const size = sizeRows[0];
  if (!size || !size.active) {
    throw new CheckoutError("Ese tamaño de box ya no está disponible.");
  }
  if (size.stock <= 0) {
    throw new CheckoutError(`No queda stock del tamaño "${size.name}".`);
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
    if (product.comingSoon) {
      throw new CheckoutError(`"${product.name}" todavía no está disponible para comprar (próximamente).`);
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

  // Mismo incentivo por pagar en efectivo que en el checkout normal.
  const boxPrice =
    paymentMethod === "efectivo"
      ? Math.round(size.price * (1 - CASH_DISCOUNT_RATE))
      : size.price;

  // Envío: igual que en el checkout normal, nunca se descuenta.
  const { cost: shippingCost, distanceKm } = await calculateShippingForAddress(buyer.address);
  const total = boxPrice + shippingCost;

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
    shippingCost,
    shippingDistanceKm: distanceKm,
    isBox: true,
    boxSizeId: size.id,
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

  await db
    .update(boxSizes)
    .set({ stock: sql`${boxSizes.stock} - 1` })
    .where(eq(boxSizes.id, size.id));

  if (status === "pagado") {
    await notifyRidersOfNewOrder();
    await notifyAdminsOfNewOrder();
  }

  return { orderId, total, shippingCost, boxSizeName: size.name };
}
