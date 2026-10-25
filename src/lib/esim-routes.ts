import { catalogDestinationGroups, catalogDestinations } from "@/content/catalog-destinations";

/**
 * Backend `/packages` `countryCode` is a slugified country name
 * (`united-states`), not always the public `/esim/[slug]` (`usa`).
 */
export const BACKEND_COUNTRY_CODE_BY_SLUG: Record<string, string> = {
  usa: "united-states",
  uk: "united-kingdom",
  uae: "united-arab-emirates",
  // Regional pages whose backend region code differs from the public slug.
  // Every backend `europe` plan covers all Balkan countries except Kosovo.
  balkans: "europe",
  "middle-east": "middle-east-and-north-africa",
  "south-america": "latin-america",
  ...Object.fromEntries(
    catalogDestinations.flatMap((entry) => (entry.backendCode ? [[entry.slug, entry.backendCode]] : []))
  )
};

const EXTRA_QUERY_ALIASES: Record<string, string> = {
  us: "usa",
  "united-states": "usa",
  gb: "uk",
  "united-kingdom": "uk",
  "great-britain": "uk",
  britain: "uk",
  england: "uk",
  "united-arab-emirates": "uae"
};

function normalizeCountryQuery(value: string) {
  return value.trim().toLowerCase().replace(/_/g, "-").replace(/\s+/g, "-");
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
  if (aliased in destinationDisplay) {
    return aliased;
  }

  for (const slug of Object.keys(destinationDisplay)) {
    if ((BACKEND_COUNTRY_CODE_BY_SLUG[slug] ?? slug) === aliased) {
      return slug;
    }
  }

  return null;
}

export function esimPathForCountryQuery(country: string): string | null {
  const slug = esimSlugFromCountryQuery(country);
  return slug ? `/esim/${slug}` : null;
}

/**
 * `/esim/united-states` → `/esim/usa`: people and AI agents guess the full
 * country name, so known aliases get a redirect instead of a 404. Real slugs,
 * unknown names and the private `/esim/id/*` paths return null.
 */
export function esimAliasPath(pathname: string): string | null {
  const match = /^\/esim\/([^/]+)$/.exec(pathname);
  if (!match || match[1] === "id" || match[1] in destinationDisplay) {
    return null;
  }
  const slug = esimSlugFromCountryQuery(match[1]);
  return slug && slug !== match[1] ? `/esim/${slug}` : null;
}

/** Browse/chip links: canonical `/esim/[slug]` when a content page exists. */
export function destinationBrowseHref(countryCode: string): string {
  return esimPathForCountryQuery(countryCode) ?? `/destinations?country=${encodeURIComponent(countryCode)}`;
}

export type DestinationDisplay = {
  countryName: string;
  relatedSlugs: string[];
  /** Shown above the live coverage list on regional pages. */
  coverageNote?: string;
};

const handWrittenDisplay: Record<string, DestinationDisplay> = {
  albania: { countryName: "Albania", relatedSlugs: ["greece", "italy", "croatia", "balkans", "europe"] },
  turkey: { countryName: "Turkey", relatedSlugs: ["greece", "middle-east", "europe"] },
  italy: { countryName: "Italy", relatedSlugs: ["greece", "france", "croatia", "europe"] },
  greece: { countryName: "Greece", relatedSlugs: ["italy", "albania", "turkey", "europe"] },
  germany: { countryName: "Germany", relatedSlugs: ["france", "netherlands", "switzerland", "austria", "europe"] },
  france: { countryName: "France", relatedSlugs: ["uk", "germany", "europe"] },
  spain: { countryName: "Spain", relatedSlugs: ["portugal", "italy", "europe"] },
  usa: { countryName: "USA", relatedSlugs: ["canada", "mexico", "north-america"] },
  uk: { countryName: "UK", relatedSlugs: ["france", "europe"] },
  japan: { countryName: "Japan", relatedSlugs: ["asia", "thailand"] },
  europe: {
    countryName: "Europe",
    relatedSlugs: ["albania", "croatia", "france", "germany", "greece", "italy", "spain", "uk", "balkans"]
  },
  portugal: { countryName: "Portugal", relatedSlugs: ["spain", "europe"] },
  switzerland: { countryName: "Switzerland", relatedSlugs: ["germany", "france", "europe"] },
  thailand: { countryName: "Thailand", relatedSlugs: ["asia", "indonesia", "japan"] },
  uae: { countryName: "UAE", relatedSlugs: ["asia"] },
  mexico: { countryName: "Mexico", relatedSlugs: ["usa", "south-america", "north-america"] },
  canada: { countryName: "Canada", relatedSlugs: ["usa", "north-america"] },
  australia: { countryName: "Australia", relatedSlugs: ["indonesia", "asia"] },
  indonesia: { countryName: "Indonesia", relatedSlugs: ["thailand", "asia", "australia"] },
  asia: { countryName: "Asia", relatedSlugs: ["japan", "thailand", "indonesia", "uae"] },
  "north-america": { countryName: "North America", relatedSlugs: ["usa", "canada", "mexico", "south-america"] },
  netherlands: { countryName: "Netherlands", relatedSlugs: ["germany", "france", "europe"] },
  austria: { countryName: "Austria", relatedSlugs: ["germany", "switzerland", "croatia", "europe"] },
  ireland: { countryName: "Ireland", relatedSlugs: ["uk", "france", "europe"] },
  croatia: { countryName: "Croatia", relatedSlugs: ["balkans", "italy", "europe"] },
  balkans: {
    countryName: "Balkans",
    relatedSlugs: ["albania", "greece", "croatia", "europe"],
    coverageNote:
      "Balkans trips use our Europe regional plans, so one eSIM covers the Balkan countries below and the rest of Europe. Kosovo is not included."
  },
  "middle-east": {
    countryName: "Middle East",
    relatedSlugs: ["uae", "turkey", "africa", "asia", "europe"],
    coverageNote: "These Middle East and North Africa plans cover the countries below."
  },
  africa: { countryName: "Africa", relatedSlugs: ["europe", "asia"] },
  "south-america": {
    countryName: "South America",
    relatedSlugs: ["mexico", "usa", "north-america", "africa"],
    coverageNote: "These Latin America plans cover the South and Central American countries listed below."
  }
};

const MAX_CATALOG_NEIGHBOURS = 4;

/**
 * Generated country pages: the next sub-region members after this one
 * (wrapping), then the regional hub. Rotating instead of always taking the
 * group's first members gives every member inbound links from its peers.
 */
const catalogDisplay: Record<string, DestinationDisplay> = Object.fromEntries(
  catalogDestinations.map((entry) => {
    const { members, hub } = catalogDestinationGroups[entry.group];
    const start = members.indexOf(entry.slug);
    const rotated = [...members.slice(start + 1), ...members.slice(0, Math.max(start, 0))];
    const neighbours = rotated.filter((member) => member !== entry.slug).slice(0, MAX_CATALOG_NEIGHBOURS);
    return [entry.slug, { countryName: entry.name, relatedSlugs: [...neighbours, hub] }];
  })
);

export const destinationDisplay: Record<string, DestinationDisplay> = {
  ...catalogDisplay,
  ...handWrittenDisplay
};

export function destinationH1(slug: string) {
  const name = destinationDisplay[slug]?.countryName;
  return name ? `eSIM for ${name}` : null;
}
