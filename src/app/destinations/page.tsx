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
import { SiteFooter } from "../SiteFooter";
import { DestinationPlans } from "./DestinationPlans";

export const metadata: Metadata = createMetadata({
  path: "/destinations",
  title: "Travel eSIM Destinations | Velocity eSIM",
  description:
    "Browse Velocity eSIM destinations for international travel data, mobile internet abroad, and roaming alternatives.",
});

type DestinationsPageProps = {
  searchParams: Promise<{
    country?: string | string[];
  }>;
};

export default async function DestinationsPage({
  searchParams,
}: DestinationsPageProps) {
  const resolvedSearchParams = await searchParams;

  const countryCode = Array.isArray(resolvedSearchParams.country)
    ? resolvedSearchParams.country[0] ?? ""
    : resolvedSearchParams.country ?? "";

  const hasSelectedCountry = countryCode.trim().length > 0;

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#020916] text-white">
      <JsonLd
        data={createContentPageJsonLd({
          path: "/destinations",
          name: "Travel eSIM Destinations",
          description:
            "Browse Velocity eSIM destinations for international travel data, mobile internet abroad, and roaming alternatives.",
          breadcrumbName: "Destinations",
        })}
      />

      {hasSelectedCountry ? (
        <DestinationPlans countryCode={countryCode} />
      ) : (
        <>
          <Navbar />

          <section className="relative isolate overflow-hidden px-5 pb-20 pt-28 md:px-8 md:pb-24">
            <div className="pointer-events-none absolute inset-0 -z-30 bg-[radial-gradient(circle_at_74%_28%,rgba(0,112,255,0.2),transparent_38%),radial-gradient(circle_at_16%_18%,rgba(20,79,170,0.12),transparent_32%),linear-gradient(180deg,#020814_0%,#020916_72%,#030b18_100%)]" />

            <div className="hero-grid pointer-events-none absolute inset-0 -z-20 opacity-[0.08]" />

            <div className="pointer-events-none absolute left-1/2 top-[42%] -z-10 h-[460px] w-[900px] -translate-x-1/2 rounded-full bg-[#0879ff]/10 blur-[150px]" />

            <div className="mx-auto max-w-[1180px]">
              <div className="mx-auto max-w-4xl text-center">
                <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-[#25527e]/60 bg-[#07182a]/80 px-4 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-[#39a9ff] backdrop-blur-xl">
                  <Globe2 aria-hidden="true" size={15} />
                  Travel eSIM destinations
                </div>

                <h1 className="mt-6 font-display text-4xl font-black leading-tight tracking-[-0.04em] sm:text-5xl md:text-6xl lg:text-[68px]">
                  Choose international data
                  <br className="hidden sm:block" />
                  before your trip begins.
                </h1>

                <p className="mx-auto mt-6 max-w-3xl text-base leading-8 text-[#9fafc4] sm:text-lg">
                  Browse Velocity eSIM destination guides, explore regional
                  connectivity options, and find a smarter alternative to
                  expensive roaming.
                </p>

                <Link
                  className="group mt-8 inline-flex h-[52px] items-center justify-center gap-3 rounded-full bg-gradient-to-r from-[#1857ff] to-[#29c9ff] px-7 text-sm font-black text-white shadow-[0_14px_34px_rgba(18,102,255,0.3)] transition hover:-translate-y-0.5"
                  href="/#home"
                >
                  Search eSIM plans
                  <ArrowRight
                    aria-hidden="true"
                    className="transition-transform group-hover:translate-x-1"
                    size={18}
                  />
                </Link>
              </div>
            </div>
          </section>

          <section className="relative px-5 pb-24 md:px-8">
            <div className="pointer-events-none absolute left-1/2 top-24 h-72 w-[70%] -translate-x-1/2 rounded-full bg-[#076cff]/8 blur-[130px]" />

            <div className="relative mx-auto max-w-[1180px]">
              <div className="mb-9 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#39a9ff]">
                    Destination guides
                  </p>

                  <h2 className="mt-3 font-display text-3xl font-black tracking-[-0.03em] sm:text-4xl">
                    Explore before you travel
                  </h2>
                </div>

                <p className="max-w-lg text-sm leading-6 text-[#8da0b7]">
                  Discover regional data information, roaming alternatives, and
                  useful advice for staying connected abroad.
                </p>
              </div>

              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {destinationPages.map((page) => (
                  <Link
                    className="group relative overflow-hidden rounded-[24px] border border-[#1c4265]/80 bg-[linear-gradient(145deg,#081c33,#061427)] p-6 shadow-[0_22px_55px_rgba(0,0,0,0.22)] transition duration-300 hover:-translate-y-1 hover:border-[#168cff]/70"
                    href={page.path}
                    key={page.path}
                  >
                    <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-[#0879ff]/10 blur-[55px]" />

                    <div className="relative">
                      <span className="grid h-12 w-12 place-items-center rounded-[15px] border border-[#23537d] bg-[#0a2949] text-[#46afff]">
                        <MapPin aria-hidden="true" size={22} />
                      </span>

                      <p className="mt-5 text-[10px] font-black uppercase tracking-[0.15em] text-[#3ba9ff]">
                        {page.eyebrow}
                      </p>

                      <h2 className="mt-3 font-display text-2xl font-black">
                        {page.heading}
                      </h2>

                      <p className="mt-3 line-clamp-3 leading-7 text-[#8fa2b8]">
                        {page.description}
                      </p>

                      <span className="mt-7 inline-flex items-center gap-2 text-sm font-black">
                        Read destination guide

                        <ArrowRight
                          aria-hidden="true"
                          className="text-[#3aabff] transition-transform group-hover:translate-x-1"
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
