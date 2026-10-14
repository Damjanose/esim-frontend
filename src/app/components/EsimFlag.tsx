import { Globe2 } from "lucide-react";
import { FlagImage } from "./FlagImage";

/**
 * A plan's flag in a rounded tile, or a globe when the catalog has none. Decorative:
 * the country name is always printed next to it.
 */
export function EsimFlag({ flagUri, className }: { flagUri: string | null; className: string }) {
  return (
    <span className={`grid shrink-0 place-items-center overflow-hidden ${className}`}>
      {flagUri ? (
        <FlagImage alt="" className="h-full w-full object-cover" src={flagUri} width={44} />
      ) : (
        <Globe2 aria-hidden="true" size={20} />
      )}
    </span>
  );
}
