"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/admin", label: "Panel", icon: "🏠" },
  { href: "/admin/productos", label: "Productos", icon: "🍬" },
  { href: "/admin/pedidos", label: "Pedidos", icon: "🧾" },
  { href: "/admin/riders", label: "Repartidores", icon: "🛵" },
  { href: "/admin/banners", label: "Banners", icon: "📣" },
  { href: "/admin/reportes", label: "Reportes", icon: "📊" },
];

export function AdminNav({ newOrdersCount = 0 }: { newOrdersCount?: number }) {
  const pathname = usePathname();

  return (
    <nav className="no-scrollbar mx-auto flex max-w-5xl gap-2 overflow-x-auto px-4 pb-3">
      {NAV_ITEMS.map((item) => {
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
