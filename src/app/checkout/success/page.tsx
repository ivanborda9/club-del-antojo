"use client";

import { useEffect } from "react";
import { CheckoutResult } from "@/components/CheckoutResult";
import { useCart } from "@/context/CartContext";

export default function CheckoutSuccessPage() {
  const { clear } = useCart();

  useEffect(() => {
    clear();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <CheckoutResult
      emoji="✅"
      title="¡Pago aprobado!"
      message="Ya recibimos tu pedido y lo estamos preparando para el envío."
    />
  );
}
