import { logoutAction } from "@/app/admin/logout/actions";

export function AdminLogoutButton() {
  return (
    <form action={logoutAction}>
      <button
        type="submit"
        className="rounded-full border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-500"
      >
        Salir
      </button>
    </form>
  );
}
