"use client";

import Link from "next/link";
import { Globe2, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { fetchPackageGroups, type HeroPackageOption } from "@/services/packages";
import { destinationBrowseHref } from "@/lib/esim-routes";

const CHIP_COUNT = 8;
// Typical rendered chip widths (flag + country name), so the placeholder
// wraps into the same number of rows as the real chips.
const CHIP_PLACEHOLDER_WIDTHS = [118, 92, 104, 86, 128, 96, 110, 90];

/**
 * Same `popular` group DestinationBrowse's "Popular destinations" rail
 * renders, deduped to one chip per country (the backend already dedupes per
 * destination, but a defensive dedupe here keeps this resilient if that
 * ever changes).
 */
function dedupeByCountry(packages: readonly HeroPackageOption[]): HeroPackageOption[] {
  const seen = new Set<string>();
  const result: HeroPackageOption[] = [];

  for (const pkg of packages) {
    const code = pkg.countryCode.trim().toLowerCase();
    if (!code || seen.has(code)) continue;
    seen.add(code);
    result.push(pkg);
  }

  return result;
}

export function HeroDestinationChips() {
  const [popular, setPopular] = useState<HeroPackageOption[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let active = true;

    fetchPackageGroups()
      .then((groups) => {
        if (!active) return;
        setLoadError(false);
        setPopular(dedupeByCountry(groups.popular).slice(0, CHIP_COUNT));
      })
      .catch((error) => {
        console.error("Failed to load popular destinations:", error);
        if (active) setLoadError(true);
      });

    return () => {
      active = false;
    };
  }, [retryCount]);

  const handleRetry = useCallback(() => setRetryCount((count) => count + 1), []);

  if (loadError) {
    return (
      <button
        className="mt-6 inline-flex h-11 items-center gap-2 rounded-full border border-outline bg-surface px-4 text-xs font-bold text-onSurfaceVariant transition hover:border-brandBlue/40 hover:text-brandBlue"
        onClick={handleRetry}
        type="button"
      >
        <RefreshCw aria-hidden="true" size={13} />
        Popular destinations unavailable — try again
      </button>
    );
  }

  if (popular === null) {
    // Reserve the chips' space while they load, so chips arriving after the
    // client fetch never shift the hero (f192: CLS 0.139 -> 0). The height
    // must match the real chip (h-11). Below sm the row is one sideways-
    // scrolling line (the app's chip rail); [contain:inline-size] keeps its
    // unwrapped width from stretching the hero column.
    return (
      <div aria-hidden="true" className="-mx-5 mt-6 flex w-[calc(100%+2.5rem)] gap-2.5 overflow-x-auto px-5 pb-1 [contain:inline-size] [scrollbar-width:none] sm:mx-0 sm:w-full sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
        {CHIP_PLACEHOLDER_WIDTHS.map((width, index) => (
          <span
            className="h-11 shrink-0 rounded-full border border-outline/60 bg-surfaceBright"
            key={index}
            style={{ width }}
          />
        ))}
      </div>
    );
  }

  if (popular.length === 0) return null;

  return (
    <div className="-mx-5 mt-6 flex w-[calc(100%+2.5rem)] gap-2.5 overflow-x-auto px-5 pb-1 [contain:inline-size] [scrollbar-width:none] sm:mx-0 sm:w-full sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
      {popular.map((pkg) => (
        <Link
          className="group flex h-11 shrink-0 items-center gap-2 rounded-full border border-outline bg-surface px-3.5 text-xs font-bold text-onSurface transition hover:border-brandBlue/40 hover:text-brandBlue"
          href={destinationBrowseHref(pkg.countryCode)}
          key={pkg.countryCode}
        >
          {pkg.flagUri ? (
            <img
              alt=""
              className="h-5 w-5 shrink-0 rounded-full border border-outline object-cover"
              src={pkg.flagUri}
            />
          ) : (
            <Globe2 aria-hidden="true" className="text-brandBlue" size={14} />
          )}
          {pkg.country}
        </Link>
      ))}
    </div>
  );
}
