import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { JsonLd } from "../JsonLd";
import { Navbar } from "../components/Navbar";
import {
  CONTENT_CARD_LINK,
  CONTENT_EYEBROW,
  CONTENT_GUTTER,
  CONTENT_H1,
  CONTENT_TOP
} from "../components/contentClasses";
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
    <main className="min-h-screen overflow-x-clip bg-surfaceBright text-onSurface">
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
      <section className={`pb-16 md:pb-24 ${CONTENT_GUTTER} ${CONTENT_TOP}`}>
        <div className="mx-auto max-w-6xl">
          <h1 className={`max-w-4xl ${CONTENT_H1}`}>Travel eSIM guides</h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-onSurfaceVariant sm:text-lg sm:leading-8">
            Practical articles that link to live destination plans. Start here if you are choosing
            between eSIM, roaming, or a local SIM card.
          </p>
          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {guidePages.map((page) => (
              <Link className={CONTENT_CARD_LINK} href={page.path} key={page.path}>
                <p className={CONTENT_EYEBROW}>{page.eyebrow}</p>
                <h2 className="mt-2 font-display text-headline-md font-black text-brandInk">{page.heading}</h2>
                <p className="mt-2 line-clamp-3 text-body-md text-onSurfaceVariant">{page.description}</p>
                <span className="mt-auto inline-flex items-center gap-2 pt-5 text-sm font-black text-brandBlue">
                  Read guide
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
