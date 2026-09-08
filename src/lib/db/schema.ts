import { sql } from "drizzle-orm";
import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const products = sqliteTable("products", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  emoji: text("emoji").notNull().default("🛒"),
  imageUrl: text("image_url"),
  costPrice: real("cost_price").notNull().default(0),
  salePrice: real("sale_price").notNull(),
  stock: integer("stock").notNull().default(0),
  lowStockThreshold: integer("low_stock_threshold").notNull().default(5),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  // Horario de disponibilidad ("HH:MM", 24hs). Si ambos son null, el
  // producto está disponible todo el día (según "active"). Soporta rangos
  // que cruzan la medianoche, ej. 22:00–06:00.
  scheduleStart: text("schedule_start"),
  scheduleEnd: text("schedule_end"),
  createdAt: text("created_at").notNull().default(sql`(current_timestamp)`),
  updatedAt: text("updated_at").notNull().default(sql`(current_timestamp)`),
});

export const orders = sqliteTable("orders", {
  id: text("id").primaryKey(),
  customerName: text("customer_name").notNull(),
  phone: text("phone").notNull(),
  address: text("address").notNull(),
  notes: text("notes"),
  paymentMethod: text("payment_method", {
    enum: ["mercadopago", "transferencia"],
  }).notNull(),
  status: text("status", {
    enum: ["pendiente_pago", "pagado", "entregado", "cancelado"],
  })
    .notNull()
    .default("pendiente_pago"),
  total: real("total").notNull(),
  mpPreferenceId: text("mp_preference_id"),
  mpPaymentId: text("mp_payment_id"),
  createdAt: text("created_at").notNull().default(sql`(current_timestamp)`),
  updatedAt: text("updated_at").notNull().default(sql`(current_timestamp)`),
});

export const orderItems = sqliteTable("order_items", {
  id: text("id").primaryKey(),
  orderId: text("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  productId: text("product_id").notNull(),
  productName: text("product_name").notNull(),
  unitPrice: real("unit_price").notNull(),
  unitCost: real("unit_cost").notNull(),
  quantity: integer("quantity").notNull(),
});

export const banners = sqliteTable("banners", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  subtitle: text("subtitle"),
  emoji: text("emoji").notNull().default("🎉"),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: text("created_at").notNull().default(sql`(current_timestamp)`),
});

export type ProductRow = typeof products.$inferSelect;
export type NewProductRow = typeof products.$inferInsert;
export type OrderRow = typeof orders.$inferSelect;
export type NewOrderRow = typeof orders.$inferInsert;
export type OrderItemRow = typeof orderItems.$inferSelect;
export type NewOrderItemRow = typeof orderItems.$inferInsert;
export type BannerRow = typeof banners.$inferSelect;
export type NewBannerRow = typeof banners.$inferInsert;
