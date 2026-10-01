/**
 * Country photos for the browse PhotoTiles. The source is /bff/country-image,
 * a thin proxy to the backend's Postgres CountryMedia cache (f153). It's the
 * same URL DestinationPlans requests, so the two share the browser HTTP cache.
 *
 * The module-level cache is keyed by destination slug and holds the in-flight
 * promise, so a country shown in Trending and in three rails is fetched once,
 * even when all of its tiles mount together. A definitive miss (non-2xx, or no
 * imageUrl) is cached as null, so the tile keeps its gradient without asking
 * again. A network error is evicted, so a tile mounted later can retry.
 */

export type CountryImage = { imageUrl: string };
export type CountryImageQuery = { slug: string; country: string };

type FetchLike = (
  input: string,
  init?: RequestInit,
) => Promise<{ ok: boolean; json(): Promise<unknown> }>;

type CacheEntry = {
  promise: Promise<CountryImage | null>;
  settled: boolean;
  value: CountryImage | null;
};

function slugifyCountryName(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Cache key: the destination slug, else the slugified country name (the BFF's own fallback). */
export function countryImageKey({ slug, country }: CountryImageQuery): string {
  return slug.trim().toLowerCase() || slugifyCountryName(country);
}

/** Same parameters, in the same order, as DestinationPlans' useCountryHeroImage. */
export function countryImageUrl({ slug, country }: CountryImageQuery): string {
  const params = new URLSearchParams();
  if (slug.trim()) params.set("slug", slug.trim());
  if (country.trim()) params.set("country", country.trim());
  return `/bff/country-image?${params.toString()}`;
}

function toCountryImage(payload: unknown): CountryImage | null {
  if (!payload || typeof payload !== "object") return null;
  const imageUrl = (payload as { imageUrl?: unknown }).imageUrl;
  return typeof imageUrl === "string" && imageUrl.trim() ? { imageUrl } : null;
}

export function createCountryImageCache(fetcher: FetchLike) {
  const entries = new Map<string, CacheEntry>();

  function load(query: CountryImageQuery): Promise<CountryImage | null> {
    const key = countryImageKey(query);
    if (!key) return Promise.resolve(null);

    const existing = entries.get(key);
    if (existing) return existing.promise;

    const entry: CacheEntry = { promise: Promise.resolve(null), settled: false, value: null };
    entry.promise = fetcher(countryImageUrl(query), { cache: "force-cache" })
      .then(async (response) => (response.ok ? toCountryImage(await response.json()) : null))
      .then(
        (value) => {
          entry.settled = true;
          entry.value = value;
          return value;
        },
        () => {
          entries.delete(key);
          return null;
        },
      );
    entries.set(key, entry);
    return entry.promise;
  }

  /** The settled result, or undefined while the photo is unrequested or in flight. */
  function peek(query: CountryImageQuery): CountryImage | null | undefined {
    const entry = entries.get(countryImageKey(query));
    return entry?.settled ? entry.value : undefined;
  }

  return { load, peek };
}

// The arrow looks fetch up on each call, so it's never invoked detached from window.
const browserCountryImages = createCountryImageCache((input, init) => fetch(input, init));

export const loadCountryImage = browserCountryImages.load;
export const peekCountryImage = browserCountryImages.peek;

/**
 * Mirrors next.config.mjs images.remotePatterns (Next's `*` matches exactly one
 * subdomain label). next/image throws on any other host, so a photo from
 * anywhere else is rendered with `unoptimized` instead.
 */
const NEXT_IMAGE_HOSTS = [/^images\.unsplash\.com$/, /^[^.]+\.wikimedia\.org$/, /^flagcdn\.com$/];

export function isOptimizableImageUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && NEXT_IMAGE_HOSTS.some((host) => host.test(url.hostname));
  } catch {
    return false;
  }
}
