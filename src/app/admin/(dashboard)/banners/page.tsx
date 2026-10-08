import { getAllBanners, getAllProducts } from "@/lib/db/queries";
import { createBannerAction, deleteBannerAction, toggleBannerAction } from "./actions";
import { BannerCreateForm } from "@/components/admin/BannerCreateForm";

export default async function AdminBannersPage() {
  const [bannerList, productList] = await Promise.all([getAllBanners(), getAllProducts()]);
  const categories = Array.from(new Set(productList.map((p) => p.category)));

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-zinc-900">Banners de ofertas</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Se muestran arriba del catálogo en la tienda, en el orden que indiques.
      </p>

      <BannerCreateForm
        action={createBannerAction}
        products={productList}
        categories={categories}
      />

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
                <div className="mt-1 flex flex-wrap gap-1">
                  {banner.linkType === "product" && (
                    <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] text-blue-700">
                      🔗 Producto: {productList.find((p) => p.id === banner.linkValue)?.name ?? banner.linkValue}
                    </span>
                  )}
                  {banner.linkType === "category" && (
                    <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] text-blue-700">
                      🔗 Categoría: {banner.linkValue}
                    </span>
                  )}
                  {banner.scheduleStart && banner.scheduleEnd && (
                    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] text-amber-700">
                      ⏰ {banner.scheduleStart}–{banner.scheduleEnd}
                    </span>
                  )}
                </div>
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
                <input type="hidden" name="linkType" value={banner.linkType ?? ""} />
                <input type="hidden" name="linkValue" value={banner.linkValue ?? ""} />
                <input type="hidden" name="scheduleStart" value={banner.scheduleStart ?? ""} />
                <input type="hidden" name="scheduleEnd" value={banner.scheduleEnd ?? ""} />
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
