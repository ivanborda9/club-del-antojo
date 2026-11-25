"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { AdminRole } from "@/lib/adminAuth";

const NAV_ITEMS = [
  { href: "/admin", label: "Panel", icon: "🏠", ownerOnly: true },
  { href: "/admin/productos", label: "Productos", icon: "🍬", ownerOnly: true },
  { href: "/admin/stock", label: "Stock", icon: "📦", ownerOnly: false },
  { href: "/admin/categorias", label: "Categorías", icon: "🗂️", ownerOnly: true },
  { href: "/admin/pedidos", label: "Pedidos", icon: "🧾", ownerOnly: false },
  { href: "/admin/riders", label: "Repartidores", icon: "🛵", ownerOnly: false },
  { href: "/admin/envios", label: "Envíos", icon: "🚚", ownerOnly: true },
  { href: "/admin/horarios", label: "Horarios", icon: "🕒", ownerOnly: false },
  { href: "/admin/banners", label: "Banners", icon: "📣", ownerOnly: true },
  { href: "/admin/box", label: "Armá tu Box", icon: "🎁", ownerOnly: true },
  { href: "/admin/promos", label: "Promos", icon: "🥤", ownerOnly: true },
  { href: "/admin/reportes", label: "Reportes", icon: "📊", ownerOnly: true },
];

export function AdminNav({
  newOrdersCount = 0,
  role,
}: {
  newOrdersCount?: number;
  role: AdminRole;
}) {
  const pathname = usePathname();
  const items = NAV_ITEMS.filter((item) => role === "owner" || !item.ownerOnly);

  return (
    <nav className="no-scrollbar mx-auto flex max-w-5xl gap-2 overflow-x-auto px-4 pb-3">
      {items.map((item) => {
        const active =
          item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`relative flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-base font-semibold transition ${
              active
                ? "bg-orange-600 text-white"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
            }`}
          >
            <span className="text-lg">{item.icon}</span>
            {item.label}
            {item.href === "/admin/pedidos" && newOrdersCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-xs font-bold text-white ring-2 ring-white">
                {newOrdersCount > 99 ? "99+" : newOrdersCount}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
