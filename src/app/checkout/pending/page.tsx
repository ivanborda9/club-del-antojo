import { CheckoutResult } from "@/components/CheckoutResult";

export default function CheckoutPendingPage() {
  return (
    <CheckoutResult
      emoji="⏳"
      title="Pago pendiente"
      message="Tu pago está siendo procesado. Te avisaremos apenas se confirme."
    />
  );
}
