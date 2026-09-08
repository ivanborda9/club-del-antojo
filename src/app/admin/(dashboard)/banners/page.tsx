import { getAllBanners } from "@/lib/db/queries";
import { createBannerAction, deleteBannerAction, toggleBannerAction } from "./actions";

export default async function AdminBannersPage() {
  const bannerList = await getAllBanners();

  return (
    <div>
      <h1 className="text-lg font-bold text-zinc-800">Banners de ofertas</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Se muestran arriba del catálogo en la tienda, en el orden que indiques.
      </p>

      <form
        action={createBannerAction}
        className="mt-4 max-w-lg space-y-3 rounded-2xl border border-zinc-200 bg-white p-4"
      >
        <p className="text-sm font-semibold text-zinc-800">Nuevo banner</p>
        <div className="grid grid-cols-[1fr_auto] gap-3">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-zinc-600">Título</span>
            <input name="title" required className="input" placeholder="2x1 en golosinas" />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-zinc-600">Emoji</span>
            <input name="emoji" defaultValue="🎉" className="input w-16 text-center" />
          </label>
        </div>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-zinc-600">
            Subtítulo (opcional)
          </span>
          <input name="subtitle" className="input" placeholder="Válido hasta el domingo" />
        </label>
        <label className="block max-w-32">
          <span className="mb-1 block text-xs font-medium text-zinc-600">Orden</span>
          <input name="sortOrder" type="number" defaultValue={0} className="input" />
        </label>
        <button
          type="submit"
          className="h-10 rounded-full bg-orange-600 px-5 text-sm font-bold text-white"
        >
          Agregar banner
        </button>
      </form>

      <div className="mt-4 space-y-2">
        {bannerList.length === 0 && (
          <p className="text-sm text-zinc-500">Todavía no cargaste ningún banner.</p>
        )}
        {bannerList.map((banner) => (
          <div
            key={banner.id}
            className="flex items-center justify-between rounded-2xl border border-zinc-200 bg-white p-3"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{banner.emoji}</span>
              <div>
                <p className="text-sm font-semibold text-zinc-800">{banner.title}</p>
                {banner.subtitle && (
                  <p className="text-xs text-zinc-500">{banner.subtitle}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <form action={toggleBannerAction}>
                <input type="hidden" name="id" value={banner.id} />
                <input type="hidden" name="title" value={banner.title} />
                <input type="hidden" name="subtitle" value={banner.subtitle ?? ""} />
                <input type="hidden" name="emoji" value={banner.emoji} />
                <input type="hidden" name="sortOrder" value={banner.sortOrder} />
                <input type="hidden" name="active" value={(!banner.active).toString()} />
                <button
                  type="submit"
                  className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                    banner.active
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-zinc-100 text-zinc-500"
                  }`}
                >
                  {banner.active ? "Activo" : "Oculto"}
                </button>
              </form>
              <form action={deleteBannerAction}>
                <input type="hidden" name="id" value={banner.id} />
                <button type="submit" className="text-sm text-red-600">
                  Eliminar
                </button>
              </form>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
