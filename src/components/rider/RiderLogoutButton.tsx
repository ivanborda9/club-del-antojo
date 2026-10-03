import { riderLogoutAction } from "@/app/rider/logout/actions";

export function RiderLogoutButton() {
  return (
    <form action={riderLogoutAction}>
      <button
        type="submit"
        className="rounded-full border border-orange-200 px-3 py-1.5 text-xs font-medium text-zinc-500"
      >
        Salir
      </button>
    </form>
  );
}
