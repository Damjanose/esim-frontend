import { unstable_cache } from "next/cache";
import { getBackendApiUrl } from "./backend";

export type DestinationOffer = {
  lowPrice: number;
  currency: string;
  offerCount: number;
};

type ApiPackage = {
  countryCode?: string;
  priceNumeric?: number;
};

type PackagesResponse = {
  data?: { packages?: ApiPackage[] };
  packages?: ApiPackage[];
};

type OfferIndex = Record<string, DestinationOffer>;

// Backend prices are quoted in EUR (see `price: "€9.89"` in /api/packages).
const OFFER_CURRENCY = "EUR";

// `countryCode` on /api/packages is actually a slugified country name
// (e.g. "united-states", "europe"), not an ISO code — and "europe" is a
// real regional-plan product with its own countryCode, not an aggregate of
// individual country pages. Every destinationPages slug maps directly
// except the three below, where our slug and the backend's differ.
const COUNTRY_CODE_BY_SLUG: Record<string, string> = {
  usa: "united-states",
  uk: "united-kingdom",
  uae: "united-arab-emirates"
};

function backendCountryCode(slug: string): string {
  return COUNTRY_CODE_BY_SLUG[slug] ?? slug;
}

function offerIndexFromPackages(packages: ApiPackage[]): OfferIndex {
  const pricesByCode = new Map<string, number[]>();

  for (const pkg of packages) {
    const code = pkg.countryCode?.trim().toLowerCase();
    if (!code || typeof pkg.priceNumeric !== "number" || pkg.priceNumeric <= 0) {
      continue;
    }

    const prices = pricesByCode.get(code);
    if (prices) {
      prices.push(pkg.priceNumeric);
    } else {
      pricesByCode.set(code, [pkg.priceNumeric]);
    }
  }

  const index: OfferIndex = {};
  for (const [code, prices] of pricesByCode) {
    index[code] = {
      lowPrice: Math.min(...prices),
      currency: OFFER_CURRENCY,
      offerCount: prices.length
    };
  }

  return index;
}

async function loadOfferIndex(): Promise<OfferIndex> {
  try {
    const response = await fetch(`${getBackendApiUrl()}/packages`, {
      headers: { Accept: "application/json" },
      cache: "no-store"
    });

    if (!response.ok) {
      return {};
    }

    const payload = (await response.json()) as PackagesResponse;
    return offerIndexFromPackages(payload.data?.packages ?? payload.packages ?? []);
  } catch {
    return {};
  }
}

// Next's data cache rejects bodies over 2MB. `/api/packages` is ~2.7MB, so we
// must not `fetch` it with `next.revalidate`. Cache only this slim per-country
// index (ISR, 1h) so destination JSON-LD prices still refresh without storing
// the catalog.
const getCachedOfferIndex = unstable_cache(loadOfferIndex, ["destination-offer-index"], {
  revalidate: 3600
});

/**
 * Server-side low-price lookup for a destinationPages slug, used to back the
 * Product/AggregateOffer JSON-LD on static destination pages with a real,
 * visible price rather than a guessed one.
 */
export async function getDestinationOffer(slug: string): Promise<DestinationOffer | null> {
  const index = await getCachedOfferIndex();
  return index[backendCountryCode(slug)] ?? null;
}
