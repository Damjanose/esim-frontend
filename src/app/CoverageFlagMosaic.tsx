"use client";

import { Globe2 } from "lucide-react";
import { useEffect, useState } from "react";
import { fetchPackageGroups, type HeroPackageOption } from "@/services/packages";

const MOSAIC_TILE_COUNT = 11;

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

/**
 * Real destination flags standing in for a generic stock map image — ties
 * this section back to the same live catalog the Hero chips and the
 * marketplace rails below already show. Purely decorative: if the fetch
 * fails, the section above (stats bar) still renders fine without it, so
 * this fails silently rather than showing its own error/retry UI.
 */
export function CoverageFlagMosaic() {
  const [tiles, setTiles] = useState<HeroPackageOption[]>([]);

  useEffect(() => {
    let active = true;

    fetchPackageGroups()
      .then((groups) => {
        if (active) setTiles(dedupeByCountry(groups.popular).slice(0, MOSAIC_TILE_COUNT));
      })
      .catch((error) => {
        console.error("Failed to load coverage flag mosaic:", error);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-6">
      {tiles.map((pkg) => (
        <div
          className="grid aspect-square place-items-center overflow-hidden rounded-[10px] border border-outline bg-white"
          key={pkg.countryCode}
          title={pkg.country}
        >
          {pkg.flagUri ? (
            <img alt={pkg.country} className="h-full w-full object-cover" src={pkg.flagUri} />
          ) : (
            <Globe2 aria-hidden="true" className="text-brandBlue" size={18} />
          )}
        </div>
      ))}

      <div className="grid aspect-square place-items-center rounded-[10px] border border-outline bg-brandBlue/10 text-[11px] font-black text-brandBlue">
        +200
      </div>
    </div>
  );
}
