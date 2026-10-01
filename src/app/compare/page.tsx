import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { JsonLd } from "../JsonLd";
import { Navbar } from "../components/Navbar";
import { CONTENT_CARD_LINK, CONTENT_GUTTER, CONTENT_H1, CONTENT_TOP } from "../components/contentClasses";
import { SiteFooter } from "../SiteFooter";
import { comparePages } from "@/content/compare-pages";
import { createContentPageJsonLd, createMetadata } from "@/lib/seo";

export const revalidate = 3600;

export const metadata: Metadata = createMetadata({
  path: "/compare",
  title: "Compare Travel eSIMs | eSIM2you",
  description:
    "Factual comparisons of eSIM2you with other travel eSIM providers. Live prices stay on destination pages."
});

export default function CompareHubPage() {
  return (
    <main className="min-h-screen overflow-x-clip bg-surfaceBright text-onSurface">
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
      <section className={`pb-16 md:pb-24 ${CONTENT_GUTTER} ${CONTENT_TOP}`}>
        <div className="mx-auto max-w-6xl">
          <h1 className={`max-w-4xl ${CONTENT_H1}`}>Compare travel eSIMs</h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-onSurfaceVariant sm:text-lg sm:leading-8">
            These pages compare product features. They do not claim eSIM2you is cheapest. Check live
            eSIM2you prices on each destination page, and the competitor’s site for their current
            offer.
          </p>
          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {comparePages.map((page) => (
              <Link className={CONTENT_CARD_LINK} href={page.path} key={page.path}>
                <h2 className="font-display text-headline-md font-black text-brandInk">{page.heading}</h2>
                <p className="mt-2 text-body-md text-onSurfaceVariant">{page.description}</p>
                <span className="mt-auto inline-flex items-center gap-2 pt-5 text-sm font-black text-brandBlue">
                  Read comparison
                  <ArrowRight
                    aria-hidden="true"
                    className="motion-safe:transition group-hover:translate-x-0.5"
                    size={16}
                  />
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
