// Forma pública de un producto (lo que ve el cliente en la tienda).
// Nunca incluye costPrice: ese dato es solo para el admin.
export type Product = {
  id: string;
  name: string;
  category: string;
  emoji: string;
  salePrice: number;
  stock: number;
};

export type CartItem = {
  product: Product;
  quantity: number;
};

export type PaymentMethod = "mercadopago" | "transferencia";
