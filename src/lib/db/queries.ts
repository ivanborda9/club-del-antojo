import { and, asc, desc, eq, gte, inArray, isNull, lte, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/sqlite-core";
import { randomUUID } from "crypto";
import { db } from "./client";
import {
  adminPushSubscriptions,
  banners,
  boxSizes,
  businessHours,
  categorySchedules,
  categorySortOrder,
  orderItems,
  orders,
  productUpsells,
  productVariants,
  products,
  pushSubscriptions,
  riders,
  shippingRates,
  siteSettings,
} from "./schema";
import type {
  NewAdminPushSubscriptionRow,
  NewBannerRow,
  NewBoxSizeRow,
  NewCategoryScheduleRow,
  NewProductRow,
  NewPushSubscriptionRow,
  NewRiderRow,
  ProductRow,
  RiderRow,
} from "./schema";
import { getCurrentLocalDayOfWeek, getCurrentLocalTime, isWithinSchedule } from "@/lib/schedule";

// Para funciones "decorativas" (no esenciales para vender) cuya tabla
// puede no existir todavía en producción si falta una migración: que un
// error ahí no tumbe páginas críticas como la portada. Ya pasó más de una
// vez con una tabla nueva sin aplicar — mejor degradar en silencio que
// romper toda la tienda por un carrusel de texto.
async function safeQuery<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    console.error("[safeQuery] falló una consulta no esencial, uso el valor por defecto:", err);
    return fallback;
  }
}

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
// Los productos con horario configurado se ocultan fuera de su ventana, y
// también los de una categoría restringida completa (ej. bebidas con
// alcohol): mientras esté fuera de horario, no quedan rastros ni del
// producto ni de la categoría (la pestaña desaparece sola porque se arma
// a partir de esta misma lista, ya filtrada).
export async function getStorefrontProducts() {
  const [rows, restrictedCategories, variantRows, comingSoonRows] = await Promise.all([
    db
      .select({
        id: products.id,
        name: products.name,
        category: products.category,
        parentCategory: products.parentCategory,
        emoji: products.emoji,
        imageUrl: products.imageUrl,
        description: products.description,
        salePrice: products.salePrice,
        stock: products.stock,
        scheduleStart: products.scheduleStart,
        scheduleEnd: products.scheduleEnd,
      })
      .from(products)
      .where(eq(products.active, true))
      .orderBy(asc(products.category), asc(products.name)),
    safeQuery(() => getAllCategorySchedules(), []),
    // Variantes (ej. sabores de una pizza en un combo): si falta la
    // migración, los productos simplemente no muestran selector.
    safeQuery(() => db.select().from(productVariants).orderBy(asc(productVariants.sortOrder)), []),
    // "Próximamente": selecteado aparte y con safeQuery para que, si falta
    // la migración, la tienda siga funcionando (todo se trata como
    // disponible) en vez de romperse por completo.
    safeQuery(
      () => db.select({ id: products.id, comingSoon: products.comingSoon }).from(products),
      []
    ),
  ]);

  const categoryScheduleByName = new Map(
    restrictedCategories.map((c) => [c.category, c])
  );
  const variantsByProductId = new Map<string, { id: string; name: string; stock: number }[]>();
  for (const v of variantRows) {
    const list = variantsByProductId.get(v.productId) ?? [];
    list.push({ id: v.id, name: v.name, stock: v.stock });
    variantsByProductId.set(v.productId, list);
  }
  const comingSoonById = new Map(comingSoonRows.map((r) => [r.id, r.comingSoon]));

  return rows
    .filter((p) => isWithinSchedule(p.scheduleStart, p.scheduleEnd))
    .filter((p) => {
      const categorySchedule = categoryScheduleByName.get(p.category);
      if (!categorySchedule) return true;
      return isWithinSchedule(categorySchedule.scheduleStart, categorySchedule.scheduleEnd);
    })
    .map((p) => {
      const variants = variantsByProductId.get(p.id);
      return {
        id: p.id,
        name: p.name,
        category: p.category,
        parentCategory: p.parentCategory,
        emoji: p.emoji,
        imageUrl: p.imageUrl,
        description: p.description,
        salePrice: p.salePrice,
        stock: p.stock,
        comingSoon: comingSoonById.get(p.id) ?? false,
        ...(variants && variants.length > 0 ? { variants } : {}),
      };
    });
}

// Productos que se pueden elegir para "Armá tu Box" (subconjunto de los
// publicados: hay que habilitarlos uno por uno desde el admin). Mismo
// criterio de horario que el resto de la tienda. Envuelto en safeQuery:
// si falta la migración de "include_in_box", el armador de box muestra
// la lista vacía en vez de romper la página.
export async function getBoxEligibleProducts() {
  return safeQuery(async () => {
    const [rows, restrictedCategories] = await Promise.all([
      db
        .select({
          id: products.id,
          name: products.name,
          category: products.category,
          parentCategory: products.parentCategory,
          emoji: products.emoji,
          imageUrl: products.imageUrl,
          description: products.description,
          salePrice: products.salePrice,
          stock: products.stock,
          scheduleStart: products.scheduleStart,
          scheduleEnd: products.scheduleEnd,
        })
        .from(products)
        .where(
          and(
            eq(products.active, true),
            eq(products.includeInBox, true),
            eq(products.comingSoon, false)
          )
        )
        .orderBy(asc(products.category), asc(products.name)),
      safeQuery(() => getAllCategorySchedules(), []),
    ]);

    const categoryScheduleByName = new Map(
      restrictedCategories.map((c) => [c.category, c])
    );

    return rows
      .filter((p) => isWithinSchedule(p.scheduleStart, p.scheduleEnd))
      .filter((p) => {
        const categorySchedule = categoryScheduleByName.get(p.category);
        if (!categorySchedule) return true;
        return isWithinSchedule(categorySchedule.scheduleStart, categorySchedule.scheduleEnd);
      })
      .map((p) => ({
        id: p.id,
        name: p.name,
        category: p.category,
        parentCategory: p.parentCategory,
        emoji: p.emoji,
        imageUrl: p.imageUrl,
        description: p.description,
        salePrice: p.salePrice,
        stock: p.stock,
        comingSoon: false,
      }));
  }, []);
}

export async function getLowStockProducts(): Promise<ProductRow[]> {
  const rows = await db.select().from(products).where(eq(products.active, true));
  return rows
    .filter((p) => p.stock <= p.lowStockThreshold)
    .sort((a, b) => a.stock - b.stock);
}

// ---------- Horario por categoría ----------

export async function getAllCategorySchedules() {
  return db.select().from(categorySchedules);
}

export async function getCategorySchedule(category: string) {
  return (
    await db
      .select()
      .from(categorySchedules)
      .where(eq(categorySchedules.category, category))
      .limit(1)
  )[0];
}

// Crea o actualiza el horario de una categoría completa (ej. "Bebidas con
// alcohol" solo disponible de noche).
export async function setCategorySchedule(
  category: string,
  scheduleStart: string,
  scheduleEnd: string
): Promise<void> {
  const existing = await getCategorySchedule(category);
  if (existing) {
    await db
      .update(categorySchedules)
      .set({ scheduleStart, scheduleEnd })
      .where(eq(categorySchedules.category, category));
    return;
  }
  const row: NewCategoryScheduleRow = { id: randomUUID(), category, scheduleStart, scheduleEnd };
  await db.insert(categorySchedules).values(row);
}

// Vuelve a dejar la categoría disponible todo el día.
export async function clearCategorySchedule(category: string): Promise<void> {
  await db.delete(categorySchedules).where(eq(categorySchedules.category, category));
}

// ---------- Horario de atención (tienda abierta/cerrada) ----------

const STORE_OVERRIDE_SETTING_KEY = "store_override";
export type StoreOverride = "" | "open" | "closed";

// Horarios en que la tienda atiende: abierta si el momento actual cae en
// alguna fila (OR entre ellas, por si hay distintos horarios según el
// día). Envuelto en safeQuery: si falta la migración, no hay filas y se
// considera siempre abierta.
export async function getAllBusinessHours() {
  return safeQuery(async () => db.select().from(businessHours), []);
}

export async function addBusinessHour(
  daysOfWeek: string,
  startTime: string,
  endTime: string
): Promise<string> {
  const id = randomUUID();
  await db.insert(businessHours).values({ id, daysOfWeek, startTime, endTime });
  return id;
}

export async function deleteBusinessHour(id: string): Promise<void> {
  await db.delete(businessHours).where(eq(businessHours.id, id));
}

// Forzado manual: "open"/"closed" ignora el horario configurado; ""
// (default) sigue el horario automático.
export async function getStoreOverride(): Promise<StoreOverride> {
  return safeQuery(async () => {
    const row = (
      await db
        .select()
        .from(siteSettings)
        .where(eq(siteSettings.key, STORE_OVERRIDE_SETTING_KEY))
        .limit(1)
    )[0];
    return (row?.value as StoreOverride) ?? "";
  }, "");
}

export async function setStoreOverride(value: StoreOverride): Promise<void> {
  await db
    .insert(siteSettings)
    .values({ key: STORE_OVERRIDE_SETTING_KEY, value })
    .onConflictDoUpdate({ target: siteSettings.key, set: { value } });
}

// Si la tienda está abierta ahora mismo: el forzado manual manda si está
// seteado, si no se fija si el momento actual cae en algún horario
// configurado (sin ninguno cargado, se considera siempre abierta).
export async function isStoreOpenNow(): Promise<boolean> {
  const override = await getStoreOverride();
  if (override === "open") return true;
  if (override === "closed") return false;

  const hours = await getAllBusinessHours();
  if (hours.length === 0) return true;

  const today = getCurrentLocalDayOfWeek();
  const now = getCurrentLocalTime();
  return hours.some((h) => {
    const days = h.daysOfWeek.split(",").map(Number);
    return days.includes(today) && isWithinSchedule(h.startTime, h.endTime, now);
  });
}

// ---------- Orden de categorías ----------

// Orden manual de las categorías en la tienda. Envuelto en safeQuery: si
// falta la migración de "category_sort_order", la home ordena alfabético
// en vez de romperse.
export async function getCategorySortOrders() {
  return safeQuery(async () => db.select().from(categorySortOrder), []);
}

// Reemplazo completo del orden (para el formulario del admin, que manda
// todas las categorías a la vez). sortOrder null borra la fila (la
// categoría vuelve a ordenarse al final, alfabética).
export async function setCategorySortOrders(
  entries: { category: string; sortOrder: number | null }[]
): Promise<void> {
  for (const { category, sortOrder } of entries) {
    if (sortOrder === null) {
      await db.delete(categorySortOrder).where(eq(categorySortOrder.category, category));
      continue;
    }
    await db
      .insert(categorySortOrder)
      .values({ category, sortOrder })
      .onConflictDoUpdate({ target: categorySortOrder.category, set: { sortOrder } });
  }
}

// ---------- Envío ----------

const SHIPPING_SETTING_KEYS = {
  originAddress: "shipping_origin_address",
  originLat: "shipping_origin_lat",
  originLng: "shipping_origin_lng",
  defaultPrice: "shipping_default_price",
} as const;

export type StoreOrigin = { address: string | null; lat: number | null; lng: number | null };

// Ubicación del local, usada como punto de partida para calcular la
// distancia de cada envío. Envuelto en safeQuery: sin esto configurado
// (o sin la migración), no se puede calcular distancia — el llamador usa
// el envío por defecto en ese caso.
export async function getStoreOrigin(): Promise<StoreOrigin> {
  return safeQuery(async () => {
    const rows = await db
      .select()
      .from(siteSettings)
      .where(
        inArray(siteSettings.key, [
          SHIPPING_SETTING_KEYS.originAddress,
          SHIPPING_SETTING_KEYS.originLat,
          SHIPPING_SETTING_KEYS.originLng,
        ])
      );
    const byKey = new Map(rows.map((r) => [r.key, r.value]));
    const lat = Number(byKey.get(SHIPPING_SETTING_KEYS.originLat));
    const lng = Number(byKey.get(SHIPPING_SETTING_KEYS.originLng));
    return {
      address: byKey.get(SHIPPING_SETTING_KEYS.originAddress) ?? null,
      lat: Number.isFinite(lat) ? lat : null,
      lng: Number.isFinite(lng) ? lng : null,
    };
  }, { address: null, lat: null, lng: null });
}

export async function setStoreOrigin(address: string, lat: number, lng: number): Promise<void> {
  const entries: [string, string][] = [
    [SHIPPING_SETTING_KEYS.originAddress, address],
    [SHIPPING_SETTING_KEYS.originLat, String(lat)],
    [SHIPPING_SETTING_KEYS.originLng, String(lng)],
  ];
  for (const [key, value] of entries) {
    await db
      .insert(siteSettings)
      .values({ key, value })
      .onConflictDoUpdate({ target: siteSettings.key, set: { value } });
  }
}

export async function getDefaultShippingPrice(): Promise<number> {
  return safeQuery(async () => {
    const row = (
      await db
        .select()
        .from(siteSettings)
        .where(eq(siteSettings.key, SHIPPING_SETTING_KEYS.defaultPrice))
        .limit(1)
    )[0];
    const parsed = row ? Number(row.value) : 0;
    return Number.isFinite(parsed) ? parsed : 0;
  }, 0);
}

export async function setDefaultShippingPrice(price: number): Promise<void> {
  const value = String(Math.max(0, price));
  await db
    .insert(siteSettings)
    .values({ key: SHIPPING_SETTING_KEYS.defaultPrice, value })
    .onConflictDoUpdate({ target: siteSettings.key, set: { value } });
}

// Reglas de precio de envío, ordenadas por distancia (la más ajustada
// primero) para que el que busca una coincidencia tome la primera que
// cubra la distancia real. Envuelto en safeQuery: si falta la migración,
// no hay reglas y se usa el envío por defecto.
export async function getAllShippingRates() {
  return safeQuery(async () => {
    const rows = await db.select().from(shippingRates);
    return rows.sort((a, b) => a.maxDistanceKm - b.maxDistanceKm);
  }, []);
}

export type ShippingRateInput = {
  label: string;
  daysOfWeek: string;
  startTime: string;
  endTime: string;
  maxDistanceKm: number;
  price: number;
  active: boolean;
};

export async function createShippingRate(input: ShippingRateInput): Promise<string> {
  const id = randomUUID();
  await db.insert(shippingRates).values({ id, ...input });
  return id;
}

export async function updateShippingRate(id: string, input: ShippingRateInput): Promise<void> {
  await db.update(shippingRates).set(input).where(eq(shippingRates.id, id));
}

export async function deleteShippingRate(id: string): Promise<void> {
  await db.delete(shippingRates).where(eq(shippingRates.id, id));
}

export type ProductInput = {
  name: string;
  category: string;
  parentCategory: string | null;
  emoji: string;
  imageUrl: string | null;
  description: string | null;
  costPrice: number;
  salePrice: number;
  stock: number;
  lowStockThreshold: number;
  active: boolean;
  includeInBox: boolean;
  comingSoon: boolean;
  scheduleStart: string | null;
  scheduleEnd: string | null;
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

// Para la pantalla de "Stock" (acceso simplificado, sin precios ni
// ganancia — pensada para un rol sin acceso al resto del admin).
export async function updateProductStock(id: string, stock: number): Promise<void> {
  await db
    .update(products)
    .set({ stock, updatedAt: sql`(current_timestamp)` })
    .where(eq(products.id, id));
}

export async function deleteProduct(id: string): Promise<void> {
  await db.delete(products).where(eq(products.id, id));
}

// ---------- Variantes de producto ----------

// Variedades de un producto (ej. sabores de pizza), para administrarlas
// desde la página de editar producto. Envuelto en safeQuery: si falta la
// migración, la página no se tiene que romper por esto.
export async function getVariantsForProduct(productId: string) {
  return safeQuery(async () => {
    const rows = await db
      .select()
      .from(productVariants)
      .where(eq(productVariants.productId, productId));
    return rows.sort((a, b) => a.sortOrder - b.sortOrder);
  }, []);
}

// Todas las variantes de todos los productos, para la pantalla de Stock
// (agrupa por producto ahí mismo en vez de consultar una por una).
export async function getAllProductVariants() {
  return safeQuery(async () => {
    const rows = await db.select().from(productVariants);
    return rows.sort((a, b) => a.sortOrder - b.sortOrder);
  }, []);
}

export async function createProductVariant(
  productId: string,
  name: string,
  stock: number,
  sortOrder: number
): Promise<string> {
  const id = randomUUID();
  await db.insert(productVariants).values({ id, productId, name, stock, sortOrder });
  return id;
}

export async function updateProductVariantStock(id: string, stock: number): Promise<void> {
  await db.update(productVariants).set({ stock }).where(eq(productVariants.id, id));
}

export async function deleteProductVariant(id: string): Promise<void> {
  await db.delete(productVariants).where(eq(productVariants.id, id));
}

export async function getVariantById(id: string) {
  return (await db.select().from(productVariants).where(eq(productVariants.id, id)).limit(1))[0];
}

// ---------- Ofertas antes de pagar (upsell) ----------

// La oferta configurada para un producto gatillo, con los datos del
// producto ofrecido (para mostrarlos en el admin). Envuelto en safeQuery:
// si todavía falta aplicar la migración de "product_upsells", la página de
// editar producto no se tiene que romper por esto.
export async function getUpsellForProduct(triggerProductId: string) {
  return safeQuery(async () => {
    const rows = await db
      .select({
        id: productUpsells.id,
        triggerProductId: productUpsells.triggerProductId,
        offerProductId: productUpsells.offerProductId,
        offerPrice: productUpsells.offerPrice,
        offerProductName: products.name,
      })
      .from(productUpsells)
      .innerJoin(products, eq(products.id, productUpsells.offerProductId))
      .where(eq(productUpsells.triggerProductId, triggerProductId))
      .limit(1);
    return rows[0];
  }, undefined);
}

// Crea o reemplaza la oferta de un producto gatillo (a lo sumo una por
// producto).
export async function setProductUpsell(
  triggerProductId: string,
  offerProductId: string,
  offerPrice: number
): Promise<void> {
  const existing = await db
    .select()
    .from(productUpsells)
    .where(eq(productUpsells.triggerProductId, triggerProductId))
    .limit(1);
  if (existing[0]) {
    await db
      .update(productUpsells)
      .set({ offerProductId, offerPrice })
      .where(eq(productUpsells.triggerProductId, triggerProductId));
    return;
  }
  await db
    .insert(productUpsells)
    .values({ id: randomUUID(), triggerProductId, offerProductId, offerPrice });
}

export async function clearProductUpsell(triggerProductId: string): Promise<void> {
  await db.delete(productUpsells).where(eq(productUpsells.triggerProductId, triggerProductId));
}

// Ofertas aplicables para el carrito actual: el producto gatillo está en
// `productIds`. Se usa tanto para mostrar el cartel en el checkout como
// (de nuevo, server-side) para aplicar el precio especial al crear el
// pedido — nunca se confía en lo que mande el cliente. Envuelto en
// safeQuery: si falta la migración, el checkout sigue funcionando sin
// ofertas en vez de romperse.
export async function getUpsellOffersForProductIds(productIds: string[]) {
  return safeQuery(async () => {
    if (!productIds.length) return [];
    const rows = await db
      .select({
        triggerProductId: productUpsells.triggerProductId,
        offerProductId: productUpsells.offerProductId,
        offerPrice: productUpsells.offerPrice,
        offerProduct: {
          id: products.id,
          name: products.name,
          emoji: products.emoji,
          imageUrl: products.imageUrl,
          salePrice: products.salePrice,
          stock: products.stock,
          active: products.active,
        },
      })
      .from(productUpsells)
      .innerJoin(products, eq(products.id, productUpsells.offerProductId))
      .where(inArray(productUpsells.triggerProductId, productIds));
    return rows.filter((r) => r.offerProduct.active);
  }, []);
}

// Todas las ofertas "antes de pagar" configuradas, con los nombres de
// ambos productos — para el resumen de /admin/promos (hoy la única forma
// de verlas era abrir producto por producto). Envuelto en safeQuery: si
// falta la migración de "product_upsells", el resumen las omite en vez de
// romper la página.
export async function getAllUpsells() {
  return safeQuery(async () => {
    const triggerProducts = alias(products, "trigger_products");
    return db
      .select({
        id: productUpsells.id,
        triggerProductId: productUpsells.triggerProductId,
        triggerProductName: triggerProducts.name,
        offerProductId: productUpsells.offerProductId,
        offerProductName: products.name,
        offerPrice: productUpsells.offerPrice,
        offerSalePrice: products.salePrice,
      })
      .from(productUpsells)
      .innerJoin(products, eq(products.id, productUpsells.offerProductId))
      .innerJoin(triggerProducts, eq(triggerProducts.id, productUpsells.triggerProductId));
  }, []);
}

// ---------- Armá tu Box ----------

// Tamaños visibles en la tienda. Envuelto en safeQuery: si falta la
// migración, la solapa "Armá tu Box" no tiene que romper el resto del
// sitio.
export async function getActiveBoxSizes() {
  return safeQuery(async () => {
    const rows = await db.select().from(boxSizes).where(eq(boxSizes.active, true));
    return rows.sort((a, b) => a.sortOrder - b.sortOrder);
  }, []);
}

export async function getAllBoxSizes() {
  const rows = await db.select().from(boxSizes);
  return rows.sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function getBoxSizeById(id: string) {
  return (await db.select().from(boxSizes).where(eq(boxSizes.id, id)).limit(1))[0];
}

export type BoxSizeInput = {
  name: string;
  price: number;
  imageUrl: string | null;
  stock: number;
  sortOrder: number;
  active: boolean;
};

export async function createBoxSize(input: BoxSizeInput): Promise<string> {
  const id = randomUUID();
  const row: NewBoxSizeRow = { id, ...input };
  await db.insert(boxSizes).values(row);
  return id;
}

export async function updateBoxSize(id: string, input: BoxSizeInput): Promise<void> {
  await db.update(boxSizes).set(input).where(eq(boxSizes.id, id));
}

export async function deleteBoxSize(id: string): Promise<void> {
  await db.delete(boxSizes).where(eq(boxSizes.id, id));
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

// Pedidos pagados (confirmados) que todavía no salieron con un repartidor:
// el contador de "pedido nuevo" que se muestra como notificación en el admin.
export async function getNewOrdersCount(): Promise<number> {
  const rows = await db
    .select({ id: orders.id })
    .from(orders)
    .where(eq(orders.status, "pagado"));
  return rows.length;
}

// Restaura el stock de todos los items de un pedido (usado al cancelar).
export async function restoreStockForOrder(orderId: string): Promise<void> {
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  for (const item of items) {
    if (item.variantId) {
      await db
        .update(productVariants)
        .set({ stock: sql`${productVariants.stock} + ${item.quantity}` })
        .where(eq(productVariants.id, item.variantId));
    } else {
      await db
        .update(products)
        .set({ stock: sql`${products.stock} + ${item.quantity}` })
        .where(eq(products.id, item.productId));
    }
  }

  const orderRows = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  const order = orderRows[0];
  if (order?.isBox && order.boxSizeId) {
    await db
      .update(boxSizes)
      .set({ stock: sql`${boxSizes.stock} + 1` })
      .where(eq(boxSizes.id, order.boxSizeId));
  }
}

// Borra el pedido definitivamente (para pedidos de prueba u otros que no
// tengan sentido mantener). Si todavía no estaba cancelado, antes devuelve
// el stock que tenía reservado (productos, variantes y tamaño de box según
// corresponda) — no hay forma de recuperarlo después de borrado.
export async function deleteOrder(orderId: string): Promise<void> {
  const rows = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  if (rows[0] && rows[0].status !== "cancelado") {
    await restoreStockForOrder(orderId);
  }
  await db.delete(orderItems).where(eq(orderItems.orderId, orderId));
  await db.delete(orders).where(eq(orders.id, orderId));
}

// ---------- Repartidores ----------

export async function getAllRiders(): Promise<RiderRow[]> {
  return db.select().from(riders).orderBy(asc(riders.name));
}

export async function getRiderById(id: string): Promise<RiderRow | undefined> {
  return (await db.select().from(riders).where(eq(riders.id, id)).limit(1))[0];
}

export async function getRiderByUsername(username: string): Promise<RiderRow | undefined> {
  return (await db.select().from(riders).where(eq(riders.username, username)).limit(1))[0];
}

export type RiderInput = {
  name: string;
  phone: string;
  username: string;
  active: boolean;
};

export async function createRider(
  input: RiderInput & { passwordHash: string }
): Promise<string> {
  const id = randomUUID();
  const row: NewRiderRow = { id, ...input };
  await db.insert(riders).values(row);
  return id;
}

export async function updateRider(
  id: string,
  input: RiderInput & { passwordHash?: string }
): Promise<void> {
  await db.update(riders).set(input).where(eq(riders.id, id));
}

// Se llama cada vez que el repartidor abre su app, para que el admin vea
// quién está conectado ahora mismo.
export async function touchRiderLastSeen(id: string): Promise<void> {
  await db
    .update(riders)
    .set({ lastSeenAt: sql`(current_timestamp)` })
    .where(eq(riders.id, id));
}

export async function deleteRider(id: string): Promise<void> {
  await db.delete(riders).where(eq(riders.id, id));
}

// Pedidos pagados y sin repartidor asignado: el "pool" que ven todos los
// repartidores activos para aceptar.
export async function getAvailableOrdersForRiders() {
  return db
    .select()
    .from(orders)
    .where(and(eq(orders.status, "pagado"), isNull(orders.riderId)))
    .orderBy(asc(orders.createdAt));
}

// Intenta asignar el pedido a este repartidor de forma atómica: solo tiene
// éxito si nadie se lo llevó antes (rider_id todavía es null). El primero
// que llega, gana la carrera.
export async function claimOrderForRider(orderId: string, riderId: string): Promise<boolean> {
  const result = await db
    .update(orders)
    .set({ riderId, status: "en_camino", updatedAt: sql`(current_timestamp)` })
    .where(
      and(eq(orders.id, orderId), isNull(orders.riderId), eq(orders.status, "pagado"))
    );
  return result.rowsAffected > 0;
}

export async function getActiveDeliveriesForRider(riderId: string) {
  return db
    .select()
    .from(orders)
    .where(and(eq(orders.riderId, riderId), eq(orders.status, "en_camino")))
    .orderBy(asc(orders.updatedAt));
}

export async function getDeliveryHistoryForRider(riderId: string, limit = 20) {
  return db
    .select()
    .from(orders)
    .where(and(eq(orders.riderId, riderId), eq(orders.status, "entregado")))
    .orderBy(desc(orders.updatedAt))
    .limit(limit);
}

// Un repartidor solo puede marcar como entregado un pedido que es suyo.
export async function markOrderDeliveredByRider(
  orderId: string,
  riderId: string
): Promise<boolean> {
  const result = await db
    .update(orders)
    .set({ status: "entregado", updatedAt: sql`(current_timestamp)` })
    .where(and(eq(orders.id, orderId), eq(orders.riderId, riderId)));
  return result.rowsAffected > 0;
}

export async function getItemsForOrders(orderIds: string[]) {
  if (!orderIds.length) return [];
  return db.select().from(orderItems).where(inArray(orderItems.orderId, orderIds));
}

// Admin: libera un pedido (vuelve al pool) si el repartidor no lo puede
// completar.
export async function releaseOrderFromRider(orderId: string): Promise<void> {
  await db
    .update(orders)
    .set({ riderId: null, status: "pagado", updatedAt: sql`(current_timestamp)` })
    .where(eq(orders.id, orderId));
}

// ---------- Suscripciones push (repartidores) ----------

// Un mismo endpoint puede volver a suscribirse (ej. el repartidor reactiva
// las notificaciones): lo reemplaza en vez de duplicarlo.
export async function savePushSubscription(input: {
  riderId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}): Promise<void> {
  const existing = (
    await db
      .select()
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.endpoint, input.endpoint))
      .limit(1)
  )[0];

  if (existing) {
    await db
      .update(pushSubscriptions)
      .set({ riderId: input.riderId, p256dh: input.p256dh, auth: input.auth })
      .where(eq(pushSubscriptions.endpoint, input.endpoint));
    return;
  }

  const row: NewPushSubscriptionRow = { id: randomUUID(), ...input };
  await db.insert(pushSubscriptions).values(row);
}

export async function deletePushSubscriptionByEndpoint(endpoint: string): Promise<void> {
  await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, endpoint));
}

// ---------- Suscripciones push (panel admin) ----------

// No hay cuenta individual por persona en el admin (la contraseña es
// compartida por rol) — el endpoint identifica el dispositivo, y guardamos
// el rol solo a modo informativo.
export async function saveAdminPushSubscription(input: {
  role: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}): Promise<void> {
  await safeQuery(async () => {
    const existing = (
      await db
        .select()
        .from(adminPushSubscriptions)
        .where(eq(adminPushSubscriptions.endpoint, input.endpoint))
        .limit(1)
    )[0];

    if (existing) {
      await db
        .update(adminPushSubscriptions)
        .set({ role: input.role, p256dh: input.p256dh, auth: input.auth })
        .where(eq(adminPushSubscriptions.endpoint, input.endpoint));
      return;
    }

    const row: NewAdminPushSubscriptionRow = { id: randomUUID(), ...input };
    await db.insert(adminPushSubscriptions).values(row);
  }, undefined);
}

export async function deleteAdminPushSubscriptionByEndpoint(endpoint: string): Promise<void> {
  await safeQuery(
    () => db.delete(adminPushSubscriptions).where(eq(adminPushSubscriptions.endpoint, endpoint)),
    undefined
  );
}

// Todas las suscripciones del panel admin (dueño/a y encargado/a): a quién
// avisarle por celular cuando entra un pedido nuevo.
export async function getAllAdminPushSubscriptions() {
  return safeQuery(
    () =>
      db
        .select({
          endpoint: adminPushSubscriptions.endpoint,
          p256dh: adminPushSubscriptions.p256dh,
          auth: adminPushSubscriptions.auth,
        })
        .from(adminPushSubscriptions),
    []
  );
}

// Para el panel admin: qué repartidores tienen notificaciones push activas
// (al menos una suscripción guardada) en este momento.
export async function getRiderIdsWithPushSubscription(): Promise<Set<string>> {
  const rows = await db
    .selectDistinct({ riderId: pushSubscriptions.riderId })
    .from(pushSubscriptions);
  return new Set(rows.map((r) => r.riderId));
}

// Suscripciones de todos los repartidores activos: a quién avisarle cuando
// entra un pedido nuevo al pool.
export async function getPushSubscriptionsForActiveRiders() {
  return db
    .select({
      endpoint: pushSubscriptions.endpoint,
      p256dh: pushSubscriptions.p256dh,
      auth: pushSubscriptions.auth,
    })
    .from(pushSubscriptions)
    .innerJoin(riders, eq(riders.id, pushSubscriptions.riderId))
    .where(eq(riders.active, true));
}

// ---------- Banners ----------

// Banners para la tienda: activos y, si tienen horario configurado, solo
// dentro de su ventana (mismo criterio que los productos y categorías).
// Envuelto en safeQuery: si todavía falta aplicar la migración de
// "image_url" en producción, la portada no se tiene que romper por esto.
export async function getActiveBanners() {
  return safeQuery(async () => {
    const rows = await db.select().from(banners).where(eq(banners.active, true));
    return rows
      .filter((b) => isWithinSchedule(b.scheduleStart, b.scheduleEnd))
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }, []);
}

export async function getAllBanners() {
  const rows = await db.select().from(banners);
  return rows.sort((a, b) => a.sortOrder - b.sortOrder);
}

export type BannerInput = {
  title: string;
  subtitle: string | null;
  emoji: string;
  imageUrl: string | null;
  active: boolean;
  sortOrder: number;
  linkType: "product" | "category" | null;
  linkValue: string | null;
  scheduleStart: string | null;
  scheduleEnd: string | null;
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

// ---------- Configuración general ----------

const BANNER_INTERVAL_SETTING_KEY = "banner_interval_seconds";
const DEFAULT_BANNER_INTERVAL_SECONDS = 5;

// Cada cuántos segundos rota el carrusel de banners. Envuelto en safeQuery
// para que, si falta aplicar la migración de "site_settings", la portada
// use el default en vez de romperse.
export async function getBannerIntervalSeconds(): Promise<number> {
  return safeQuery(async () => {
    const row = (
      await db
        .select()
        .from(siteSettings)
        .where(eq(siteSettings.key, BANNER_INTERVAL_SETTING_KEY))
        .limit(1)
    )[0];
    const parsed = row ? Number(row.value) : NaN;
    return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_BANNER_INTERVAL_SECONDS;
  }, DEFAULT_BANNER_INTERVAL_SECONDS);
}

export async function setBannerIntervalSeconds(seconds: number): Promise<void> {
  const value = String(Math.max(1, Math.round(seconds)));
  await db
    .insert(siteSettings)
    .values({ key: BANNER_INTERVAL_SETTING_KEY, value })
    .onConflictDoUpdate({ target: siteSettings.key, set: { value } });
}

// ---------- Promo "agregá algo con descuento" del checkout ----------

// Cartel no invasivo que aparece en el checkout ofreciendo un descuento en
// ciertos productos (ej. bebidas) cuando el carrito tiene algo de una
// categoría gatillo (ej. "Salvá la Comida") y todavía no tiene nada de una
// categoría excluida (ej. "Bebidas"). Totalmente configurable desde
// /admin/promos — sin categorías cargadas, queda inactiva.
const CART_PROMO_SETTING_KEYS = {
  triggerCategory: "cart_promo_trigger_category",
  excludeCategory: "cart_promo_exclude_category",
  discountPercent: "cart_promo_discount_percent",
  active: "cart_promo_active",
} as const;

export type CartPromoSettings = {
  triggerCategory: string;
  excludeCategory: string;
  discountPercent: number;
  active: boolean;
};

const DEFAULT_CART_PROMO_SETTINGS: CartPromoSettings = {
  triggerCategory: "",
  excludeCategory: "",
  discountPercent: 10,
  active: false,
};

// Envuelto en safeQuery: si falta la migración de "site_settings", el
// checkout sigue funcionando sin esta promo en vez de romperse.
export async function getCartPromoSettings(): Promise<CartPromoSettings> {
  return safeQuery(async () => {
    const rows = await db
      .select()
      .from(siteSettings)
      .where(
        inArray(siteSettings.key, [
          CART_PROMO_SETTING_KEYS.triggerCategory,
          CART_PROMO_SETTING_KEYS.excludeCategory,
          CART_PROMO_SETTING_KEYS.discountPercent,
          CART_PROMO_SETTING_KEYS.active,
        ])
      );
    const byKey = new Map(rows.map((r) => [r.key, r.value]));
    const triggerCategory = byKey.get(CART_PROMO_SETTING_KEYS.triggerCategory) ?? "";
    const excludeCategory = byKey.get(CART_PROMO_SETTING_KEYS.excludeCategory) ?? "";
    const discountPercent = Number(byKey.get(CART_PROMO_SETTING_KEYS.discountPercent));
    return {
      triggerCategory,
      excludeCategory,
      discountPercent: Number.isFinite(discountPercent) ? discountPercent : DEFAULT_CART_PROMO_SETTINGS.discountPercent,
      // Inactiva si falta configurar alguna de las dos categorías, aunque
      // el admin haya tildado "activa".
      active: byKey.get(CART_PROMO_SETTING_KEYS.active) === "true" && Boolean(triggerCategory) && Boolean(excludeCategory),
    };
  }, DEFAULT_CART_PROMO_SETTINGS);
}

export async function setCartPromoSettings(settings: CartPromoSettings): Promise<void> {
  const entries: [string, string][] = [
    [CART_PROMO_SETTING_KEYS.triggerCategory, settings.triggerCategory],
    [CART_PROMO_SETTING_KEYS.excludeCategory, settings.excludeCategory],
    [CART_PROMO_SETTING_KEYS.discountPercent, String(settings.discountPercent)],
    [CART_PROMO_SETTING_KEYS.active, settings.active ? "true" : "false"],
  ];
  for (const [key, value] of entries) {
    await db
      .insert(siteSettings)
      .values({ key, value })
      .onConflictDoUpdate({ target: siteSettings.key, set: { value } });
  }
}

// Productos marcados para ofrecerse con descuento en esta promo. Envuelto
// en safeQuery: si falta la migración de "cart_promo_eligible", el
// checkout sigue funcionando sin ofertas en vez de romperse.
export async function getCartPromoEligibleProducts() {
  return safeQuery(async () => {
    return db
      .select({ id: products.id, name: products.name, salePrice: products.salePrice })
      .from(products)
      .where(eq(products.cartPromoEligible, true));
  }, []);
}

// Reemplazo completo del set de productos elegibles (para el checklist del
// admin, que manda la lista entera marcada).
export async function setCartPromoEligibleProducts(productIds: string[]): Promise<void> {
  await db.update(products).set({ cartPromoEligible: false });
  if (productIds.length > 0) {
    await db
      .update(products)
      .set({ cartPromoEligible: true })
      .where(inArray(products.id, productIds));
  }
}

// ---------- Reportes ----------

export async function getSalesReport(fromISO: string, toISO: string) {
  const paidStatuses = ["pagado", "en_camino", "entregado"] as const;
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
