import Image from "next/image";
import { isOptimizableImageUrl } from "../destinations/countryImageCache";

/**
 * A catalog flag (flagUri, served from Airalo's CDN) through next/image, so it
 * is resized to its display size and the CDN's __cf_bm cookie never reaches
 * the visitor's browser. Hosts next.config.mjs doesn't allow fall back to a
 * plain unoptimized image instead of a broken optimizer URL.
 */
export function FlagImage({
  src,
  alt,
  width,
  height = width,
  className,
  onError
}: {
  src: string;
  alt: string;
  /** CSS pixel size the flag is displayed at. */
  width: number;
  height?: number;
  className?: string;
  onError?: () => void;
}) {
  return (
    <Image
      alt={alt}
      className={className}
      height={height}
      onError={onError}
      src={src}
      unoptimized={!isOptimizableImageUrl(src)}
      width={width}
    />
  );
}
