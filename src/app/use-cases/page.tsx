import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { JsonLd } from "../JsonLd";
import { Navbar } from "../components/Navbar";
import { SiteFooter } from "../SiteFooter";
import { useCasePages } from "@/content/seo-pages";
import { createContentPageJsonLd, createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  path: "/use-cases",
  title: "eSIM Use Cases | eSIM2you",
  description: "How eSIM2you helps with business travel and remote work data abroad."
});

export default function UseCasesHubPage() {
  return (
    <main className="min-h-screen bg-white text-onSurface">
      <JsonLd
        data={createContentPageJsonLd({
          path: "/use-cases",
          name: "eSIM use cases",
          description: "How eSIM2you helps with business travel and remote work data abroad.",
          breadcrumbName: "Use cases"
        })}
      />
      <Navbar />
      <section className="px-5 pb-20 pt-28 md:px-8">
        <div className="mx-auto max-w-5xl">
          <h1 className="font-display text-5xl font-black text-brandInk">eSIM use cases</h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-onSurfaceVariant">
            How travelers use eSIM2you for work trips and remote work days abroad.
          </p>
          <div className="mt-12 grid gap-5 md:grid-cols-2">
            {useCasePages.map((page) => (
              <Link
                className="rounded-xl border border-outline bg-surface p-6 shadow-sm transition hover:border-brandBlue/50"
                href={page.path}
                key={page.path}
              >
                <p className="text-xs font-black uppercase text-brandBlue">{page.eyebrow}</p>
                <h2 className="mt-3 font-display text-2xl font-black text-brandInk">{page.heading}</h2>
                <p className="mt-3 text-onSurfaceVariant">{page.description}</p>
                <span className="mt-6 inline-flex items-center gap-2 text-sm font-black">
                  Read more
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
