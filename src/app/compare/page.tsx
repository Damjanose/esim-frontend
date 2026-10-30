import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { JsonLd } from "../JsonLd";
import { Navbar } from "../components/Navbar";
import { ContentFaq } from "../components/ContentFaq";
import {
  CONTENT_ASIDE,
  CONTENT_CARD,
  CONTENT_EYEBROW,
  CONTENT_GUTTER,
  CONTENT_H1,
  CONTENT_ROW_LINK,
  CONTENT_SECTION_H2,
  CONTENT_TOP
} from "../components/contentClasses";
import { SiteFooter } from "../SiteFooter";
import { compareHub } from "@/content/compare-hub";
import { comparePages, type ComparePage } from "@/content/compare-pages";
import { comparePriceRow, formatValidityRange } from "@/lib/compare-price-table";
import { getDestinationPlanRows } from "@/lib/destinationPricing";
import { destinationDisplay } from "@/lib/esim-routes";
import { formatEur } from "@/lib/price-index";
import { createContentPageJsonLd, createMetadata, indexableRoutes } from "@/lib/seo";

// Same refresh window as the cached plan catalog the price table is built from.
export const revalidate = 3600;

const route = indexableRoutes.find((entry) => entry.path === "/compare")!;

export const metadata: Metadata = createMetadata({
  path: route.path,
  title: route.title,
  description: route.description
});

/** The provider-table cell for one factor of a /compare/[slug] page. */
function competitorFactor(page: ComparePage, factor: string): string {
  return page.rows.find((row) => row.factor === factor)?.competitor ?? "See comparison";
}

async function priceRows() {
  const rows = await Promise.all(
    compareHub.pricePerGb.destinations.map(async (slug) => {
      // One failed destination drops its row instead of erroring the page.
      const plans = await getDestinationPlanRows(slug).catch(() => []);
      const row = comparePriceRow(plans);
      return row ? { slug, name: destinationDisplay[slug]?.countryName ?? slug, ...row } : null;
    })
  );
  return rows.filter((row) => row !== null);
}

export default async function CompareHubPage() {
  const rows = await priceRows();

  return (
    <main className="min-h-screen overflow-x-clip bg-surfaceBright text-onSurface">
      <JsonLd
        data={createContentPageJsonLd({
          path: "/compare",
          name: compareHub.h1,
          description: route.description,
          breadcrumbName: "Compare",
          faqs: compareHub.faqs
        })}
      />
      <Navbar />
      <section className={`pb-16 md:pb-24 ${CONTENT_GUTTER} ${CONTENT_TOP}`}>
        <div className="mx-auto max-w-6xl">
          <h1 className={`max-w-4xl ${CONTENT_H1}`}>{compareHub.h1}</h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-onSurfaceVariant sm:text-lg sm:leading-8">
            {compareHub.intro}
          </p>

          <h2 className={`mt-14 ${CONTENT_SECTION_H2}`} id="price-per-gb">
            {compareHub.pricePerGb.h2}
          </h2>
          <p className="mt-3 max-w-3xl leading-7 text-onSurfaceVariant">{compareHub.pricePerGb.lead}</p>
          {rows.length > 0 ? (
            // Focusable so keyboard users can scroll the table sideways on phones.
            <div
              aria-label={`${compareHub.pricePerGb.h2} (scrollable)`}
              className="relative mt-5 overflow-x-auto rounded-[20px] border border-outline/70 bg-surface"
              role="region"
              tabIndex={0}
            >
              <table className="w-full min-w-[760px] text-left text-sm">
                <caption className="sr-only">
                  Live eSIM2you cheapest plan, best price per GB, cheapest unlimited plan and validity range by
                  destination, in euros
                </caption>
                <thead>
                  <tr className="border-b border-outline/70 text-label-caps uppercase text-onSurfaceVariant">
                    <th className="px-4 py-3" scope="col">Destination</th>
                    <th className="px-4 py-3" scope="col">Cheapest plan</th>
                    <th className="px-4 py-3" scope="col">Best price per GB</th>
                    <th className="px-4 py-3" scope="col">Unlimited from</th>
                    <th className="px-4 py-3" scope="col">Validity range</th>
                    <th className="px-4 py-3" scope="col">
                      <span className="sr-only">Plans</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr className="border-b border-outline/40 last:border-b-0" key={row.slug}>
                      <th className="px-4 py-3 font-bold text-brandInk" scope="row">
                        {row.name}
                      </th>
                      <td className="px-4 py-3 tabular-nums text-onSurfaceVariant">
                        {row.cheapest.dataLabel} · {row.cheapest.durationLabel} ·{" "}
                        <span className="font-bold text-brandInk">{formatEur(row.cheapest.priceNumeric)}</span>
                      </td>
                      <td className="px-4 py-3 tabular-nums">
                        {row.bestPerGb ? (
                          <>
                            <span className="font-bold text-brandInk">{formatEur(row.bestPerGb.pricePerGb)}/GB</span>{" "}
                            <span className="text-onSurfaceVariant">
                              ({row.bestPerGb.dataLabel} · {row.bestPerGb.durationLabel})
                            </span>
                          </>
                        ) : (
                          <span className="text-onSurfaceVariant">Unlimited plans only</span>
                        )}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-onSurfaceVariant">
                        {row.cheapestUnlimited
                          ? `${formatEur(row.cheapestUnlimited.priceNumeric)} (${row.cheapestUnlimited.durationLabel})`
                          : "n/a"}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-onSurfaceVariant">
                        {row.validityDays ? formatValidityRange(row.validityDays) : "n/a"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          className="inline-flex min-h-11 items-center gap-1 whitespace-nowrap font-bold text-brandBlue hover:text-brandInk"
                          href={`/esim/${row.slug}`}
                        >
                          {row.name} plans
                          <ArrowRight aria-hidden="true" size={16} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mt-5 text-body-md text-onSurfaceVariant">
              Live prices are temporarily unavailable. Check back shortly, or{" "}
              <Link className="font-bold text-brandBlue" href="/destinations">
                browse eSIM2you destinations
              </Link>
              .
            </p>
          )}
          <p className="mt-3 max-w-3xl text-sm text-onSurfaceVariant">
            {compareHub.pricePerGb.footnote} Every destination is in the{" "}
            <Link className="font-bold text-brandBlue" href="/esim-price-index">
              eSIM price index
            </Link>
            .
          </p>

          <h2 className={`mt-14 ${CONTENT_SECTION_H2}`}>{compareHub.howToCompare.h2}</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {compareHub.howToCompare.items.map((item) => (
              <section className={CONTENT_CARD} key={item.title}>
                <h3 className="font-display text-headline-md font-black text-brandInk">{item.title}</h3>
                <p className="mt-2 leading-7 text-onSurfaceVariant">{item.body}</p>
              </section>
            ))}
          </div>

          <h2 className={`mt-14 ${CONTENT_SECTION_H2}`}>{compareHub.providers.h2}</h2>
          <p className="mt-3 max-w-3xl leading-7 text-onSurfaceVariant">{compareHub.providers.lead}</p>
          <div
            aria-label={`${compareHub.providers.h2} (scrollable)`}
            className="relative mt-5 overflow-x-auto rounded-[20px] border border-outline/70 bg-surface"
            role="region"
            tabIndex={0}
          >
            <table className="w-full min-w-[760px] text-left text-sm">
              <caption className="sr-only">Feature comparison of travel eSIM providers with eSIM2you</caption>
              <thead>
                <tr className="border-b border-outline/70 text-label-caps uppercase text-onSurfaceVariant">
                  <th className="px-4 py-3" scope="col">Provider</th>
                  <th className="px-4 py-3" scope="col">How you compare plans</th>
                  <th className="px-4 py-3" scope="col">Checkout</th>
                  <th className="px-4 py-3" scope="col">Install</th>
                  <th className="px-4 py-3" scope="col">Full comparison</th>
                </tr>
              </thead>
              <tbody>
                {comparePages.map((page) => (
                  <tr className="border-b border-outline/40 last:border-b-0" key={page.slug}>
                    <th className="px-4 py-3 font-bold text-brandInk" scope="row">
                      {page.competitor}
                    </th>
                    <td className="px-4 py-3 text-onSurfaceVariant">{competitorFactor(page, "Plan comparison")}</td>
                    <td className="px-4 py-3 text-onSurfaceVariant">{competitorFactor(page, "Checkout")}</td>
                    <td className="px-4 py-3 text-onSurfaceVariant">{competitorFactor(page, "Activation")}</td>
                    <td className="px-4 py-3">
                      <Link
                        className="inline-flex min-h-11 items-center gap-1 whitespace-nowrap font-bold text-brandBlue hover:text-brandInk"
                        href={page.path}
                      >
                        {page.heading}
                        <ArrowRight aria-hidden="true" size={16} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-14 grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
            <div className="min-w-0">
              <p className={CONTENT_EYEBROW}>FAQ</p>
              <h2 className={`mt-2 ${CONTENT_SECTION_H2}`}>Comparing eSIM plans</h2>
              <div className="mt-6">
                <ContentFaq faqs={compareHub.faqs} />
              </div>
            </div>
            <aside className={`h-fit ${CONTENT_ASIDE}`}>
              <h2 className="font-display text-title-sm font-black text-brandInk sm:text-xl">Related pages</h2>
              <div className="mt-4 grid gap-2">
                {compareHub.internalLinks.map((link) => (
                  <Link className={CONTENT_ROW_LINK} href={link.href} key={link.href}>
                    {link.label}
                    <ArrowRight aria-hidden="true" className="shrink-0 text-brandBlue" size={16} />
                  </Link>
                ))}
              </div>
            </aside>
          </div>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
