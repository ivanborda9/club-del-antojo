import { redirect } from "next/navigation";
import { getRiderById, touchRiderLastSeen } from "@/lib/db/queries";
import { getRiderSession } from "@/lib/riderAuth";
import { RiderLogoutButton } from "@/components/rider/RiderLogoutButton";
import { NotificationBell } from "@/components/rider/NotificationBell";

export default async function RiderDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const riderId = await getRiderSession();
  if (!riderId) redirect("/rider/login");

  const rider = await getRiderById(riderId);
  if (!rider || !rider.active) redirect("/rider/login");

  // Se actualiza en cada carga/refresco automático (cada 15s mientras tiene
  // la app abierta) — así el admin ve quién está conectado ahora mismo.
  await touchRiderLastSeen(riderId);

  return (
    <div className="flex min-h-screen flex-col bg-orange-50/40">
      <header className="sticky top-0 z-30 border-b border-orange-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2.5">
            <span className="text-3xl">🛵</span>
            <div>
              <p className="text-lg font-extrabold leading-tight text-orange-600">
                Club del Antojo
              </p>
              <p className="text-sm font-medium text-zinc-500">Hola, {rider.name} 👋</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell vapidPublicKey={process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? null} />
            <RiderLogoutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-5">{children}</main>
    </div>
  );
}
