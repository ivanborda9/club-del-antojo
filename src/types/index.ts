export type ProductVariant = {
  id: string;
  name: string;
  stock: number;
};

// Forma pública de un producto (lo que ve el cliente en la tienda).
// Nunca incluye costPrice: ese dato es solo para el admin.
export type Product = {
  id: string;
  name: string;
  category: string;
  parentCategory: string | null;
  emoji: string;
  imageUrl: string | null;
  description: string | null;
  salePrice: number;
  stock: number;
  // Presente solo si el producto tiene variantes entre las que elegir (ej.
  // sabor de pizza en un combo). Si no, se vende como siempre.
  variants?: ProductVariant[];
};

export type CartItem = {
  product: Product;
  quantity: number;
  variantId?: string;
  variantName?: string;
};

export type PaymentMethod = "mercadopago" | "transferencia" | "efectivo";
