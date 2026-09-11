import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { JsonLd } from "../JsonLd";
import { Navbar } from "../components/Navbar";
import { SiteFooter } from "../SiteFooter";
import { guidePages } from "@/content/seo-pages";
import { createContentPageJsonLd, createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  path: "/travel",
  title: "Travel eSIM Guides | eSIM2you",
  description:
    "Guides for installing a travel eSIM, comparing eSIM vs roaming, and staying online abroad."
});

export default function TravelHubPage() {
  return (
    <main className="min-h-screen bg-white text-onSurface">
      <JsonLd
        data={createContentPageJsonLd({
          path: "/travel",
          name: "Travel eSIM guides",
          description:
            "Guides for installing a travel eSIM, comparing eSIM vs roaming, and staying online abroad.",
          breadcrumbName: "Travel"
        })}
      />
      <Navbar />
      <section className="px-5 pb-20 pt-28 md:px-8">
        <div className="mx-auto max-w-5xl">
          <h1 className="font-display text-5xl font-black text-brandInk">Travel eSIM guides</h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-onSurfaceVariant">
            Practical articles that link to live destination plans. Start here if you are choosing
            between eSIM, roaming, or a local SIM card.
          </p>
          <div className="mt-12 grid gap-5 md:grid-cols-2">
            {guidePages.map((page) => (
              <Link
                className="rounded-xl border border-outline bg-surface p-6 shadow-sm transition hover:border-brandBlue/50"
                href={page.path}
                key={page.path}
              >
                <p className="text-xs font-black uppercase text-brandBlue">{page.eyebrow}</p>
                <h2 className="mt-3 font-display text-2xl font-black text-brandInk">{page.heading}</h2>
                <p className="mt-3 line-clamp-3 text-onSurfaceVariant">{page.description}</p>
                <span className="mt-6 inline-flex items-center gap-2 text-sm font-black text-brandInk">
                  Read guide
                  <ArrowRight aria-hidden="true" size={16} />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
