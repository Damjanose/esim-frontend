"use client";

import { Globe2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import { isOptimizableImageUrl } from "./countryImageCache";
import { crawlRel } from "@/lib/robots-policy";
import { useLazyCountryImage } from "./useLazyCountryImage";

export type PhotoTileSize = "trending" | "rail";

/**
 * Fixed width and aspect ratio per size. The gradient placeholder, the photo
 * and BrowseSkeleton's placeholders all use this box, so nothing shifts when a
 * photo arrives (or never does). Phone sizes follow the app: about 150x110 for
 * Trending and 100x70 for rails.
 */
export const PHOTO_TILE_BOX: Record<PhotoTileSize, string> = {
  trending: "w-[150px] aspect-[15/11] sm:w-[176px] lg:w-[208px]",
  rail: "w-[100px] aspect-[10/7] sm:w-[128px] lg:w-[152px]",
};

/**
 * The tile's rendered width per breakpoint. The backend's photos are 1920px
 * Wikimedia files; this keeps next/image on its small variants.
 */
const PHOTO_TILE_SIZES: Record<PhotoTileSize, string> = {
  trending: "(min-width: 1024px) 208px, (min-width: 640px) 176px, 150px",
  rail: "(min-width: 1024px) 152px, (min-width: 640px) 128px, 100px",
};

type PhotoTileProps = {
  href: string;
  country: string;
  /** Destination slug, used as the /bff/country-image lookup key. */
  countryCode: string;
  flagUri: string;
  /** "3 GB · 7 days · from €4.00" (Trending) or "from €4.00" (rails). */
  detail: string;
  size: PhotoTileSize;
};

/** A country photo card for the browse carousels. The photo loads lazily (useLazyCountryImage). */
export function PhotoTile({ href, country, countryCode, flagUri, detail, size }: PhotoTileProps) {
  const tileRef = useRef<HTMLAnchorElement>(null);
  const image = useLazyCountryImage(tileRef, countryCode, country);
  const [loadedUrl, setLoadedUrl] = useState<string | null>(null);
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const photoUrl = image && image.imageUrl !== failedUrl ? image.imageUrl : null;
  const trending = size === "trending";
  const badge = trending ? "h-6 w-6" : "h-4 w-4 sm:h-5 sm:w-5";

  return (
    <Link
      className={`group relative block overflow-hidden rounded-[16px] bg-gradient-to-br from-brandBlue via-[#0E86C0] to-brandTeal focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brandBlue ${PHOTO_TILE_BOX[size]}`}
      href={href}
      ref={tileRef}
      rel={crawlRel(href)}
    >
      {photoUrl ? (
        <Image
          alt=""
          className={`object-cover motion-safe:transition motion-safe:duration-300 motion-safe:group-hover:scale-[1.04] ${
            loadedUrl === photoUrl ? "opacity-100" : "opacity-0"
          }`}
          fill
          onError={() => setFailedUrl(photoUrl)}
          onLoad={() => setLoadedUrl(photoUrl)}
          sizes={PHOTO_TILE_SIZES[size]}
          src={photoUrl}
          unoptimized={!isOptimizableImageUrl(photoUrl)}
        />
      ) : null}

      {/* Bottom scrim: keeps the caption readable over any photo, and over the gradient. */}
      <span
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-brandInk/85 via-brandInk/25 to-transparent"
      />

      {flagUri ? (
        <img
          alt={`${country} flag`}
          className={`absolute left-2 top-2 rounded-full border border-surface/80 object-cover ${badge}`}
          decoding="async"
          loading="lazy"
          src={flagUri}
        />
      ) : (
        <span
          className={`absolute left-2 top-2 grid place-items-center rounded-full bg-surface/90 text-brandBlue ${badge}`}
        >
          <Globe2 aria-hidden="true" size={trending ? 14 : 11} />
        </span>
      )}

      <span className="absolute inset-x-2 bottom-2 text-surface">
        <span className="block truncate font-display text-[13px] font-black leading-4 sm:text-sm sm:leading-5">
          {country}
        </span>
        <span
          className={`mt-0.5 block text-[11px] font-semibold leading-[14px] text-surface/85 ${
            trending ? "line-clamp-2" : "truncate"
          }`}
        >
          {detail}
        </span>
      </span>
    </Link>
  );
}
