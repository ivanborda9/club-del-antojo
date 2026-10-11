"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
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

function BannerSlide({ banner }: { banner: BannerRow }) {
  const content = banner.imageUrl ? (
    <div className="relative h-32 w-full overflow-hidden rounded-2xl bg-orange-100">
      <Image src={banner.imageUrl} alt={banner.title} fill className="object-cover" />
      {(banner.title || banner.subtitle) && (
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-4 py-2">
          <p className="text-sm font-bold leading-tight text-white">{banner.title}</p>
          {banner.subtitle && (
            <p className="text-xs leading-tight text-orange-50">{banner.subtitle}</p>
          )}
        </div>
      )}
    </div>
  ) : (
    <div className="flex h-32 w-full items-center gap-3 rounded-2xl bg-gradient-to-br from-orange-600 to-red-600 px-4 text-white">
      <span className="text-3xl">{banner.emoji}</span>
      <div>
        <p className="text-base font-bold leading-tight">{banner.title}</p>
        {banner.subtitle && <p className="text-xs leading-tight text-orange-50">{banner.subtitle}</p>}
      </div>
    </div>
  );

  const href = bannerHref(banner);
  return href ? (
    <Link href={href} className="block active:scale-[0.98] transition">
      {content}
    </Link>
  ) : (
    content
  );
}

export function Banners({
  banners,
  intervalSeconds = 5,
}: {
  banners: BannerRow[];
  intervalSeconds?: number;
}) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % banners.length);
    }, Math.max(1, intervalSeconds) * 1000);
    return () => clearInterval(timer);
  }, [banners.length, intervalSeconds]);

  // Si cambia la cantidad de banners (ej. uno deja de estar en horario) y el
  // índice actual queda fuera de rango, lo corregimos durante el render.
  const safeIndex = index >= banners.length ? 0 : index;
  if (safeIndex !== index) setIndex(safeIndex);

  if (banners.length === 0) return null;

  return (
    <div className="px-4 pt-3">
      <BannerSlide banner={banners[safeIndex]} />
      {banners.length > 1 && (
        <div className="mt-2 flex justify-center gap-1.5">
          {banners.map((banner, i) => (
            <button
              key={banner.id}
              type="button"
              aria-label={`Ir al banner ${i + 1}`}
              onClick={() => setIndex(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === safeIndex ? "w-5 bg-orange-600" : "w-1.5 bg-orange-200"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
