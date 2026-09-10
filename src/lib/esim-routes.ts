import { destinationPages } from "@/content/seo-pages";

/**
 * Backend `/packages` `countryCode` is a slugified country name
 * (`united-states`), not always the public `/esim/[slug]` (`usa`).
 */
export const BACKEND_COUNTRY_CODE_BY_SLUG: Record<string, string> = {
  usa: "united-states",
  uk: "united-kingdom",
  uae: "united-arab-emirates"
};

const EXTRA_QUERY_ALIASES: Record<string, string> = {
  us: "usa",
  "united-states": "usa",
  gb: "uk",
  "united-kingdom": "uk",
  "great-britain": "uk",
  "united-arab-emirates": "uae"
};

function normalizeCountryQuery(value: string) {
  return value.trim().toLowerCase().replace(/_/g, "-").replace(/\s+/g, "-");
}

const destinationSlugSet = new Set(destinationPages.map((page) => page.slug));

const slugByBackendCode = new Map<string, string>();
for (const page of destinationPages) {
  const backendCode = BACKEND_COUNTRY_CODE_BY_SLUG[page.slug] ?? page.slug;
  slugByBackendCode.set(backendCode, page.slug);
  slugByBackendCode.set(page.slug, page.slug);
}

export function backendCountryCode(slug: string) {
  return BACKEND_COUNTRY_CODE_BY_SLUG[slug] ?? slug;
}

export function esimSlugFromCountryQuery(country: string): string | null {
  const normalized = normalizeCountryQuery(country);
  if (!normalized) {
    return null;
  }

  const aliased = EXTRA_QUERY_ALIASES[normalized] ?? normalized;
  if (destinationSlugSet.has(aliased)) {
    return aliased;
  }

  return slugByBackendCode.get(aliased) ?? null;
}

export function esimPathForCountryQuery(country: string): string | null {
  const slug = esimSlugFromCountryQuery(country);
  return slug ? `/esim/${slug}` : null;
}

/** Browse/chip links: canonical `/esim/[slug]` when a content page exists. */
export function destinationBrowseHref(countryCode: string): string {
  return esimPathForCountryQuery(countryCode) ?? `/destinations?country=${encodeURIComponent(countryCode)}`;
}

export type DestinationDisplay = {
  countryName: string;
  relatedSlugs: string[];
};

export const destinationDisplay: Record<string, DestinationDisplay> = {
  albania: { countryName: "Albania", relatedSlugs: ["greece", "italy", "europe"] },
  turkey: { countryName: "Turkey", relatedSlugs: ["greece", "europe"] },
  italy: { countryName: "Italy", relatedSlugs: ["greece", "france", "europe"] },
  greece: { countryName: "Greece", relatedSlugs: ["italy", "albania", "europe"] },
  germany: { countryName: "Germany", relatedSlugs: ["france", "switzerland", "europe"] },
  france: { countryName: "France", relatedSlugs: ["uk", "germany", "europe"] },
  spain: { countryName: "Spain", relatedSlugs: ["portugal", "italy", "europe"] },
  usa: { countryName: "USA", relatedSlugs: ["canada", "mexico", "north-america"] },
  uk: { countryName: "UK", relatedSlugs: ["france", "europe"] },
  japan: { countryName: "Japan", relatedSlugs: ["asia", "thailand"] },
  europe: {
    countryName: "Europe",
    relatedSlugs: ["albania", "france", "germany", "greece", "italy", "spain", "uk"]
  },
  portugal: { countryName: "Portugal", relatedSlugs: ["spain", "europe"] },
  switzerland: { countryName: "Switzerland", relatedSlugs: ["germany", "france", "europe"] },
  thailand: { countryName: "Thailand", relatedSlugs: ["asia", "indonesia", "japan"] },
  uae: { countryName: "UAE", relatedSlugs: ["asia"] },
  mexico: { countryName: "Mexico", relatedSlugs: ["usa", "north-america"] },
  canada: { countryName: "Canada", relatedSlugs: ["usa", "north-america"] },
  australia: { countryName: "Australia", relatedSlugs: ["indonesia", "asia"] },
  indonesia: { countryName: "Indonesia", relatedSlugs: ["thailand", "asia", "australia"] },
  asia: { countryName: "Asia", relatedSlugs: ["japan", "thailand", "indonesia", "uae"] },
  "north-america": { countryName: "North America", relatedSlugs: ["usa", "canada", "mexico"] }
};

export function destinationH1(slug: string) {
  const name = destinationDisplay[slug]?.countryName;
  return name ? `eSIM for ${name}` : null;
}

export const seoContentUpdatedAt = new Date("2026-09-10T00:00:00.000Z");
