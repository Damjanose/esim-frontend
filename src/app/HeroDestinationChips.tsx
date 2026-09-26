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
        className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3.5 py-2 text-xs font-bold text-white/85 backdrop-blur-md transition hover:border-white/50 hover:bg-white/20"
        onClick={handleRetry}
        type="button"
      >
        <RefreshCw aria-hidden="true" size={13} />
        Popular destinations unavailable — try again
      </button>
    );
  }

  if (popular === null) {
    // Reserve the chips' space while they load: the hero centers its content
    // vertically, so appearing chips used to push the search box up (CLS).
    return (
      <div aria-hidden="true" className="mt-6 flex flex-wrap justify-center gap-2.5 lg:justify-start">
        {CHIP_PLACEHOLDER_WIDTHS.map((width, index) => (
          <span
            className="h-[38px] rounded-full border border-white/15 bg-white/5"
            key={index}
            style={{ width }}
          />
        ))}
      </div>
    );
  }

  if (popular.length === 0) return null;

  return (
    <div className="mt-6 flex flex-wrap justify-center gap-2.5 lg:justify-start">
      {popular.map((pkg) => (
        <Link
          className="group flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3.5 py-2 text-xs font-bold text-white backdrop-blur-md transition hover:border-white/50 hover:bg-white/20"
          href={destinationBrowseHref(pkg.countryCode)}
          key={pkg.countryCode}
        >
          {pkg.flagUri ? (
            <img
              alt=""
              className="h-5 w-5 shrink-0 rounded-full border border-white/30 object-cover"
              src={pkg.flagUri}
            />
          ) : (
            <Globe2 aria-hidden="true" size={14} />
          )}
          {pkg.country}
        </Link>
      ))}
    </div>
  );
}
