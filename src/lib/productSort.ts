import type { Product } from "@/types";

// Sin stock (o "próximamente", que tampoco se puede comprar): todas las
// variantes agotadas (si tiene) o el stock del producto en 0 (si no tiene
// variantes).
export function isOutOfStock(product: Product): boolean {
  if (product.variants && product.variants.length > 0) {
    return product.variants.every((v) => v.stock <= 0);
  }
  return product.stock <= 0;
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim();
}

const SALVA_LA_COMIDA = normalize("Salvá la Comida");

function isSalvaLaComida(category: string): boolean {
  return normalize(category) === SALVA_LA_COMIDA;
}

// Orden de la tienda: lo que está en stock primero, lo agotado y lo
// "próximamente" al final. Dentro de "Salvá la Comida" (productos a punto
// de vencer / de salida), además se pide un orden específico: pizzas
// primero, después mayonesas, con el resto de lo agotado antes que lo
// "próximamente" (que siempre queda último).
function tierFor(product: Product): number {
  if (isSalvaLaComida(product.category)) {
    if (product.comingSoon) return 4;
    if (isOutOfStock(product)) return 3;
    const name = normalize(product.name);
    if (name.includes("pizza")) return 0;
    if (name.includes("mayonesa")) return 1;
    return 2;
  }
  if (product.comingSoon || isOutOfStock(product)) return 1;
  return 0;
}

// Orden estable: dentro de un mismo nivel, respeta el orden en que ya
// venían los productos (alfabético, porque así los trae la consulta).
export function compareProductsForDisplay(a: Product, b: Product): number {
  return tierFor(a) - tierFor(b);
}
