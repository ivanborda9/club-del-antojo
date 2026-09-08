import { and, asc, desc, eq, gte, inArray, lte, sql } from "drizzle-orm";
import { randomUUID } from "crypto";
import { db } from "./client";
import { banners, orderItems, orders, products } from "./schema";
import type { NewBannerRow, NewProductRow, ProductRow } from "./schema";

// orders.createdAt se guarda con el formato de SQLite CURRENT_TIMESTAMP
// ("YYYY-MM-DD HH:MM:SS", en UTC) — los filtros por fecha deben usar el
// mismo formato, nunca Date#toISOString() (que agrega "T"/"Z"/milisegundos
// y compara mal como texto).
export function toSqliteTimestamp(date: Date): string {
  return date.toISOString().slice(0, 19).replace("T", " ");
}

// ---------- Productos ----------

export async function getAllProducts(): Promise<ProductRow[]> {
  return db.select().from(products).orderBy(asc(products.category), asc(products.name));
}

export async function getProductById(id: string): Promise<ProductRow | undefined> {
  const rows = await db.select().from(products).where(eq(products.id, id)).limit(1);
  return rows[0];
}

// Solo los campos que puede ver un cliente en la tienda: nunca costPrice.
export async function getStorefrontProducts() {
  const rows = await db
    .select({
      id: products.id,
      name: products.name,
      category: products.category,
      emoji: products.emoji,
      salePrice: products.salePrice,
      stock: products.stock,
    })
    .from(products)
    .where(eq(products.active, true))
    .orderBy(asc(products.category), asc(products.name));
  return rows;
}

export async function getLowStockProducts(): Promise<ProductRow[]> {
  const rows = await db.select().from(products).where(eq(products.active, true));
  return rows
    .filter((p) => p.stock <= p.lowStockThreshold)
    .sort((a, b) => a.stock - b.stock);
}

export type ProductInput = {
  name: string;
  category: string;
  emoji: string;
  costPrice: number;
  salePrice: number;
  stock: number;
  lowStockThreshold: number;
  active: boolean;
};

export async function createProduct(input: ProductInput): Promise<string> {
  const id = randomUUID();
  const row: NewProductRow = { id, ...input };
  await db.insert(products).values(row);
  return id;
}

export async function updateProduct(id: string, input: ProductInput): Promise<void> {
  await db
    .update(products)
    .set({ ...input, updatedAt: sql`(current_timestamp)` })
    .where(eq(products.id, id));
}

export async function deleteProduct(id: string): Promise<void> {
  await db.delete(products).where(eq(products.id, id));
}

// ---------- Pedidos ----------

export async function listOrders(status?: string) {
  const rows = status
    ? await db.select().from(orders).where(eq(orders.status, status as never)).orderBy(desc(orders.createdAt))
    : await db.select().from(orders).orderBy(desc(orders.createdAt));
  return rows;
}

export async function getOrderWithItems(id: string) {
  const order = (await db.select().from(orders).where(eq(orders.id, id)).limit(1))[0];
  if (!order) return null;
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, id));
  return { order, items };
}

export async function updateOrderStatus(id: string, status: string): Promise<void> {
  await db
    .update(orders)
    .set({ status: status as never, updatedAt: sql`(current_timestamp)` })
    .where(eq(orders.id, id));
}

// Restaura el stock de todos los items de un pedido (usado al cancelar).
export async function restoreStockForOrder(orderId: string): Promise<void> {
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  for (const item of items) {
    await db
      .update(products)
      .set({ stock: sql`${products.stock} + ${item.quantity}` })
      .where(eq(products.id, item.productId));
  }
}

// ---------- Banners ----------

export async function getActiveBanners() {
  const rows = await db.select().from(banners).where(eq(banners.active, true));
  return rows.sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function getAllBanners() {
  const rows = await db.select().from(banners);
  return rows.sort((a, b) => a.sortOrder - b.sortOrder);
}

export type BannerInput = {
  title: string;
  subtitle: string | null;
  emoji: string;
  active: boolean;
  sortOrder: number;
};

export async function createBanner(input: BannerInput): Promise<string> {
  const id = randomUUID();
  const row: NewBannerRow = { id, ...input };
  await db.insert(banners).values(row);
  return id;
}

export async function updateBanner(id: string, input: BannerInput): Promise<void> {
  await db.update(banners).set(input).where(eq(banners.id, id));
}

export async function deleteBanner(id: string): Promise<void> {
  await db.delete(banners).where(eq(banners.id, id));
}

// ---------- Reportes ----------

export async function getSalesReport(fromISO: string, toISO: string) {
  const paidStatuses = ["pagado", "entregado"] as const;
  const rows = await db
    .select()
    .from(orders)
    .where(
      and(
        inArray(orders.status, paidStatuses),
        gte(orders.createdAt, fromISO),
        lte(orders.createdAt, toISO)
      )
    );

  const orderIds = rows.map((o) => o.id);
  const items = orderIds.length
    ? await db.select().from(orderItems).where(inArray(orderItems.orderId, orderIds))
    : [];

  const revenue = items.reduce((sum, it) => sum + it.unitPrice * it.quantity, 0);
  const cost = items.reduce((sum, it) => sum + it.unitCost * it.quantity, 0);
  const profit = revenue - cost;

  const byProduct = new Map<
    string,
    { productId: string; productName: string; quantity: number; revenue: number }
  >();
  for (const it of items) {
    const existing = byProduct.get(it.productId);
    if (existing) {
      existing.quantity += it.quantity;
      existing.revenue += it.unitPrice * it.quantity;
    } else {
      byProduct.set(it.productId, {
        productId: it.productId,
        productName: it.productName,
        quantity: it.quantity,
        revenue: it.unitPrice * it.quantity,
      });
    }
  }
  const bestSellers = Array.from(byProduct.values()).sort((a, b) => b.quantity - a.quantity);

  return {
    orderCount: rows.length,
    revenue,
    cost,
    profit,
    averageTicket: rows.length ? revenue / rows.length : 0,
    bestSellers,
  };
}
