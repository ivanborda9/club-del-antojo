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
  description: text("description"),
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
  // "Armá tu Box": pedido armado a medida (precio fijo por tamaño, no suma
  // de los productos elegidos — esos quedan en order_items igual, para que
  // el admin vea qué poner adentro, pero no se cobran por separado).
  isBox: integer("is_box", { mode: "boolean" }).notNull().default(false),
  boxSizeName: text("box_size_name"),
  giftRecipientName: text("gift_recipient_name"),
  giftMessage: text("gift_message"),
  createdAt: text("created_at").notNull().default(sql`(current_timestamp)`),
  updatedAt: text("updated_at").notNull().default(sql`(current_timestamp)`),
});

// Tamaños disponibles para "Armá tu Box", con precio fijo cada uno
// (configurable desde el admin). La cantidad de productos que entran no
// tiene límite automático — se coordina directamente con el cliente.
export const boxSizes = sqliteTable("box_sizes", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  price: real("price").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull().default(sql`(current_timestamp)`),
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
  // Imagen de fondo del slide. Si no tiene, se usa la tarjeta con gradiente
  // (emoji + título + subtítulo) como antes.
  imageUrl: text("image_url"),
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

// Configuración general tipo clave-valor (ej. intervalo del carrusel de
// banners en segundos). Si falta una clave, el código usa un default.
export const siteSettings = sqliteTable("site_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

// Oferta que se muestra antes de pagar cuando "triggerProductId" está en el
// carrito (ej. bebida con alcohol → ofrecer hielo con descuento). Un solo
// producto gatillo tiene a lo sumo una oferta activa (unique). offerPrice es
// el precio especial de UNA unidad de offerProductId — puede ser el mismo
// producto que el gatillo (ej. "llevate la 2da unidad al 40% menos").
export const productUpsells = sqliteTable("product_upsells", {
  id: text("id").primaryKey(),
  triggerProductId: text("trigger_product_id")
    .notNull()
    .unique()
    .references(() => products.id, { onDelete: "cascade" }),
  offerProductId: text("offer_product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  offerPrice: real("offer_price").notNull(),
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
export type CategoryScheduleRow = typeof categorySchedules.$inferSelect;
export type NewCategoryScheduleRow = typeof categorySchedules.$inferInsert;
export type SiteSettingRow = typeof siteSettings.$inferSelect;
export type NewSiteSettingRow = typeof siteSettings.$inferInsert;
export type ProductUpsellRow = typeof productUpsells.$inferSelect;
export type NewProductUpsellRow = typeof productUpsells.$inferInsert;
export type BoxSizeRow = typeof boxSizes.$inferSelect;
export type NewBoxSizeRow = typeof boxSizes.$inferInsert;
