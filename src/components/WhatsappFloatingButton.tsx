"use client";

import { usePathname } from "next/navigation";
import { buildWhatsappOrderLink } from "@/config/site";

// Botoncito flotante para consultas o pagos: en todas las páginas de la
// tienda (nunca en /admin ni /rider, que son para el dueño/a y
// repartidores). Por encima de la barra del carrito (que es z-30 y ocupa
// todo el ancho abajo), y respeta el "notch" de abajo en iPhone.
export function WhatsappFloatingButton() {
  const pathname = usePathname();
  if (pathname.startsWith("/admin") || pathname.startsWith("/rider")) return null;

  const href = buildWhatsappOrderLink("Hola! Tengo una consulta.");

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Consultas por WhatsApp"
      title="Consultas por WhatsApp"
      className="fixed right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition active:scale-95 [bottom:calc(5rem+env(safe-area-inset-bottom))]"
    >
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-8 w-8" aria-hidden="true">
        <path d="M12.04 2c-5.46 0-9.9 4.44-9.9 9.9 0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.9-4.44 9.9-9.9 0-2.64-1.03-5.12-2.9-6.98A9.82 9.82 0 0 0 12.04 2zm0 1.67c2.19 0 4.25.85 5.8 2.4a8.2 8.2 0 0 1 2.41 5.83c0 4.54-3.7 8.23-8.24 8.23a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.18 8.18 0 0 1-1.26-4.37c0-4.54 3.7-8.23 8.27-8.23zm-3.87 4.65c-.17 0-.45.06-.69.32-.24.26-.9.88-.9 2.15 0 1.27.92 2.5 1.05 2.67.13.17 1.8 2.75 4.37 3.75.6.24 1.08.38 1.44.48.6.19 1.15.16 1.58.1.48-.07 1.48-.6 1.69-1.19.21-.58.21-1.07.15-1.18-.06-.1-.23-.16-.48-.29-.25-.13-1.48-.73-1.7-.81-.23-.08-.4-.13-.56.13-.17.26-.65.81-.8.98-.14.17-.3.19-.55.06-.26-.13-1.08-.4-2.06-1.27-.76-.68-1.27-1.51-1.42-1.77-.15-.26-.02-.4.11-.53.11-.11.26-.3.39-.44.13-.15.17-.26.26-.43.08-.17.04-.32-.02-.45-.06-.13-.56-1.36-.78-1.86-.2-.49-.4-.42-.56-.43h-.48z" />
      </svg>
    </a>
  );
}
