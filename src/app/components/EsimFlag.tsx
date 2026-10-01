import { Globe2 } from "lucide-react";

/**
 * A plan's flag in a rounded tile, or a globe when the catalog has none. Decorative:
 * the country name is always printed next to it. Plain img: flag URIs come from the
 * catalog CDN, which the image optimiser isn't configured for.
 */
export function EsimFlag({ flagUri, className }: { flagUri: string | null; className: string }) {
  return (
    <span className={`grid shrink-0 place-items-center overflow-hidden ${className}`}>
      {flagUri ? (
        <img alt="" className="h-full w-full object-cover" src={flagUri} />
      ) : (
        <Globe2 aria-hidden="true" size={20} />
      )}
    </span>
  );
}
