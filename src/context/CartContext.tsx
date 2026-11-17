"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { CartItem, Product, ProductVariant } from "@/types";

const STORAGE_KEY = "club-del-antojo:cart";

// Stock disponible para una línea del carrito: el de la variedad elegida
// si el producto tiene variantes, si no el del producto.
function stockFor(product: Product, variantId?: string): number {
  if (!variantId) return product.stock;
  return product.variants?.find((v) => v.id === variantId)?.stock ?? 0;
}

type CartContextValue = {
  items: CartItem[];
  addItem: (product: Product, variant?: ProductVariant) => void;
  removeItem: (productId: string, variantId?: string) => void;
  setQuantity: (productId: string, quantity: number, variantId?: string) => void;
  clear: () => void;
  totalItems: number;
  totalPrice: number;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      // One-time sync from localStorage on mount, after the server-rendered
      // empty cart has already hydrated — intentional, not a render loop.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setItems(JSON.parse(raw));
    } catch {
      // localStorage no disponible o dato corrupto: arrancamos con carrito vacío
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignorar si no se puede persistir
    }
  }, [items, hydrated]);

  const addItem = useCallback((product: Product, variant?: ProductVariant) => {
    setItems((prev) => {
      const existing = prev.find(
        (item) => item.product.id === product.id && item.variantId === variant?.id
      );
      const available = stockFor(product, variant?.id);
      if (existing) {
        if (existing.quantity >= available) return prev;
        return prev.map((item) =>
          item.product.id === product.id && item.variantId === variant?.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      if (available <= 0) return prev;
      return [...prev, { product, quantity: 1, variantId: variant?.id, variantName: variant?.name }];
    });
  }, []);

  const removeItem = useCallback((productId: string, variantId?: string) => {
    setItems((prev) =>
      prev.filter((item) => !(item.product.id === productId && item.variantId === variantId))
    );
  }, []);

  const setQuantity = useCallback((productId: string, quantity: number, variantId?: string) => {
    setItems((prev) => {
      if (quantity <= 0) {
        return prev.filter((item) => !(item.product.id === productId && item.variantId === variantId));
      }
      return prev.map((item) =>
        item.product.id === productId && item.variantId === variantId
          ? { ...item, quantity: Math.min(quantity, stockFor(item.product, variantId)) }
          : item
      );
    });
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const totalItems = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );
  const totalPrice = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity * item.product.salePrice, 0),
    [items]
  );

  const value = useMemo(
    () => ({ items, addItem, removeItem, setQuantity, clear, totalItems, totalPrice }),
    [items, addItem, removeItem, setQuantity, clear, totalItems, totalPrice]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart debe usarse dentro de <CartProvider>");
  return ctx;
}
