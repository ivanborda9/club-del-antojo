export type Category =
  | "Golosinas"
  | "Bebidas"
  | "Snacks"
  | "Cigarrillos"
  | "Helados"
  | "Almacén";

export type Product = {
  id: string;
  name: string;
  category: Category;
  price: number;
  emoji: string;
  description?: string;
};

export type CartItem = {
  product: Product;
  quantity: number;
};

export type PaymentMethod = "mercadopago" | "transferencia";
