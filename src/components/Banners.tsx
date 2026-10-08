import Link from "next/link";
import type { BannerRow } from "@/lib/db/schema";

function bannerHref(banner: BannerRow): string | null {
  if (banner.linkType === "product" && banner.linkValue) {
    return `/?product=${encodeURIComponent(banner.linkValue)}`;
  }
  if (banner.linkType === "category" && banner.linkValue) {
    return `/?category=${encodeURIComponent(banner.linkValue)}`;
  }
  return null;
}

export function Banners({ banners }: { banners: BannerRow[] }) {
  if (banners.length === 0) return null;

  return (
    <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 pt-3">
      {banners.map((banner) => {
        const href = bannerHref(banner);
        const content = (
          <>
            <span className="text-2xl">{banner.emoji}</span>
            <div>
              <p className="text-sm font-bold leading-tight">{banner.title}</p>
              {banner.subtitle && (
                <p className="text-xs leading-tight text-orange-50">{banner.subtitle}</p>
              )}
            </div>
          </>
        );
        const className =
          "flex min-w-[220px] shrink-0 items-center gap-2 rounded-2xl bg-gradient-to-br from-orange-600 to-red-600 px-4 py-3 text-white";

        return href ? (
          <Link key={banner.id} href={href} className={`${className} active:scale-[0.98] transition`}>
            {content}
          </Link>
        ) : (
          <div key={banner.id} className={className}>
            {content}
          </div>
        );
      })}
    </div>
  );
}
