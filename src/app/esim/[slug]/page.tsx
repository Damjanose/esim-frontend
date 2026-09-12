import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EsimDestinationPageView } from "../../EsimDestinationPage";
import { destinationPages } from "@/content/seo-pages";
import { createMetadata } from "@/lib/seo";
import { getDestinationOffer, getDestinationPlanRows } from "@/lib/destinationPricing";
import { getGbpRate } from "@/lib/exchangeRate";

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

  const [offer, plans, gbpRate] = await Promise.all([
    getDestinationOffer(page.slug),
    getDestinationPlanRows(page.slug),
    page.slug === "uk" ? getGbpRate() : Promise.resolve(null)
  ]);

  return (
    <EsimDestinationPageView
      offer={offer ?? undefined}
      page={page}
      plans={plans}
      gbpRate={gbpRate ?? undefined}
    />
  );
}
