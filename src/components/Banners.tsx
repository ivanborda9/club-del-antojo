import type { BannerRow } from "@/lib/db/schema";

export function Banners({ banners }: { banners: BannerRow[] }) {
  if (banners.length === 0) return null;

  return (
    <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 pt-3">
      {banners.map((banner) => (
        <div
          key={banner.id}
          className="flex min-w-[220px] shrink-0 items-center gap-2 rounded-2xl bg-gradient-to-br from-orange-600 to-red-600 px-4 py-3 text-white"
        >
          <span className="text-2xl">{banner.emoji}</span>
          <div>
            <p className="text-sm font-bold leading-tight">{banner.title}</p>
            {banner.subtitle && (
              <p className="text-xs leading-tight text-orange-50">{banner.subtitle}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
