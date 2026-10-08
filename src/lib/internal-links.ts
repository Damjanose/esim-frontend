import { publicSeoPages, type SeoContentPage, type SeoPageLink } from "@/content/seo-pages";
import { destinationDisplay } from "@/lib/esim-routes";

/**
 * Internal linking between /esim and /travel pages, derived from data so a
 * new page is linked from its region, its neighbours and the relevant guides
 * without hand-editing every other page's relatedLinks.
 */

const MAX_DESTINATION_LINKS = 8;
const MAX_GUIDE_LINKS = 6;

/** Regional hub each country page belongs to. */
const regionOf: Record<string, string> = {
  albania: "europe",
  austria: "europe",
  croatia: "europe",
  france: "europe",
  germany: "europe",
  greece: "europe",
  ireland: "europe",
  italy: "europe",
  netherlands: "europe",
  portugal: "europe",
  spain: "europe",
  switzerland: "europe",
  turkey: "europe",
  uk: "europe",
  balkans: "europe",
  usa: "north-america",
  canada: "north-america",
  mexico: "north-america",
  japan: "asia",
  thailand: "asia",
  indonesia: "asia",
  australia: "asia",
  uae: "middle-east"
};

/** Buying guides for a whole region, linked from its hub and every member. */
const regionGuide: Record<string, string> = {
  europe: "/travel/best-esim-europe-travel",
  "north-america": "/travel/best-esim-usa-travel"
};

/** Country-specific buying guides, ahead of the regional one. */
const destinationGuide: Record<string, string> = {
  usa: "/travel/best-esim-usa-travel",
  uk: "/travel/best-esim-uk-travel",
  ireland: "/travel/best-esim-uk-travel"
};

/** Setup guides every destination page links to. */
const setupGuides = [
  "/travel/how-to-install-esim",
  "/travel/esim-compatible-phones",
  "/travel/keep-your-number-with-esim"
];

/**
 * Topic graph between travel guides, plus the destination pages each guide is
 * about (and use cases). Added after the guide's own hand-written relatedLinks.
 */
const guideGraph: Record<string, string[]> = {
  "how-to-install-esim": [
    "/travel/esim-compatible-phones",
    "/travel/activate-esim-before-flying",
    "/travel/esim-not-connecting"
  ],
  "what-is-an-esim": ["/travel/esim-compatible-phones", "/travel/keep-your-number-with-esim"],
  "esim-compatible-phones": [
    "/use-cases/study-abroad",
    "/travel/what-is-an-esim",
    "/travel/activate-esim-before-flying",
    "/travel/esim-not-connecting"
  ],
  "keep-your-number-with-esim": [
    "/travel/esim-compatible-phones",
    "/use-cases/study-abroad",
    "/travel/esim-vs-roaming",
    "/esim/europe"
  ],
  "activate-esim-before-flying": [
    "/travel/esim-compatible-phones",
    "/travel/esim-not-connecting",
    "/use-cases/cruises"
  ],
  "esim-not-connecting": ["/travel/esim-compatible-phones", "/travel/activate-esim-before-flying"],
  "best-esim-europe-travel": [
    "/esim/croatia",
    "/esim/spain",
    "/esim/balkans",
    "/travel/best-esim-uk-travel",
    "/travel/esim-compatible-phones"
  ],
  "best-esim-usa-travel": [
    "/esim/north-america",
    "/esim/canada",
    "/travel/best-esim-europe-travel",
    "/travel/esim-compatible-phones"
  ],
  "best-esim-uk-travel": [
    "/esim/ireland",
    "/travel/best-esim-europe-travel",
    "/travel/keep-your-number-with-esim"
  ],
  "esim-vs-roaming": [
    "/travel/esim-vs-local-sim",
    "/travel/best-esim-europe-travel",
    "/travel/keep-your-number-with-esim"
  ],
  "esim-vs-local-sim": ["/travel/keep-your-number-with-esim", "/travel/best-esim-europe-travel"],
  "internet-abroad": [
    "/travel/travel-data-and-wifi",
    "/travel/how-much-data-when-traveling",
    "/travel/esim-vs-local-sim"
  ],
  "travel-data-and-wifi": [
    "/travel/how-much-data-when-traveling",
    "/travel/internet-abroad",
    "/use-cases/cruises"
  ],
  "how-much-data-when-traveling": [
    "/travel/travel-data-and-wifi",
    "/travel/best-esim-europe-travel",
    "/use-cases/remote-work"
  ]
};

const pageByPath = new Map(publicSeoPages.map((page) => [page.path, page]));

function labelFor(page: SeoContentPage): string {
  if (page.kind === "destination") {
    return `${destinationDisplay[page.slug]?.countryName ?? page.eyebrow} eSIM plans`;
  }
  return page.heading.replace(/\.$/, "");
}

/** Resolves paths to links, dropping unknown paths, `self` and duplicates. */
function toLinks(paths: readonly string[], self: string, max: number, seed: SeoPageLink[] = []) {
  const seen = new Set([self, ...seed.map((link) => link.href)]);
  const links = [...seed];
  for (const path of paths) {
    if (links.length >= max) break;
    const page = pageByPath.get(path);
    if (!page || seen.has(path)) continue;
    seen.add(path);
    links.push({ href: path, label: labelFor(page) });
  }
  return links;
}

/**
 * "Related destinations" for an /esim page: hand-picked neighbours, then the
 * regional hub, then the other countries in the same region. A hub lists its
 * member countries.
 */
export function relatedDestinationLinks(slug: string): SeoPageLink[] {
  const region = regionOf[slug];
  const members = Object.keys(regionOf).filter(
    (member) => regionOf[member] === (region ?? slug) && member !== slug
  );
  const paths = [
    ...(destinationDisplay[slug]?.relatedSlugs ?? []),
    ...(region ? [region] : []),
    ...members
  ].map((related) => `/esim/${related}`);
  // A hub lists all of its members, however many there are.
  const max = region ? MAX_DESTINATION_LINKS : Math.max(MAX_DESTINATION_LINKS, paths.length);
  return toLinks(paths, `/esim/${slug}`, max);
}

/**
 * "Guides" for an /esim page: its own relatedLinks (minus destinations the
 * "Related destinations" block already shows), then buying and setup guides.
 */
export function destinationGuideLinks(page: SeoContentPage): SeoPageLink[] {
  const region = regionOf[page.slug] ?? page.slug;
  const shown = new Set(relatedDestinationLinks(page.slug).map((link) => link.href));
  const paths = [
    destinationGuide[page.slug],
    regionGuide[region],
    ...setupGuides
  ].filter((path): path is string => Boolean(path));
  const own = page.relatedLinks.filter((link) => !shown.has(link.href));
  return toLinks(paths, page.path, MAX_GUIDE_LINKS, own);
}

/** "Related pages" for a /travel or /use-cases page. */
export function relatedGuideLinks(page: SeoContentPage): SeoPageLink[] {
  return toLinks(guideGraph[page.slug] ?? [], page.path, MAX_GUIDE_LINKS, page.relatedLinks);
}
