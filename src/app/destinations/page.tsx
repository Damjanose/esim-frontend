import { ArrowRight, MapPin } from "lucide-react";
import type { Metadata } from "next";
import { destinationPages } from "@/content/seo-pages";
import { createContentPageJsonLd, createMetadata } from "@/lib/seo";
import { JsonLd } from "../JsonLd";

export const metadata: Metadata = createMetadata({
  path: "/destinations",
  title: "Travel eSIM Destinations | Velocity eSIM",
  description:
    "Browse Velocity eSIM destinations for international travel data, mobile internet abroad, and roaming alternatives."
});

export default function DestinationsPage() {
  return (
    <main className="min-h-screen bg-white text-ink">
      <JsonLd
        data={createContentPageJsonLd({
          path: "/destinations",
          name: "Travel eSIM Destinations",
          description:
            "Browse Velocity eSIM destinations for international travel data, mobile internet abroad, and roaming alternatives.",
          breadcrumbName: "Destinations"
        })}
      />
      <section className="relative isolate overflow-hidden bg-midnight px-5 pb-16 pt-24 text-white md:px-8 md:pb-24">
        <div className="hero-grid absolute inset-0 opacity-20" />
        <div className="mx-auto max-w-5xl">
          <p className="text-sm font-black uppercase text-cyan">Travel eSIM destinations</p>
          <h1 className="mt-4 max-w-4xl font-display text-5xl font-black leading-tight md:text-7xl">
            Choose international data before your trip begins.
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-white/72">
            Browse the first Velocity eSIM destination guides for travel data, mobile internet
            abroad, and clear roaming alternatives.
          </p>
        </div>
      </section>

      <section className="px-5 py-16 md:px-8 md:py-24">
        <div className="mx-auto grid max-w-6xl gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {destinationPages.map((page) => (
            <a
              className="group rounded-xl border border-line bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-cyan hover:shadow-card"
              href={page.path}
              key={page.path}
            >
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-cyan/14 text-midnight">
                <MapPin aria-hidden="true" size={22} />
              </span>
              <p className="mt-5 text-sm font-black uppercase text-cyan">{page.eyebrow}</p>
              <h2 className="mt-2 font-display text-2xl font-black text-midnight">
                {page.heading}
              </h2>
              <p className="mt-3 line-clamp-3 leading-7 text-slate-600">{page.description}</p>
              <span className="mt-6 inline-flex items-center gap-2 font-bold text-midnight">
                Read destination guide
                <ArrowRight aria-hidden="true" className="text-cyan transition group-hover:translate-x-1" size={18} />
              </span>
            </a>
          ))}
        </div>
      </section>
    </main>
  );
}
