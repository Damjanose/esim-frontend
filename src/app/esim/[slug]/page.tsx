import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EsimDestinationPageView } from "../../EsimDestinationPage";
import { catalogDestinations } from "@/content/catalog-destinations";
import { catalogDestinationSlugs, destinationPages, type SeoContentPage } from "@/content/seo-pages";
import { createMetadata } from "@/lib/seo";
import {
  getDestinationCoverage,
  getDestinationFlag,
  getDestinationOffer,
  getDestinationPlanRows
} from "@/lib/destinationPricing";
import { getDestinationMedia } from "@/lib/destinationMedia";
import { destinationPlace } from "@/lib/destination-answer";
import { destinationPlanFaqs, type RegionalPlanMatch } from "@/lib/destination-plan-faqs";
import { destinationDisplay } from "@/lib/esim-routes";
import { regionalHubOf } from "@/lib/internal-links";
import { getDisplayRates } from "@/lib/exchangeRate";
import { citySectionsFor, cityTitleOverrides, fillCityTokens } from "@/content/city-sections";

export const revalidate = 3600;

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

// Only hand-written pages prerender at build. The generated catalog pages
// render on first request and then ISR-cache: a backend photo lookup for a
// country it hasn't cached takes seconds, and 182 of them at once pushed
// pages past Next's 60s prerender limit and failed the build.
export function generateStaticParams() {
  return destinationPages
    .filter((page) => !catalogDestinationSlugs.has(page.slug))
    .map((page) => ({ slug: page.slug }));
}

/**
 * Price-led meta description from the live lowest price; the static copy is
 * the fallback while the catalog is unavailable.
 */
async function destinationDescription(page: SeoContentPage): Promise<string> {
  const offer = await getDestinationOffer(page.slug);
  if (!offer) return page.description;
  const place = destinationPlace(destinationDisplay[page.slug]?.countryName ?? page.eyebrow);
  return `Buy a prepaid travel eSIM for ${place}. Data plans from €${offer.lowPrice.toFixed(2)}, instant QR install, no roaming fees.`;
}

/** The hub's regional plans, when every one of them also covers this country. */
async function regionalPlanMatch(slug: string): Promise<RegionalPlanMatch | undefined> {
  const hub = regionalHubOf(slug);
  const entry = catalogDestinations.find((candidate) => candidate.slug === slug);
  if (!hub || !entry) return undefined;
  const [coverage, offer] = await Promise.all([getDestinationCoverage(hub), getDestinationOffer(hub)]);
  if (!offer || !coverage.includes(entry.catalogName ?? entry.name)) return undefined;
  return { hubName: destinationDisplay[hub]?.countryName ?? hub, lowPrice: offer.lowPrice, countryCount: coverage.length };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = destinationPages.find((entry) => entry.slug === slug);

  if (!page) {
    return {};
  }

  const cityTitle = cityTitleOverrides[page.slug];
  const title = cityTitle ? fillCityTokens(cityTitle, (await getDestinationOffer(page.slug))?.lowPrice) : page.title;

  return createMetadata({
    path: page.path,
    title,
    description: await destinationDescription(page)
  });
}

export default async function EsimDestinationPage({ params }: PageProps) {
  const { slug } = await params;
  const page = destinationPages.find((entry) => entry.slug === slug);

  if (!page) {
    notFound();
  }

  const countryName = destinationDisplay[page.slug]?.countryName ?? page.eyebrow;
  const isCatalogPage = catalogDestinationSlugs.has(page.slug);
  const [offer, plans, coverage, rates, flagUri, media, description, regional] = await Promise.all([
    getDestinationOffer(page.slug),
    getDestinationPlanRows(page.slug),
    getDestinationCoverage(page.slug),
    getDisplayRates(),
    getDestinationFlag(page.slug),
    getDestinationMedia(page.slug, countryName),
    destinationDescription(page),
    isCatalogPage ? regionalPlanMatch(page.slug) : Promise.resolve(undefined)
  ]);
  // Generated pages lead their FAQ with answers built from the live plans.
  const planFaqs = isCatalogPage ? destinationPlanFaqs({ countryName, plans, regional }) : [];

  // Regional pages (coverage set) keep the generic photo: the backend resolves
  // e.g. "europe" to a single capital, which misrepresents the region.
  const heroImage = coverage.length === 0 ? (media ?? undefined) : undefined;

  return (
    <EsimDestinationPageView
      offer={offer ?? undefined}
      page={{ ...page, description, faqs: [...planFaqs, ...page.faqs] }}
      plans={plans}
      citySections={citySectionsFor(page.slug, offer?.lowPrice)}
      coverage={coverage}
      rates={rates}
      flagUri={flagUri ?? undefined}
      heroImage={heroImage}
    />
  );
}
