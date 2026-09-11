import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { JsonLd } from "../JsonLd";
import { Navbar } from "../components/Navbar";
import { SiteFooter } from "../SiteFooter";
import { comparePages } from "@/content/compare-pages";
import { createContentPageJsonLd, createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  path: "/compare",
  title: "Compare Travel eSIMs | eSIM2you",
  description:
    "Factual comparisons of eSIM2you with other travel eSIM providers. Live prices stay on destination pages."
});

export default function CompareHubPage() {
  return (
    <main className="min-h-screen bg-white text-onSurface">
      <JsonLd
        data={createContentPageJsonLd({
          path: "/compare",
          name: "Compare travel eSIMs",
          description:
            "Factual comparisons of eSIM2you with other travel eSIM providers. Live prices stay on destination pages.",
          breadcrumbName: "Compare"
        })}
      />
      <Navbar />
      <section className="px-5 pb-20 pt-28 md:px-8">
        <div className="mx-auto max-w-5xl">
          <h1 className="font-display text-5xl font-black text-brandInk">Compare travel eSIMs</h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-onSurfaceVariant">
            These pages compare product features. They do not claim eSIM2you is cheapest. Check live
            eSIM2you prices on each destination page, and the competitor’s site for their current
            offer.
          </p>
          <div className="mt-12 grid gap-5 md:grid-cols-2">
            {comparePages.map((page) => (
              <Link
                className="rounded-xl border border-outline bg-surface p-6 shadow-sm transition hover:border-brandBlue/50"
                href={page.path}
                key={page.path}
              >
                <h2 className="font-display text-2xl font-black text-brandInk">{page.heading}</h2>
                <p className="mt-3 text-onSurfaceVariant">{page.description}</p>
                <span className="mt-6 inline-flex items-center gap-2 text-sm font-black">
                  Read comparison
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
