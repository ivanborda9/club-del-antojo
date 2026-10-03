"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

// Refresca los datos del servidor cada 15s para que aparezcan pedidos
// nuevos en el pool sin que el repartidor tenga que recargar a mano.
export function RiderAutoRefresh({ intervalMs = 15000 }: { intervalMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    const id = setInterval(() => router.refresh(), intervalMs);
    return () => clearInterval(id);
  }, [router, intervalMs]);

  return null;
}
