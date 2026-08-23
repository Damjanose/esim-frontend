import { ArrowRight, CheckCircle2, CircleHelp } from "lucide-react";
import { JsonLd } from "./JsonLd";
import { Navbar } from "./components/Navbar";
import { SiteFooter } from "./SiteFooter";
import { landingContent } from "@/content/landing";
import type { SeoContentPage } from "@/content/seo-pages";
import { createContentPageJsonLd } from "@/lib/seo";

export function SeoContentPageView({
  page,
  parent
}: {
  page: SeoContentPage;
  parent: {
    name: string;
    path: string;
  };
}) {
  return (
    <main className="min-h-screen bg-white text-onSurface">
      <JsonLd
        data={createContentPageJsonLd({
          path: page.path,
          name: page.heading,
          description: page.description,
          breadcrumbName: page.heading,
          parent,
          faqs: page.faqs
        })}
      />
      <Navbar />

      <article>
        <section className="relative isolate overflow-hidden bg-surface px-5 pb-16 pt-24 text-onSurface md:px-8 md:pb-24">
          <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[420px] w-[900px] -translate-x-1/2 rounded-full bg-brandBlue/8 blur-[140px]" />
          <div className="mx-auto max-w-5xl">
            <a
              className="inline-flex items-center gap-2 text-sm font-bold text-brandBlue transition hover:text-brandTeal"
              href={parent.path}
            >
              <ArrowRight aria-hidden="true" className="rotate-180" size={16} />
              {parent.name}
            </a>
            <p className="mt-10 text-sm font-black uppercase text-brandBlue">{page.eyebrow}</p>
            <h1 className="mt-4 max-w-4xl font-display text-5xl font-black leading-tight text-brandInk md:text-7xl">
              {page.heading}
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-onSurfaceVariant">{page.intro}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                aria-label="Download eSim2you on the App Store"
                className="inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-lg border border-outline bg-surface px-5 font-bold text-brandInk shadow-brandCard transition hover:-translate-y-0.5 hover:border-brandBlue/50"
                href={landingContent.appLinks.ios.href}
              >
                {landingContent.appLinks.ios.label}
                <ArrowRight aria-hidden="true" size={18} />
              </a>
              <a
                aria-label="Download eSim2you on Google Play"
                className="inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-brandBlue to-brandTeal px-5 font-bold text-white transition hover:-translate-y-0.5 hover:opacity-90"
                href={landingContent.appLinks.android.href}
              >
                {landingContent.appLinks.android.label}
                <ArrowRight aria-hidden="true" size={18} />
              </a>
            </div>
          </div>
        </section>

        <section className="px-5 py-16 md:px-8 md:py-24">
          <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1fr_320px]">
            <div className="space-y-5">
              {page.sections.map((section) => (
                <section className="rounded-xl border border-outline bg-white p-7 shadow-sm" key={section.title}>
                  <div className="flex gap-4">
                    <span className="mt-1 grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-brandBlue/10 text-brandInk">
                      <CheckCircle2 aria-hidden="true" size={20} />
                    </span>
                    <div>
                      <h2 className="font-display text-2xl font-black text-brandInk">
                        {section.title}
                      </h2>
                      <p className="mt-3 leading-7 text-onSurfaceVariant">{section.body}</p>
                    </div>
                  </div>
                </section>
              ))}
            </div>

            <aside className="h-fit rounded-xl border border-outline bg-mist p-6">
              <h2 className="font-display text-xl font-black text-brandInk">Related pages</h2>
              <div className="mt-5 grid gap-3">
                {page.relatedLinks.map((link) => (
                  <a
                    className="flex items-center justify-between gap-3 rounded-lg border border-outline bg-white px-4 py-3 text-sm font-bold text-brandInk transition hover:border-brandBlue/50 hover:text-brandInk"
                    href={link.href}
                    key={link.href}
                  >
                    {link.label}
                    <ArrowRight aria-hidden="true" className="shrink-0 text-brandBlue" size={16} />
                  </a>
                ))}
              </div>
            </aside>
          </div>
        </section>

        <section className="bg-mist px-5 py-16 md:px-8 md:py-24">
          <div className="mx-auto max-w-3xl">
            <p className="text-center text-sm font-black uppercase text-brandBlue">FAQ</p>
            <h2 className="mt-3 text-center font-display text-4xl font-black text-brandInk">
              Quick answers before you travel.
            </h2>
            <div className="mt-10 space-y-4">
              {page.faqs.map((faq) => (
                <details className="group rounded-xl border border-outline bg-white p-5 shadow-sm" key={faq.question}>
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display font-black text-brandInk">
                    {faq.question}
                    <CircleHelp aria-hidden="true" className="shrink-0 text-brandBlue transition group-open:rotate-45" size={20} />
                  </summary>
                  <p className="mt-4 leading-7 text-onSurfaceVariant">{faq.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </article>
      <SiteFooter />
    </main>
  );
}
