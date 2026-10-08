import { unstable_cache } from "next/cache";
import { getBackendApiUrl } from "./backend";
import { backendCountryCode, destinationDisplay } from "./esim-routes";

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
  /** 999+ means unlimited; 0 when the backend didn't say. */
  dataNumericGb: number;
  /** 0 when the backend didn't say. */
  durationDays: number;
  /** Only set when the plan includes minutes / texts. */
  voiceMinutes?: number;
  smsCount?: number;
  /** Only set while an admin discount is active (see services/discountPricing). */
  hasDiscount?: true;
  retailPrice?: number;
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
  flagUri?: string;
  dataNumericGb?: number;
  durationDays?: number;
  voiceMinutes?: number;
  smsCount?: number;
  hasDiscount?: boolean;
  retailPrice?: number;
  filters?: string[];
  countries?: { countryCode?: string; title?: string }[];
};

type PackagesResponse = {
  data?: { packages?: ApiPackage[] };
  packages?: ApiPackage[];
};

type OfferIndex = Record<string, DestinationOffer>;
type PlanIndex = Record<string, DestinationPlanRow[]>;
/** Regional code -> country names included in EVERY plan for that code. */
type CoverageIndex = Record<string, string[]>;
/** Code -> the first flag image its packages carry. */
type FlagIndex = Record<string, string>;

/** The plan with the lowest price per GB, among plans with a known, finite data size. */
export type BestPerGbPlan = {
  pricePerGb: number;
  priceNumeric: number;
  dataLabel: string;
  durationLabel: string;
};
type BestPerGbIndex = Record<string, BestPerGbPlan>;

type DestinationCatalog = {
  offers: OfferIndex;
  plans: PlanIndex;
  coverage: CoverageIndex;
  flags: FlagIndex;
  bestPerGb: BestPerGbIndex;
  /** ISO time the backend catalog was fetched. */
  fetchedAt: string;
};

const UNLIMITED_GB = 999;

const OFFER_CURRENCY = "EUR";
const MAX_PLANS_PER_DESTINATION = 12;

function catalogFromPackages(packages: ApiPackage[]): DestinationCatalog {
  const pricesByCode = new Map<string, number[]>();
  const plansByCode = new Map<string, DestinationPlanRow[]>();
  const coverageByCode = new Map<string, Set<string>>();
  const flags: FlagIndex = {};
  const bestPerGb: BestPerGbIndex = {};

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
      priceNumeric: pkg.priceNumeric,
      dataNumericGb: typeof pkg.dataNumericGb === "number" ? pkg.dataNumericGb : 0,
      durationDays: typeof pkg.durationDays === "number" ? pkg.durationDays : 0,
      ...(typeof pkg.voiceMinutes === "number" && pkg.voiceMinutes > 0 ? { voiceMinutes: pkg.voiceMinutes } : {}),
      ...(typeof pkg.smsCount === "number" && pkg.smsCount > 0 ? { smsCount: pkg.smsCount } : {}),
      ...(pkg.hasDiscount === true && typeof pkg.retailPrice === "number"
        ? { hasDiscount: true as const, retailPrice: pkg.retailPrice }
        : {})
    };

    if (row.dataNumericGb > 0 && row.dataNumericGb < UNLIMITED_GB) {
      const pricePerGb = row.priceNumeric / row.dataNumericGb;
      if (!bestPerGb[code] || pricePerGb < bestPerGb[code].pricePerGb) {
        bestPerGb[code] = {
          pricePerGb,
          priceNumeric: row.priceNumeric,
          dataLabel: row.dataLabel,
          durationLabel: row.durationLabel
        };
      }
    }

    const flagUri = pkg.flagUri?.trim();
    if (flagUri && !flags[code]) flags[code] = flagUri;

    const planCountries = new Set(
      (pkg.countries ?? []).map((country) => country.title?.trim() ?? "").filter(Boolean)
    );
    const covered = coverageByCode.get(code);
    if (covered) {
      for (const country of covered) {
        if (!planCountries.has(country)) covered.delete(country);
      }
    } else {
      coverageByCode.set(code, planCountries);
    }

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

  // Only multi-country (regional) plans need a coverage list; single-country
  // plans would just repeat the destination name.
  const coverage: CoverageIndex = {};
  for (const [code, countries] of coverageByCode) {
    if (countries.size > 1) {
      coverage[code] = [...countries].sort((a, b) => a.localeCompare(b));
    }
  }

  return { offers, plans, coverage, flags, bestPerGb, fetchedAt: new Date().toISOString() };
}

function emptyCatalog(): DestinationCatalog {
  return { offers: {}, plans: {}, coverage: {}, flags: {}, bestPerGb: {}, fetchedAt: new Date().toISOString() };
}

async function loadCatalog(): Promise<DestinationCatalog> {
  try {
    const response = await fetch(`${getBackendApiUrl()}/packages`, {
      headers: { Accept: "application/json" },
      cache: "no-store"
    });

    if (!response.ok) {
      return emptyCatalog();
    }

    const payload = (await response.json()) as PackagesResponse;
    return catalogFromPackages(payload.data?.packages ?? payload.packages ?? []);
  } catch {
    return emptyCatalog();
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

export async function getDestinationCoverage(slug: string): Promise<string[]> {
  const catalog = await getCachedCatalog();
  return catalog.coverage?.[backendCountryCode(slug)] ?? [];
}

/** The destination's flag image (Airalo CDN), or null. */
export async function getDestinationFlag(slug: string): Promise<string | null> {
  const catalog = await getCachedCatalog();
  return catalog.flags?.[backendCountryCode(slug)] ?? null;
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

export type PriceIndexRow = {
  slug: string;
  name: string;
  path: string;
  fromPrice: number;
  planCount: number;
  bestPerGb: BestPerGbPlan | null;
};

/**
 * One row per /esim/[slug] page with live plans, for the public price index.
 * Pages that reuse another page's backend region (Balkans uses Europe plans)
 * are skipped so the same plans aren't listed twice.
 */
export async function getPriceIndex(): Promise<{ rows: PriceIndexRow[]; updatedAt: string }> {
  const catalog = await getCachedCatalog();
  const seenCodes = new Set<string>();
  const slugs = Object.keys(destinationDisplay).sort((a, b) => {
    // Visit slugs that ARE their backend code first, so they win the dedupe.
    const aOwn = backendCountryCode(a) === a ? 0 : 1;
    const bOwn = backendCountryCode(b) === b ? 0 : 1;
    return aOwn - bOwn;
  });

  const rows: PriceIndexRow[] = [];
  for (const slug of slugs) {
    const code = backendCountryCode(slug);
    const offer = catalog.offers[code];
    if (!offer || seenCodes.has(code)) continue;
    seenCodes.add(code);
    rows.push({
      slug,
      name: destinationDisplay[slug].countryName,
      path: `/esim/${slug}`,
      fromPrice: offer.lowPrice,
      planCount: offer.offerCount,
      // Older cached catalogs predate bestPerGb.
      bestPerGb: catalog.bestPerGb?.[code] ?? null
    });
  }

  rows.sort((a, b) => a.name.localeCompare(b.name));
  return { rows, updatedAt: catalog.fetchedAt ?? new Date().toISOString() };
}

export async function getPriceIndexRows(): Promise<PriceIndexRow[]> {
  return (await getPriceIndex()).rows;
}
