import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Download } from "lucide-react";
import { JsonLd } from "../JsonLd";
import { Navbar } from "../components/Navbar";
import {
  CONTENT_CARD,
  CONTENT_EYEBROW,
  CONTENT_GUTTER,
  CONTENT_H1,
  CONTENT_SECTION_H2,
  CONTENT_TEXT_LINK,
  CONTENT_TOP
} from "../components/contentClasses";
import { SiteFooter } from "../SiteFooter";
import { CopyField } from "../account/[orderId]/CopyField";
import { getPriceIndex } from "@/lib/destinationPricing";
import { formatEur, summarizePriceIndex } from "@/lib/price-index";
import {
  absoluteUrl,
  createMetadata,
  createPriceIndexDatasetJsonLd,
  createWebPageJsonLd,
  indexableRoutes
} from "@/lib/seo";

// Same refresh window as the cached plan catalog the table is built from.
export const revalidate = 3600;

const route = indexableRoutes.find((entry) => entry.path === "/esim-price-index")!;

export const metadata: Metadata = createMetadata({
  path: route.path,
  title: route.title,
  description: route.description
});

const pageUrl = absoluteUrl("/esim-price-index");
const citationSnippet = `<a href="${pageUrl}">eSIM2you Travel eSIM Price Index</a>`;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}

export default async function PriceIndexPage() {
  const { rows, updatedAt } = await getPriceIndex();
  const summary = summarizePriceIndex(rows);
  const updatedLabel = formatDate(updatedAt);

  const webPage = createWebPageJsonLd({
    path: "/esim-price-index",
    name: "Travel eSIM Price Index",
    description: route.description,
    breadcrumbName: "eSIM price index"
  });
  const jsonLd =
    rows.length > 0
      ? {
          ...webPage,
          "@graph": [
            ...webPage["@graph"],
            createPriceIndexDatasetJsonLd({
              description: route.description,
              dateModified: updatedAt
            })
          ]
        }
      : webPage;

  const findings = [
    summary.cheapestPerGb?.bestPerGb
      ? {
          label: "Cheapest data per GB",
          value: `${formatEur(summary.cheapestPerGb.bestPerGb.pricePerGb)}/GB`,
          detail: `${summary.cheapestPerGb.name}, on the ${summary.cheapestPerGb.bestPerGb.dataLabel} plan`
        }
      : null,
    summary.medianPerGb !== null
      ? {
          label: "Median best price per GB",
          value: `${formatEur(summary.medianPerGb)}/GB`,
          detail: `Across ${summary.destinationCount} destinations`
        }
      : null,
    summary.priciestPerGb?.bestPerGb
      ? {
          label: "Most expensive data per GB",
          value: `${formatEur(summary.priciestPerGb.bestPerGb.pricePerGb)}/GB`,
          detail: `${summary.priciestPerGb.name}, on the ${summary.priciestPerGb.bestPerGb.dataLabel} plan`
        }
      : null
  ].filter((finding) => finding !== null);

  return (
    <main className="min-h-screen overflow-x-clip bg-surfaceBright text-onSurface">
      <JsonLd data={jsonLd} />
      <Navbar />
      <section className={`pb-16 md:pb-24 ${CONTENT_GUTTER} ${CONTENT_TOP}`}>
        <div className="mx-auto max-w-5xl">
          <p className={CONTENT_EYEBROW}>Data</p>
          <h1 className={`mt-3 max-w-4xl ${CONTENT_H1}`}>Travel eSIM Price Index</h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-onSurfaceVariant sm:text-lg sm:leading-8">
            What a prepaid travel eSIM costs in {rows.length > 0 ? `${rows.length} destinations` : "each destination"}:
            the starting price and the lowest price per GB of mobile data, taken from live eSIM2you plans. Updated{" "}
            <time dateTime={updatedAt}>{updatedLabel}</time>.
          </p>

          {findings.length > 0 ? (
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {findings.map((finding) => (
                <section className={CONTENT_CARD} key={finding.label}>
                  <h2 className="text-label-caps uppercase text-onSurfaceVariant">{finding.label}</h2>
                  <p className="mt-2 font-display text-headline-md font-black text-brandInk">{finding.value}</p>
                  <p className="mt-1 text-body-md text-onSurfaceVariant">{finding.detail}</p>
                </section>
              ))}
            </div>
          ) : null}

          <h2 className={`mt-14 ${CONTENT_SECTION_H2}`}>eSIM prices by destination</h2>
          {rows.length > 0 ? (
            <div className="mt-5 overflow-x-auto rounded-[20px] border border-outline/70 bg-surface">
              <table className="w-full min-w-[640px] text-left text-sm">
                <caption className="sr-only">
                  Travel eSIM starting price and lowest price per GB by destination, in euros
                </caption>
                <thead>
                  <tr className="border-b border-outline/70 text-label-caps uppercase text-onSurfaceVariant">
                    <th className="px-4 py-3" scope="col">Destination</th>
                    <th className="px-4 py-3 text-right" scope="col">From</th>
                    <th className="px-4 py-3 text-right" scope="col">Best price per GB</th>
                    <th className="px-4 py-3" scope="col">Best-value plan</th>
                    <th className="px-4 py-3 text-right" scope="col">Plans</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr className="border-b border-outline/40 last:border-b-0" key={row.slug}>
                      <th className="px-4 py-3 font-bold" scope="row">
                        <Link className="text-brandBlue hover:text-brandInk" href={row.path}>
                          {row.name} eSIM
                        </Link>
                      </th>
                      <td className="px-4 py-3 text-right tabular-nums">{formatEur(row.fromPrice)}</td>
                      <td className="px-4 py-3 text-right font-bold tabular-nums text-brandInk">
                        {row.bestPerGb ? `${formatEur(row.bestPerGb.pricePerGb)}/GB` : "n/a"}
                      </td>
                      <td className="px-4 py-3 text-onSurfaceVariant">
                        {row.bestPerGb
                          ? `${row.bestPerGb.dataLabel}, ${row.bestPerGb.durationLabel}, ${formatEur(row.bestPerGb.priceNumeric)}`
                          : "Unlimited plans only"}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">{row.planCount}</td>
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

          <div className="mt-14 grid gap-4 md:grid-cols-2">
            <section className={CONTENT_CARD}>
              <h2 className="font-display text-headline-md font-black text-brandInk">How we calculate it</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-body-md text-onSurfaceVariant">
                <li>Prices are the current eSIM2you price in euros, including any discount running right now.</li>
                <li>&quot;From&quot; is the cheapest plan for that destination, whatever its size.</li>
                <li>
                  &quot;Best price per GB&quot; divides each plan&apos;s price by its data allowance and keeps the lowest.
                  Unlimited plans have no fixed allowance, so they are left out of that figure.
                </li>
                <li>Regional plans (Europe, Asia, Africa and others) are listed as one row per region.</li>
                <li>The table refreshes from our live catalog about once an hour.</li>
              </ul>
            </section>

            <section className={CONTENT_CARD}>
              <h2 className="font-display text-headline-md font-black text-brandInk">Use this data</h2>
              <p className="mt-3 text-body-md text-onSurfaceVariant">
                Journalists, bloggers and researchers can quote or republish these figures under{" "}
                <a
                  className="font-bold text-brandBlue"
                  href="https://creativecommons.org/licenses/by/4.0/"
                  rel="license noopener noreferrer"
                  target="_blank"
                >
                  CC BY 4.0
                </a>
                . Please credit eSIM2you with a link to this page.
              </p>
              <div className="mt-4">
                <CopyField label="Citation link (HTML)" value={citationSnippet} />
              </div>
              {rows.length > 0 ? (
                <a className={`mt-3 ${CONTENT_TEXT_LINK}`} download href="/esim-price-index.csv">
                  <Download aria-hidden="true" size={16} />
                  Download the data (CSV)
                </a>
              ) : null}
            </section>
          </div>

          <p className="mt-14 text-body-md text-onSurfaceVariant">
            Writing about travel connectivity? See the{" "}
            <Link className="font-bold text-brandBlue" href="/press">
              eSIM2you press kit
            </Link>{" "}
            or learn{" "}
            <Link className="font-bold text-brandBlue" href="/travel/how-much-data-when-traveling">
              how much travel data you need
            </Link>
            .
          </p>
          <Link className={`mt-3 ${CONTENT_TEXT_LINK}`} href="/destinations">
            Browse all eSIM2you destinations
            <ArrowRight aria-hidden="true" size={16} />
          </Link>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
