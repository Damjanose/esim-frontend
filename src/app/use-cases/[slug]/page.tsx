import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SeoContentPageView } from "../../SeoContentPage";
import { useCasePages } from "@/content/seo-pages";
import { createMetadata } from "@/lib/seo";

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export function generateStaticParams() {
  return useCasePages.map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = useCasePages.find((entry) => entry.slug === slug);

  if (!page) {
    return {};
  }

  return createMetadata({
    path: page.path,
    title: page.title,
    description: page.description
  });
}

export default async function UseCasePage({ params }: PageProps) {
  const { slug } = await params;
  const page = useCasePages.find((entry) => entry.slug === slug);

  if (!page) {
    notFound();
  }

  return <SeoContentPageView page={page} parent={{ name: "Use cases", path: "/" }} />;
}
