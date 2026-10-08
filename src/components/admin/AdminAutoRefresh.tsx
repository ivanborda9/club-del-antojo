"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

// Refresca los datos del servidor cada 10s para que el contador de
// "pedidos nuevos" (y la alarma sonora) se actualicen solos, sin que el
// admin tenga que recargar.
export function AdminAutoRefresh({ intervalMs = 10000 }: { intervalMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    const id = setInterval(() => router.refresh(), intervalMs);
    return () => clearInterval(id);
  }, [router, intervalMs]);

  return null;
}
