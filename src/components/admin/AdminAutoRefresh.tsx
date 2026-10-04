"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

// Refresca los datos del servidor cada 20s para que el contador de
// "pedidos nuevos" se actualice solo, sin que el admin tenga que recargar.
export function AdminAutoRefresh({ intervalMs = 20000 }: { intervalMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    const id = setInterval(() => router.refresh(), intervalMs);
    return () => clearInterval(id);
  }, [router, intervalMs]);

  return null;
}
