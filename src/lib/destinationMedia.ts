import { backendFetch } from "./backend";
import { backendCountryCode } from "./esim-routes";

export type DestinationMedia = {
  imageUrl: string;
  alt: string;
  sourceUrl: string;
};

const CACHE_SECONDS = 60 * 60 * 24;

/**
 * The destination's hero photo, server-side: the same backend CountryMedia
 * cache (f153) /bff/country-image proxies for the browser. Null on any miss,
 * so the caller keeps its fallback photo.
 */
export async function getDestinationMedia(
  slug: string,
  countryName: string
): Promise<DestinationMedia | null> {
  const query = new URLSearchParams({ name: countryName });
  const result = await backendFetch<Partial<DestinationMedia>>(
    `/packages/destinations/${encodeURIComponent(backendCountryCode(slug))}/media?${query.toString()}`,
    { next: { revalidate: CACHE_SECONDS } }
  );

  const imageUrl = result.ok ? result.data?.imageUrl?.trim() : undefined;
  if (!result.ok || !imageUrl) {
    return null;
  }

  return {
    imageUrl,
    alt: result.data?.alt ?? "",
    sourceUrl: result.data?.sourceUrl ?? ""
  };
}
