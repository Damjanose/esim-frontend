import type { Metadata } from "next";
import { createMetadata, createWebPageJsonLd } from "@/lib/seo";
import { JsonLd } from "../JsonLd";
import { Navbar } from "../components/Navbar";
import { CONTENT_EYEBROW, CONTENT_GUTTER, CONTENT_H1, CONTENT_TOP } from "../components/contentClasses";
import { SiteFooter } from "../SiteFooter";
import { FlightSearchForm } from "./FlightSearchForm";

const TITLE = "Flight Search: Compare Recent Fares";
const DESCRIPTION =
  "Search one-way and round-trip flights by country and airport. See fares other travellers found recently, then book on the partner site.";

export const metadata: Metadata = createMetadata({ path: "/flights", title: TITLE, description: DESCRIPTION });

export const revalidate = 3600;

/** Public flight search. Static shell; the form loads countries and fares through /bff/flights/*. */
export default function FlightsPage() {
  return (
    <main className="min-h-screen overflow-x-clip bg-surface text-onSurface">
      <JsonLd
        data={createWebPageJsonLd({
          path: "/flights",
          name: "Flight search",
          description: DESCRIPTION,
          breadcrumbName: "Flight search"
        })}
      />
      <Navbar />

      <section className={`${CONTENT_TOP} ${CONTENT_GUTTER} pb-16 lg:pb-24`}>
        <div className="mx-auto max-w-4xl">
          <p className={CONTENT_EYEBROW}>Flight search</p>
          <h1 className={`mt-3 ${CONTENT_H1}`}>Find a flight for your trip</h1>
          <p className="mt-4 max-w-[56ch] text-body-md text-onSurfaceVariant sm:text-base">
            Pick where you&apos;re flying from and to. We show fares other travellers found recently and send you to
            our partner to book. Then grab a travel eSIM so you land connected.
          </p>
          <div className="mt-8">
            <FlightSearchForm />
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
