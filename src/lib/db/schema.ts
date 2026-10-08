import { sql } from "drizzle-orm";
import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const products = sqliteTable("products", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  // Agrupador opcional por encima de la categoría (ej. categoría "Kiosco"
  // con subcategorías "Chocolates", "Alfajores", etc). Sin asignar, el
  // producto queda en el grupo "Sin categoría" en el admin.
  parentCategory: text("parent_category"),
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
    enum: ["mercadopago", "transferencia", "efectivo"],
  }).notNull(),
  status: text("status", {
    enum: ["pendiente_pago", "pagado", "en_camino", "entregado", "cancelado"],
  })
    .notNull()
    .default("pendiente_pago"),
  total: real("total").notNull(),
  mpPreferenceId: text("mp_preference_id"),
  mpPaymentId: text("mp_payment_id"),
  riderId: text("rider_id"),
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

export const riders = sqliteTable("riders", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  lastSeenAt: text("last_seen_at"),
  createdAt: text("created_at").notNull().default(sql`(current_timestamp)`),
});

export const pushSubscriptions = sqliteTable("push_subscriptions", {
  id: text("id").primaryKey(),
  riderId: text("rider_id")
    .notNull()
    .references(() => riders.id, { onDelete: "cascade" }),
  endpoint: text("endpoint").notNull().unique(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  createdAt: text("created_at").notNull().default(sql`(current_timestamp)`),
});

export const banners = sqliteTable("banners", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  subtitle: text("subtitle"),
  emoji: text("emoji").notNull().default("🎉"),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  // A dónde lleva al tocarlo: "product" + el id, "category" + el nombre, o
  // ninguno de los dos (banner solo informativo, sin link).
  linkType: text("link_type", { enum: ["product", "category"] }),
  linkValue: text("link_value"),
  // Mismo patrón de horario que los productos ("HH:MM", soporta cruzar
  // medianoche). Si ambos son null, se muestra todo el día.
  scheduleStart: text("schedule_start"),
  scheduleEnd: text("schedule_end"),
  createdAt: text("created_at").notNull().default(sql`(current_timestamp)`),
});

// Horario por categoría completa (ej. "Bebidas con alcohol" solo de noche).
// Una categoría sin fila acá está disponible todo el día. El nombre debe
// coincidir exactamente con products.category.
export const categorySchedules = sqliteTable("category_schedules", {
  id: text("id").primaryKey(),
  category: text("category").notNull().unique(),
  scheduleStart: text("schedule_start").notNull(),
  scheduleEnd: text("schedule_end").notNull(),
  createdAt: text("created_at").notNull().default(sql`(current_timestamp)`),
});

// Carrusel de texto que se desliza arriba de todo en la tienda (ej. "3
// cuotas sin interés"). Varios mensajes activos se concatenan en el mismo
// desplazamiento continuo.
export const marqueeMessages = sqliteTable("marquee_messages", {
  id: text("id").primaryKey(),
  text: text("text").notNull(),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  // Mismo patrón "HH:MM" que banners/productos; ambos null = todo el día.
  scheduleStart: text("schedule_start"),
  scheduleEnd: text("schedule_end"),
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
export type RiderRow = typeof riders.$inferSelect;
export type NewRiderRow = typeof riders.$inferInsert;
export type PushSubscriptionRow = typeof pushSubscriptions.$inferSelect;
export type NewPushSubscriptionRow = typeof pushSubscriptions.$inferInsert;
export type MarqueeMessageRow = typeof marqueeMessages.$inferSelect;
export type NewMarqueeMessageRow = typeof marqueeMessages.$inferInsert;
export type CategoryScheduleRow = typeof categorySchedules.$inferSelect;
export type NewCategoryScheduleRow = typeof categorySchedules.$inferInsert;
