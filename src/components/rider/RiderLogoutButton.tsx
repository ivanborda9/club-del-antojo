import { riderLogoutAction } from "@/app/rider/logout/actions";

export function RiderLogoutButton() {
  return (
    <form action={riderLogoutAction}>
      <button
        type="submit"
        className="rounded-full border border-orange-200 px-4 py-2 text-sm font-semibold text-zinc-600"
      >
        Salir
      </button>
    </form>
  );
}
