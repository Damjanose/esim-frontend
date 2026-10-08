import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EsimDestinationPageView } from "../../EsimDestinationPage";
import { destinationPages } from "@/content/seo-pages";
import { createMetadata } from "@/lib/seo";
import {
  getDestinationCoverage,
  getDestinationFlag,
  getDestinationOffer,
  getDestinationPlanRows
} from "@/lib/destinationPricing";
import { getDestinationMedia } from "@/lib/destinationMedia";
import { destinationDisplay } from "@/lib/esim-routes";
import { getDisplayRates } from "@/lib/exchangeRate";

export const revalidate = 3600;

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export function generateStaticParams() {
  return destinationPages.map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = destinationPages.find((entry) => entry.slug === slug);

  if (!page) {
    return {};
  }

  return createMetadata({
    path: page.path,
    title: page.title,
    description: page.description
  });
}

export default async function EsimDestinationPage({ params }: PageProps) {
  const { slug } = await params;
  const page = destinationPages.find((entry) => entry.slug === slug);

  if (!page) {
    notFound();
  }

  const countryName = destinationDisplay[page.slug]?.countryName ?? page.eyebrow;
  const [offer, plans, coverage, rates, flagUri, media] = await Promise.all([
    getDestinationOffer(page.slug),
    getDestinationPlanRows(page.slug),
    getDestinationCoverage(page.slug),
    getDisplayRates(),
    getDestinationFlag(page.slug),
    getDestinationMedia(page.slug, countryName)
  ]);

  // Regional pages (coverage set) keep the generic photo: the backend resolves
  // e.g. "europe" to a single capital, which misrepresents the region.
  const heroImage = coverage.length === 0 ? (media ?? undefined) : undefined;

  return (
    <EsimDestinationPageView
      offer={offer ?? undefined}
      page={page}
      plans={plans}
      coverage={coverage}
      rates={rates}
      flagUri={flagUri ?? undefined}
      heroImage={heroImage}
    />
  );
}
