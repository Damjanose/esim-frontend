"use client";

import { useEffect, useState } from "react";
import { Globe2 } from "lucide-react";
import { flagUrl } from "@/lib/flightPickers";

/**
 * A country's flag from flagcdn, or a globe when the code has no flag (Travelpayouts
 * uses non-ISO codes like AB/KX/NY for disputed territories) or the image fails.
 * Decorative: the country name is always printed next to it.
 */
export function CountryFlag({ code, className }: { code: string; className: string }) {
  const src = flagUrl(code);
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  return (
    <span className={`grid shrink-0 place-items-center overflow-hidden bg-brandBlue/[0.06] ${className}`}>
      {src && !failed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img alt="" className="h-full w-full object-cover" loading="lazy" onError={() => setFailed(true)} src={src} />
      ) : (
        <Globe2 aria-hidden="true" className="text-onSurfaceVariant" size={14} />
      )}
    </span>
  );
}
