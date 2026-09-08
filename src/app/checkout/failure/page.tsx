import { CheckoutResult } from "@/components/CheckoutResult";

export default function CheckoutFailurePage() {
  return (
    <CheckoutResult
      emoji="❌"
      title="El pago no se pudo procesar"
      message="Tu pedido sigue en el carrito. Podés intentar de nuevo o elegir transferencia."
    />
  );
}
