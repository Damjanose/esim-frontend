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
    <main className="min-h-screen bg-white text-ink">
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
        <section className="relative isolate overflow-hidden bg-midnight px-5 pb-16 pt-24 text-white md:px-8 md:pb-24">
          <div className="hero-grid absolute inset-0 opacity-20" />
          <div className="mx-auto max-w-5xl">
            <a
              className="inline-flex items-center gap-2 text-sm font-bold text-cyan transition hover:text-aqua"
              href={parent.path}
            >
              <ArrowRight aria-hidden="true" className="rotate-180" size={16} />
              {parent.name}
            </a>
            <p className="mt-10 text-sm font-black uppercase text-cyan">{page.eyebrow}</p>
            <h1 className="mt-4 max-w-4xl font-display text-5xl font-black leading-tight md:text-7xl">
              {page.heading}
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-white/72">{page.intro}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                aria-label="Download Velocity eSIM on the App Store"
                className="inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-lg border border-white/20 bg-white px-5 font-bold text-midnight transition hover:-translate-y-0.5 hover:border-cyan"
                href={landingContent.appLinks.ios.href}
              >
                {landingContent.appLinks.ios.label}
                <ArrowRight aria-hidden="true" size={18} />
              </a>
              <a
                aria-label="Download Velocity eSIM on Google Play"
                className="inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-lg bg-cyan px-5 font-bold text-midnight transition hover:-translate-y-0.5 hover:bg-aqua"
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
                <section className="rounded-xl border border-line bg-white p-7 shadow-sm" key={section.title}>
                  <div className="flex gap-4">
                    <span className="mt-1 grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-cyan/14 text-midnight">
                      <CheckCircle2 aria-hidden="true" size={20} />
                    </span>
                    <div>
                      <h2 className="font-display text-2xl font-black text-midnight">
                        {section.title}
                      </h2>
                      <p className="mt-3 leading-7 text-slate-600">{section.body}</p>
                    </div>
                  </div>
                </section>
              ))}
            </div>

            <aside className="h-fit rounded-xl border border-line bg-cloud p-6">
              <h2 className="font-display text-xl font-black text-midnight">Related pages</h2>
              <div className="mt-5 grid gap-3">
                {page.relatedLinks.map((link) => (
                  <a
                    className="flex items-center justify-between gap-3 rounded-lg border border-line bg-white px-4 py-3 text-sm font-bold text-midnight transition hover:border-cyan hover:text-ink"
                    href={link.href}
                    key={link.href}
                  >
                    {link.label}
                    <ArrowRight aria-hidden="true" className="shrink-0 text-cyan" size={16} />
                  </a>
                ))}
              </div>
            </aside>
          </div>
        </section>

        <section className="bg-cloud px-5 py-16 md:px-8 md:py-24">
          <div className="mx-auto max-w-3xl">
            <p className="text-center text-sm font-black uppercase text-cyan">FAQ</p>
            <h2 className="mt-3 text-center font-display text-4xl font-black text-midnight">
              Quick answers before you travel.
            </h2>
            <div className="mt-10 space-y-4">
              {page.faqs.map((faq) => (
                <details className="group rounded-xl border border-line bg-white p-5 shadow-sm" key={faq.question}>
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display font-black text-midnight">
                    {faq.question}
                    <CircleHelp aria-hidden="true" className="shrink-0 text-cyan transition group-open:rotate-45" size={20} />
                  </summary>
                  <p className="mt-4 leading-7 text-slate-600">{faq.answer}</p>
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
