import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SeoContentPageView } from "../../SeoContentPage";
import { destinationPages } from "@/content/seo-pages";
import { createMetadata } from "@/lib/seo";

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

export default async function DestinationPage({ params }: PageProps) {
  const { slug } = await params;
  const page = destinationPages.find((entry) => entry.slug === slug);

  if (!page) {
    notFound();
  }

  return <SeoContentPageView page={page} parent={{ name: "Destinations", path: "/destinations" }} />;
}
