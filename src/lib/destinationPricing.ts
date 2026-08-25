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

async function fetchAllPackages(): Promise<ApiPackage[]> {
  try {
    const response = await fetch(`${getBackendApiUrl()}/packages`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 3600 }
    });

    if (!response.ok) {
      return [];
    }

    const payload = (await response.json()) as PackagesResponse;
    return payload.data?.packages ?? payload.packages ?? [];
  } catch {
    return [];
  }
}

/**
 * Server-side low-price lookup for a destinationPages slug, used to back the
 * Product/AggregateOffer JSON-LD on static destination pages with a real,
 * visible price rather than a guessed one.
 */
export async function getDestinationOffer(slug: string): Promise<DestinationOffer | null> {
  const packages = await fetchAllPackages();
  const code = backendCountryCode(slug);

  const prices = packages
    .filter((pkg) => pkg.countryCode?.trim().toLowerCase() === code)
    .map((pkg) => pkg.priceNumeric)
    .filter((price): price is number => typeof price === "number" && price > 0);

  if (prices.length === 0) {
    return null;
  }

  return {
    lowPrice: Math.min(...prices),
    currency: OFFER_CURRENCY,
    offerCount: prices.length
  };
}
