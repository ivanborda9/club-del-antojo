// % de ganancia calculado sobre el precio de venta (margen), no sobre el costo.
export function marginPercent(costPrice: number, salePrice: number): number {
  if (salePrice <= 0) return 0;
  return ((salePrice - costPrice) / salePrice) * 100;
}
