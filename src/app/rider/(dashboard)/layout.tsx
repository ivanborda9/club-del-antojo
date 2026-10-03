import { redirect } from "next/navigation";
import { getRiderById } from "@/lib/db/queries";
import { getRiderSession } from "@/lib/riderAuth";
import { RiderLogoutButton } from "@/components/rider/RiderLogoutButton";

export default async function RiderDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const riderId = await getRiderSession();
  if (!riderId) redirect("/rider/login");

  const rider = await getRiderById(riderId);
  if (!rider || !rider.active) redirect("/rider/login");

  return (
    <div className="flex min-h-screen flex-col bg-orange-50/40">
      <header className="sticky top-0 z-30 border-b border-orange-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3">
          <div>
            <p className="text-sm font-bold text-orange-600">Club del Antojo</p>
            <p className="text-xs text-zinc-500">Hola, {rider.name}</p>
          </div>
          <RiderLogoutButton />
        </div>
      </header>

      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-4">{children}</main>
    </div>
  );
}
