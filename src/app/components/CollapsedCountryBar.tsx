"use client";

import { ChevronLeft, Globe2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { COUNTRY_BANNER_ID } from "./CountryBanner";

/** The bar is h-14. The banner counts as gone once its bottom slides under the bar. */
const BAR_HEIGHT_PX = 56;

type CollapsedCountryBarProps = {
  country: string;
  flagUri?: string;
  /** "€4.00": the destination's cheapest plan. */
  fromPrice?: string;
};

/**
 * Phones and tablets: once the CountryBanner scrolls away, a slim bar pins the
 * country to the top (app CollapsedCountryHeader). It's position:fixed, so it
 * never shifts the layout, and it's inert while hidden. lg+ has the sidebar.
 */
export function CollapsedCountryBar({ country, flagUri, fromPrice }: CollapsedCountryBarProps) {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const banner = document.getElementById(COUNTRY_BANNER_ID);
    if (!banner || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      ([entry]) => setShown(!entry.isIntersecting && entry.boundingClientRect.top < 0),
      { rootMargin: `-${BAR_HEIGHT_PX}px 0px 0px 0px` },
    );
    observer.observe(banner);

    return () => observer.disconnect();
  }, []);

  return (
    <div
      aria-hidden={!shown}
      className={`fixed inset-x-0 top-0 z-40 border-b border-outline/60 bg-surface/90 backdrop-blur-md motion-safe:transition motion-safe:duration-200 lg:hidden ${
        shown ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-full opacity-0"
      }`}
      data-collapsed-country-bar
      inert={!shown}
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-2 md:px-5">
        <Link
          aria-label="Back to destinations"
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-brandBlue transition hover:bg-brandBlue/5"
          href="/destinations"
        >
          <ChevronLeft aria-hidden="true" size={22} />
        </Link>

        {flagUri ? (
          <img
            alt={`${country} flag`}
            className="h-5 w-7 shrink-0 rounded-[4px] border border-outline/60 object-cover"
            src={flagUri}
          />
        ) : (
          <Globe2 aria-hidden="true" className="shrink-0 text-brandBlue" size={18} />
        )}

        <p className="min-w-0 flex-1 leading-tight">
          <span className="block truncate text-sm font-black text-brandInk">{country}</span>
          {fromPrice ? (
            <span className="block text-xs font-semibold text-onSurfaceVariant">from {fromPrice}</span>
          ) : null}
        </p>
      </div>
    </div>
  );
}
