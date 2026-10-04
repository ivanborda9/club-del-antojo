import { logoutAction } from "@/app/admin/logout/actions";

export function AdminLogoutButton() {
  return (
    <form action={logoutAction}>
      <button
        type="submit"
        className="rounded-full border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-600"
      >
        Salir
      </button>
    </form>
  );
}
