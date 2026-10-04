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

export function AdminNav() {
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
            className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-base font-semibold transition ${
              active
                ? "bg-orange-600 text-white"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
            }`}
          >
            <span className="text-lg">{item.icon}</span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
