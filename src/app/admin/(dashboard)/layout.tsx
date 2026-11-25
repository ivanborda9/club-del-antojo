import { redirect } from "next/navigation";
import Link from "next/link";
import { getAdminRole } from "@/lib/adminAuth";
import { getNewOrdersCount } from "@/lib/db/queries";
import { AdminLogoutButton } from "@/components/admin/AdminLogoutButton";
import { AdminNav } from "@/components/admin/AdminNav";
import { AdminAutoRefresh } from "@/components/admin/AdminAutoRefresh";
import { AdminNotificationBell } from "@/components/admin/AdminNotificationBell";
import { NewOrderAlert } from "@/components/admin/NewOrderAlert";

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const role = await getAdminRole();
  if (!role) {
    redirect("/admin/login");
  }

  const newOrdersCount = await getNewOrdersCount();

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50">
      <AdminAutoRefresh />
      <NewOrderAlert count={newOrdersCount} />
      <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link href="/admin" className="flex items-center gap-2 text-xl font-extrabold text-orange-600">
            <span className="text-2xl">🍬</span>
            Club del Antojo
          </Link>
          <div className="flex items-center gap-2">
            <AdminNotificationBell vapidPublicKey={process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? null} />
            <AdminLogoutButton />
          </div>
        </div>
        <AdminNav newOrdersCount={newOrdersCount} role={role} />
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
        {children}
      </main>
    </div>
  );
}
