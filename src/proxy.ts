import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ADMIN_COOKIE_NAME, parseAdminToken } from "@/lib/adminAuth";

// Rutas del admin que puede ver el rol "staff" (encargado/a del día a
// día): pedidos, stock, repartidores y horarios de apertura/cierre. Todo
// lo demás (panel con ganancias, reportes, precios/promos, envíos,
// categorías, banners, box, productos completos) es solo para "owner".
const STAFF_ALLOWED_PREFIXES = ["/admin/pedidos", "/admin/stock", "/admin/riders", "/admin/horarios"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    !pathname.startsWith("/admin") ||
    pathname.startsWith("/admin/login") ||
    pathname.startsWith("/admin/logout")
  ) {
    return NextResponse.next();
  }

  const role = parseAdminToken(request.cookies.get(ADMIN_COOKIE_NAME)?.value);
  if (!role) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  if (role === "staff") {
    const allowed = STAFF_ALLOWED_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
    );
    if (!allowed) {
      return NextResponse.redirect(new URL("/admin/pedidos", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/admin/:path*",
};
