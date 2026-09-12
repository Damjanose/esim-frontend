import { unstable_cache } from "next/cache";
import { getBackendApiUrl } from "./backend";
import { backendCountryCode } from "./esim-routes";

export type DestinationOffer = {
  lowPrice: number;
  highPrice: number;
  currency: string;
  offerCount: number;
};

export type DestinationPlanRow = {
  id: string;
  title: string;
  dataLabel: string;
  durationLabel: string;
  network: string;
  price: string;
  priceNumeric: number;
};

type ApiPackage = {
  id?: string;
  countryCode?: string;
  title?: string;
  dataLabel?: string;
  durationLabel?: string;
  price?: string;
  priceNumeric?: number;
  network?: string;
  filters?: string[];
};

type PackagesResponse = {
  data?: { packages?: ApiPackage[] };
  packages?: ApiPackage[];
};

type OfferIndex = Record<string, DestinationOffer>;
type PlanIndex = Record<string, DestinationPlanRow[]>;

type DestinationCatalog = {
  offers: OfferIndex;
  plans: PlanIndex;
};

const OFFER_CURRENCY = "EUR";
const MAX_PLANS_PER_DESTINATION = 12;

function catalogFromPackages(packages: ApiPackage[]): DestinationCatalog {
  const pricesByCode = new Map<string, number[]>();
  const plansByCode = new Map<string, DestinationPlanRow[]>();

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

    const row: DestinationPlanRow = {
      id: pkg.id?.trim() || `${code}-${pkg.priceNumeric}-${pkg.dataLabel ?? "plan"}`,
      title: pkg.title?.trim() || `${pkg.dataLabel ?? "Data"} · ${pkg.durationLabel ?? "plan"}`,
      dataLabel: pkg.dataLabel?.trim() || "Data plan",
      durationLabel: pkg.durationLabel?.trim() || "Flexible validity",
      network: pkg.network?.trim() || "4G/5G",
      price: pkg.price?.trim() || `€${pkg.priceNumeric.toFixed(2)}`,
      priceNumeric: pkg.priceNumeric
    };

    const rows = plansByCode.get(code);
    if (rows) {
      rows.push(row);
    } else {
      plansByCode.set(code, [row]);
    }
  }

  const offers: OfferIndex = {};
  for (const [code, prices] of pricesByCode) {
    offers[code] = {
      lowPrice: Math.min(...prices),
      highPrice: Math.max(...prices),
      currency: OFFER_CURRENCY,
      offerCount: prices.length
    };
  }

  const plans: PlanIndex = {};
  for (const [code, rows] of plansByCode) {
    plans[code] = rows
      .sort((a, b) => a.priceNumeric - b.priceNumeric)
      .slice(0, MAX_PLANS_PER_DESTINATION);
  }

  return { offers, plans };
}

async function loadCatalog(): Promise<DestinationCatalog> {
  try {
    const response = await fetch(`${getBackendApiUrl()}/packages`, {
      headers: { Accept: "application/json" },
      cache: "no-store"
    });

    if (!response.ok) {
      return { offers: {}, plans: {} };
    }

    const payload = (await response.json()) as PackagesResponse;
    return catalogFromPackages(payload.data?.packages ?? payload.packages ?? []);
  } catch {
    return { offers: {}, plans: {} };
  }
}

// Next's data cache rejects bodies over 2MB. `/api/packages` is ~2.7MB, so we
// must not `fetch` it with `next.revalidate`. Cache only this slim per-country
// catalog (ISR, 1h) so destination JSON-LD prices and plan tables refresh
// without storing the full payload.
const getCachedCatalog = unstable_cache(loadCatalog, ["destination-catalog"], {
  revalidate: 3600
});

export async function getDestinationOffer(slug: string): Promise<DestinationOffer | null> {
  const catalog = await getCachedCatalog();
  return catalog.offers[backendCountryCode(slug)] ?? null;
}

export async function getDestinationPlanRows(slug: string): Promise<DestinationPlanRow[]> {
  const catalog = await getCachedCatalog();
  return catalog.plans[backendCountryCode(slug)] ?? [];
}

export async function getGlobalOffer(): Promise<DestinationOffer | null> {
  const catalog = await getCachedCatalog();
  const offers = Object.values(catalog.offers);
  if (offers.length === 0) {
    return null;
  }

  return {
    lowPrice: Math.min(...offers.map((offer) => offer.lowPrice)),
    highPrice: Math.max(...offers.map((offer) => offer.highPrice)),
    currency: OFFER_CURRENCY,
    offerCount: offers.reduce((sum, offer) => sum + offer.offerCount, 0)
  };
}
