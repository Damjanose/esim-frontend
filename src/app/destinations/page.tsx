import { ArrowRight, Globe2, MapPin } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { destinationPages } from "@/content/seo-pages";
import {
  createContentPageJsonLd,
  createMetadata,
} from "@/lib/seo";

import { JsonLd } from "../JsonLd";
import { Navbar } from "../components/Navbar";
import { LinkButton } from "../components/Button";
import { SiteFooter } from "../SiteFooter";
import { DestinationPlans } from "./DestinationPlans";
import { DestinationBrowse } from "./DestinationBrowse";

export const metadata: Metadata = createMetadata({
  path: "/destinations",
  title: "Travel eSIM Destinations | eSim2you",
  description:
    "Browse eSim2you destinations for international travel data, mobile internet abroad, and roaming alternatives.",
});

type DestinationsPageProps = {
  searchParams: Promise<{
    country?: string | string[];
    daysMin?: string | string[];
    daysMax?: string | string[];
    dataMin?: string | string[];
    dataMax?: string | string[];
    unlimited?: string | string[];
  }>;
};

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function DestinationsPage({
  searchParams,
}: DestinationsPageProps) {
  const resolvedSearchParams = await searchParams;

  const countryCode = firstValue(resolvedSearchParams.country) ?? "";

  const hasSelectedCountry = countryCode.trim().length > 0;

  const wizardFilterParams = {
    daysMin: firstValue(resolvedSearchParams.daysMin),
    daysMax: firstValue(resolvedSearchParams.daysMax),
    dataMin: firstValue(resolvedSearchParams.dataMin),
    dataMax: firstValue(resolvedSearchParams.dataMax),
    unlimited: firstValue(resolvedSearchParams.unlimited),
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-surface text-onSurface">
      <JsonLd
        data={createContentPageJsonLd({
          path: "/destinations",
          name: "Travel eSIM Destinations",
          description:
            "Browse eSim2you destinations for international travel data, mobile internet abroad, and roaming alternatives.",
          breadcrumbName: "Destinations",
        })}
      />

      {hasSelectedCountry ? (
        <DestinationPlans countryCode={countryCode} />
      ) : (
        <>
          <Navbar />

          <section className="relative isolate overflow-hidden px-5 pb-20 pt-28 md:px-8 md:pb-24">
            <div className="pointer-events-none absolute inset-0 -z-30 bg-[radial-gradient(circle_at_74%_28%,rgba(11,73,183,0.09),transparent_38%),radial-gradient(circle_at_16%_18%,rgba(11,73,183,0.045),transparent_32%)]" />

            <div className="hero-grid pointer-events-none absolute inset-0 -z-20 opacity-[0.05]" />

            <div className="pointer-events-none absolute left-1/2 top-[42%] -z-10 h-[460px] w-[900px] -translate-x-1/2 rounded-full bg-brandBlue/8 blur-[150px]" />

            <div className="mx-auto max-w-[1180px]">
              <div className="mx-auto max-w-4xl text-center">
                <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-outline bg-surface px-4 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-brandBlue shadow-brandCard">
                  <Globe2 aria-hidden="true" size={15} />
                  Travel eSIM destinations
                </div>

                <h1 className="mt-6 font-display text-4xl font-black leading-tight tracking-[-0.04em] text-brandInk sm:text-5xl md:text-6xl lg:text-[68px]">
                  Choose international data
                  <br className="hidden sm:block" />
                  before your trip begins.
                </h1>

                <p className="mx-auto mt-6 max-w-3xl text-base leading-8 text-onSurfaceVariant sm:text-lg">
                  Browse eSim2you destination guides, explore regional
                  connectivity options, and find a smarter alternative to
                  expensive roaming.
                </p>

                <LinkButton className="group mt-8" href="/#home" size="lg">
                  Search eSIM plans
                  <ArrowRight
                    aria-hidden="true"
                    className="transition-transform group-hover:translate-x-1"
                    size={18}
                  />
                </LinkButton>
              </div>
            </div>
          </section>

          <DestinationBrowse urlFilters={wizardFilterParams} />

          <section className="relative px-5 pb-24 md:px-8">
            <div className="pointer-events-none absolute left-1/2 top-24 h-72 w-[70%] -translate-x-1/2 rounded-full bg-brandBlue/6 blur-[130px]" />

            <div className="relative mx-auto max-w-[1180px]">
              <div className="mb-9 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-brandBlue">
                    Destination guides
                  </p>

                  <h2 className="mt-3 font-display text-3xl font-black tracking-[-0.03em] text-brandInk sm:text-4xl">
                    Explore before you travel
                  </h2>
                </div>

                <p className="max-w-lg text-sm leading-6 text-onSurfaceVariant">
                  Discover regional data information, roaming alternatives, and
                  useful advice for staying connected abroad.
                </p>
              </div>

              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {destinationPages.map((page) => (
                  <Link
                    className="group relative overflow-hidden rounded-[24px] border border-outline bg-surface p-6 shadow-brandCard transition duration-300 hover:-translate-y-1 hover:border-brandBlue/50"
                    href={page.path}
                    key={page.path}
                  >
                    <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-brandBlue/8 blur-[55px]" />

                    <div className="relative">
                      <span className="grid h-12 w-12 place-items-center rounded-[15px] border border-brandBlue/20 bg-brandBlue/8 text-brandBlue">
                        <MapPin aria-hidden="true" size={22} />
                      </span>

                      <p className="mt-5 text-[10px] font-black uppercase tracking-[0.15em] text-brandBlue">
                        {page.eyebrow}
                      </p>

                      <h2 className="mt-3 font-display text-2xl font-black text-brandInk">
                        {page.heading}
                      </h2>

                      <p className="mt-3 line-clamp-3 leading-7 text-onSurfaceVariant">
                        {page.description}
                      </p>

                      <span className="mt-7 inline-flex items-center gap-2 text-sm font-black text-brandInk">
                        Read destination guide

                        <ArrowRight
                          aria-hidden="true"
                          className="text-brandBlue transition-transform group-hover:translate-x-1"
                          size={18}
                        />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>

          <SiteFooter />
        </>
      )}
    </main>
  );
}
