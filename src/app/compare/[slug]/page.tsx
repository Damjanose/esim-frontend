import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { JsonLd } from "../../JsonLd";
import { Navbar } from "../../components/Navbar";
import { ContentFaq } from "../../components/ContentFaq";
import {
  CONTENT_GUTTER,
  CONTENT_H1,
  CONTENT_SECTION_H2,
  CONTENT_TEXT_LINK,
  CONTENT_TOP
} from "../../components/contentClasses";
import { SiteFooter } from "../../SiteFooter";
import { comparePages } from "@/content/compare-pages";
import { createContentPageJsonLd, createMetadata } from "@/lib/seo";
import { seoContentUpdatedAt } from "@/lib/esim-routes";
import { getGlobalOffer } from "@/lib/destinationPricing";
import { convertEurToGbp, formatGbp, getGbpRate } from "@/lib/exchangeRate";

export const revalidate = 3600;

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return comparePages.map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = comparePages.find((entry) => entry.slug === slug);
  if (!page) return {};
  return createMetadata({
    path: page.path,
    title: page.title,
    description: page.description
  });
}

export default async function ComparePage({ params }: PageProps) {
  const { slug } = await params;
  const page = comparePages.find((entry) => entry.slug === slug);
  if (!page) notFound();

  const [offer, gbpRate] = await Promise.all([getGlobalOffer(), getGbpRate()]);

  return (
    <main className="min-h-screen overflow-x-clip bg-surface text-onSurface">
      <JsonLd
        data={createContentPageJsonLd({
          path: page.path,
          name: page.heading,
          description: page.description,
          breadcrumbName: page.heading,
          parent: { name: "Compare", path: "/compare" },
          faqs: page.faqs,
          // Editorial comparison, not a product page: no Product/Offer markup here.
          article: { dateModified: seoContentUpdatedAt }
        })}
      />
      <Navbar />
      <article>
        <div className={`rounded-b-[24px] bg-surfaceBright pb-10 lg:pb-14 ${CONTENT_GUTTER} ${CONTENT_TOP}`}>
          <div className="mx-auto max-w-5xl">
            <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-x-2 text-sm font-bold text-onSurfaceVariant">
              <Link className="inline-flex min-h-11 items-center transition hover:text-brandBlue" href="/">
                Home
              </Link>
              <span aria-hidden="true">/</span>
              <Link className="inline-flex min-h-11 items-center transition hover:text-brandBlue" href="/compare">
                Compare
              </Link>
              <span aria-hidden="true">/</span>
              <span aria-current="page" className="text-brandInk">
                {page.heading}
              </span>
            </nav>
            <h1 className={`mt-4 max-w-4xl ${CONTENT_H1}`}>{page.heading}</h1>
            <p className="mt-5 max-w-3xl text-base leading-7 text-onSurfaceVariant sm:text-lg sm:leading-8">
              {page.intro}
            </p>
            {offer ? (
              <p className="mt-5 inline-flex flex-wrap items-center gap-x-1 rounded-full border border-brandBlue/20 bg-brandBlue/5 px-4 py-2 text-sm font-black text-brandBlue">
                eSIM2you plans span €{offer.lowPrice.toFixed(2)}–€{offer.highPrice.toFixed(2)} across
                200+ destinations
                {gbpRate
                  ? ` (~${formatGbp(convertEurToGbp(offer.lowPrice, gbpRate))}–${formatGbp(
                      convertEurToGbp(offer.highPrice, gbpRate)
                    )})`
                  : ""}
              </p>
            ) : null}
          </div>
        </div>

        <div className={`py-10 md:py-16 ${CONTENT_GUTTER}`}>
          <div className="mx-auto max-w-5xl">
            <div className="relative overflow-x-auto rounded-[20px] border border-outline/70 bg-surface shadow-brandCard">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-surfaceBright font-black text-brandInk">
                  <tr>
                    <th className="px-4 py-3" scope="col">
                      Factor
                    </th>
                    <th className="px-4 py-3" scope="col">
                      eSIM2you
                    </th>
                    <th className="px-4 py-3" scope="col">
                      {page.competitor}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {page.rows.map((row) => (
                    <tr className="border-t border-outline/70" key={row.factor}>
                      <th className="px-4 py-3 font-bold text-brandInk" scope="row">
                        {row.factor}
                      </th>
                      <td className="px-4 py-3 text-onSurfaceVariant">{row.esim2you}</td>
                      <td className="px-4 py-3 text-onSurfaceVariant">{row.competitor}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ul className="mt-8 list-disc space-y-2 pl-5 leading-7 text-onSurfaceVariant">
              {page.notes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
            <p className="mt-6">
              <Link className={CONTENT_TEXT_LINK} href="/destinations">
                Browse eSIM2you destinations
                <ArrowRight aria-hidden="true" size={16} />
              </Link>
            </p>
            {page.faqs.length > 0 ? (
              <div className="mt-14">
                <h2 className={CONTENT_SECTION_H2}>FAQ</h2>
                <div className="mt-6">
                  <ContentFaq faqs={page.faqs} />
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </article>
      <SiteFooter />
    </main>
  );
}
