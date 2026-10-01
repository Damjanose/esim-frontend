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
import { useCasePages } from "@/content/seo-pages";
import { createContentPageJsonLd, createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  path: "/use-cases",
  title: "eSIM Use Cases | eSIM2you",
  description: "How eSIM2you helps with business travel, remote work, cruises, and study abroad data needs."
});

export default function UseCasesHubPage() {
  return (
    <main className="min-h-screen overflow-x-clip bg-surfaceBright text-onSurface">
      <JsonLd
        data={createContentPageJsonLd({
          path: "/use-cases",
          name: "eSIM use cases",
          description: "How eSIM2you helps with business travel, remote work, cruises, and study abroad data needs.",
          breadcrumbName: "Use cases"
        })}
      />
      <Navbar />
      <section className={`pb-16 md:pb-24 ${CONTENT_GUTTER} ${CONTENT_TOP}`}>
        <div className="mx-auto max-w-6xl">
          <h1 className={`max-w-4xl ${CONTENT_H1}`}>eSIM use cases</h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-onSurfaceVariant sm:text-lg sm:leading-8">
            How travelers use eSIM2you for work trips, remote work days, cruise port stops, and study abroad semesters.
          </p>
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {useCasePages.map((page) => (
              <Link className={CONTENT_CARD_LINK} href={page.path} key={page.path}>
                <p className={CONTENT_EYEBROW}>{page.eyebrow}</p>
                <h2 className="mt-2 font-display text-headline-md font-black text-brandInk">{page.heading}</h2>
                <p className="mt-2 text-body-md text-onSurfaceVariant">{page.description}</p>
                <span className="mt-auto inline-flex items-center gap-2 pt-5 text-sm font-black text-brandBlue">
                  Read more
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
