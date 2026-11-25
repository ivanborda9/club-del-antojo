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
  // Si se puede elegir como contenido de "Armá tu Box". Apagado por
  // defecto: hay que habilitarlo producto por producto, no todo lo
  // publicado tiene que poder entrar en un box.
  includeInBox: integer("include_in_box", { mode: "boolean" }).notNull().default(false),
  // Si se puede ofrecer con descuento en el cartel de "agregá algo más"
  // del checkout (ej. bebidas, cuando el carrito tiene un producto de
  // "Salvá la Comida" y todavía no tiene ninguna bebida). Configurable
  // desde /admin/promos.
  cartPromoEligible: integer("cart_promo_eligible", { mode: "boolean" }).notNull().default(false),
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
  // Costo de envío ya incluido en "total" (se muestra aparte para el
  // cliente y es lo que cobra el repartidor por esta entrega). Calculado
  // según franja horaria/día y distancia al hacer el pedido.
  shippingCost: real("shipping_cost").notNull().default(0),
  shippingDistanceKm: real("shipping_distance_km"),
  mpPreferenceId: text("mp_preference_id"),
  mpPaymentId: text("mp_payment_id"),
  riderId: text("rider_id"),
  // "Armá tu Box": pedido armado a medida (precio fijo por tamaño, no suma
  // de los productos elegidos — esos quedan en order_items igual, para que
  // el admin vea qué poner adentro, pero no se cobran por separado).
  isBox: integer("is_box", { mode: "boolean" }).notNull().default(false),
  boxSizeId: text("box_size_id"),
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
  // Foto de la caja/bolsa (para que el comprador vea cómo es antes de
  // elegir el tamaño), opcional.
  imageUrl: text("image_url"),
  // Cuántas cajas/bolsas de este tamaño quedan disponibles. Se descuenta 1
  // por pedido (cada pedido de box es una sola caja).
  stock: integer("stock").notNull().default(0),
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
  // Variedad elegida, para productos con variantes (ej. "Combo pizza
  // especial" → qué sabor). Null si el producto no tiene variantes.
  variantId: text("variant_id"),
  variantName: text("variant_name"),
});

// Variedades de un producto entre las que el cliente tiene que elegir una
// (ej. "Combo 1 muzza + 1 especial" → sabor de la especial), cada una con
// su propio stock. Un producto sin filas acá se vende como siempre, sin
// selector de variedad.
export const productVariants = sqliteTable("product_variants", {
  id: text("id").primaryKey(),
  productId: text("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  stock: integer("stock").notNull().default(0),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: text("created_at").notNull().default(sql`(current_timestamp)`),
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

// Suscripciones push del panel admin (dueño/a y encargado/a): no hay una
// cuenta individual por persona (la contraseña es compartida por rol), así
// que guardamos el rol del dispositivo que se suscribió, para poder avisar
// por celular cuando entra un pedido nuevo sin depender de tener la pestaña
// abierta.
export const adminPushSubscriptions = sqliteTable("admin_push_subscriptions", {
  id: text("id").primaryKey(),
  role: text("role").notNull(),
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

// Orden manual en que se muestran las categorías en la tienda (solapas y
// filas del carrusel de inicio). Una categoría sin fila acá se ordena al
// final, alfabéticamente entre las demás sin orden. El nombre debe
// coincidir exactamente con products.category — también determina el
// orden de las solapas padre (según la primera subcategoría suya que
// aparezca en el orden final).
export const categorySortOrder = sqliteTable("category_sort_order", {
  category: text("category").primaryKey(),
  sortOrder: integer("sort_order").notNull().default(0),
});

// Configuración general tipo clave-valor (ej. intervalo del carrusel de
// banners en segundos, ubicación del local para calcular distancias de
// envío). Si falta una clave, el código usa un default.
export const siteSettings = sqliteTable("site_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

// Reglas de precio de envío: combinan día de la semana + franja horaria +
// distancia máxima desde el local. Al pagar, se busca la regla activa que
// coincida con el momento del pedido y la distancia calculada, con el
// menor "maxDistanceKm" que la cubra (la más "ajustada" primero). Si
// ninguna coincide, se usa el envío por defecto (site_settings).
export const shippingRates = sqliteTable("shipping_rates", {
  id: text("id").primaryKey(),
  // Solo para identificarla en el admin (ej. "Centro de día").
  label: text("label").notNull(),
  // Días de la semana en que aplica, 0=domingo..6=sábado, separados por
  // coma (ej. "1,2,3,4,5" para lunes a viernes).
  daysOfWeek: text("days_of_week").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  maxDistanceKm: real("max_distance_km").notNull(),
  price: real("price").notNull(),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull().default(sql`(current_timestamp)`),
});

// Horarios de atención: la tienda se considera abierta si el momento
// actual cae dentro de alguna de estas filas (días + franja horaria). Sin
// ninguna fila cargada, se considera siempre abierta (no bloquea ventas
// por accidente en una tienda que todavía no configuró esto). El cierre o
// apertura forzados manuales van aparte, en site_settings.
export const businessHours = sqliteTable("business_hours", {
  id: text("id").primaryKey(),
  // Días de la semana en que aplica, 0=domingo..6=sábado, separados por coma.
  daysOfWeek: text("days_of_week").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  createdAt: text("created_at").notNull().default(sql`(current_timestamp)`),
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
export type AdminPushSubscriptionRow = typeof adminPushSubscriptions.$inferSelect;
export type NewAdminPushSubscriptionRow = typeof adminPushSubscriptions.$inferInsert;
export type CategoryScheduleRow = typeof categorySchedules.$inferSelect;
export type NewCategoryScheduleRow = typeof categorySchedules.$inferInsert;
export type SiteSettingRow = typeof siteSettings.$inferSelect;
export type NewSiteSettingRow = typeof siteSettings.$inferInsert;
export type ProductUpsellRow = typeof productUpsells.$inferSelect;
export type NewProductUpsellRow = typeof productUpsells.$inferInsert;
export type BoxSizeRow = typeof boxSizes.$inferSelect;
export type NewBoxSizeRow = typeof boxSizes.$inferInsert;
export type ProductVariantRow = typeof productVariants.$inferSelect;
export type NewProductVariantRow = typeof productVariants.$inferInsert;
export type ShippingRateRow = typeof shippingRates.$inferSelect;
export type NewShippingRateRow = typeof shippingRates.$inferInsert;
export type BusinessHourRow = typeof businessHours.$inferSelect;
export type NewBusinessHourRow = typeof businessHours.$inferInsert;
