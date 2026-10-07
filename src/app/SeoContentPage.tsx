import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import { JsonLd } from "./JsonLd";
import { Navbar } from "./components/Navbar";
import { LinkButton } from "./components/Button";
import { ContentFaq } from "./components/ContentFaq";
import {
  CONTENT_ASIDE,
  CONTENT_CARD,
  CONTENT_EYEBROW,
  CONTENT_GUTTER,
  CONTENT_H1,
  CONTENT_ICON_TILE,
  CONTENT_ROW_LINK,
  CONTENT_SECTION_H2,
  CONTENT_TEXT_LINK,
  CONTENT_TOP
} from "./components/contentClasses";
import { SiteFooter } from "./SiteFooter";
import { landingContent } from "@/content/landing";
import type { SeoContentPage } from "@/content/seo-pages";
import { createContentPageJsonLd, type DestinationOfferInput } from "@/lib/seo";
import { seoContentUpdatedAt } from "@/lib/esim-routes";

export function SeoContentPageView({
  page,
  parent,
  offer,
  asArticle = false
}: {
  page: SeoContentPage;
  parent: {
    name: string;
    path: string;
  };
  offer?: DestinationOfferInput;
  /** Editorial guides get Article markup; marketing landing pages don't. */
  asArticle?: boolean;
}) {
  return (
    <main className="min-h-screen overflow-x-clip bg-surface text-onSurface">
      <JsonLd
        data={createContentPageJsonLd({
          path: page.path,
          name: page.heading,
          description: page.description,
          breadcrumbName: page.heading,
          parent,
          faqs: page.faqs,
          offer,
          article: asArticle ? { dateModified: seoContentUpdatedAt } : undefined
        })}
      />
      <Navbar />

      <article>
        <section className={`rounded-b-[24px] bg-surfaceBright pb-10 lg:pb-14 ${CONTENT_GUTTER} ${CONTENT_TOP}`}>
          <div className="mx-auto max-w-6xl">
            <a className={`${CONTENT_TEXT_LINK} text-sm`} href={parent.path}>
              <ArrowLeft aria-hidden="true" size={16} />
              {parent.name}
            </a>
            <p className={`mt-6 ${CONTENT_EYEBROW}`}>{page.eyebrow}</p>
            <h1 className={`mt-3 max-w-4xl ${CONTENT_H1}`}>{page.heading}</h1>
            {offer ? (
              <p className="mt-5 inline-flex flex-wrap items-center gap-x-1 rounded-full border border-brandBlue/20 bg-brandBlue/5 px-4 py-2 text-sm font-black text-brandBlue">
                eSIM plans from €{offer.lowPrice.toFixed(2)} to €{offer.highPrice.toFixed(2)} ·{" "}
                {offer.offerCount} plans
              </p>
            ) : null}
            <p className="mt-5 max-w-3xl text-base leading-7 text-onSurfaceVariant sm:text-lg sm:leading-8">
              {page.intro}
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              {/* US is the first market (owner priority US > UK > rest of Europe), so the App Store link is
                  this page's one gradient primary and Google Play is flat. */}
              <LinkButton
                aria-label="Download eSim2you on the App Store"
                href={landingContent.appLinks.ios.href}
                size="lg"
              >
                {landingContent.appLinks.ios.label}
                <ArrowRight aria-hidden="true" size={18} />
              </LinkButton>
              <LinkButton
                aria-label="Download eSim2you on Google Play"
                href={landingContent.appLinks.android.href}
                size="lg"
                tone="brand"
                variant="tint"
              >
                {landingContent.appLinks.android.label}
                <ArrowRight aria-hidden="true" size={18} />
              </LinkButton>
            </div>
          </div>
        </section>

        <section className={`py-10 md:py-16 ${CONTENT_GUTTER}`}>
          <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start">
            <div className="min-w-0 space-y-4">
              {page.sections.map((section) => (
                <section className={CONTENT_CARD} key={section.title}>
                  <div className="flex gap-4">
                    <span className={`mt-0.5 ${CONTENT_ICON_TILE}`}>
                      <CheckCircle2 aria-hidden="true" size={20} />
                    </span>
                    <div className="min-w-0">
                      <h2 className="font-display text-headline-md font-black text-brandInk">{section.title}</h2>
                      <p className="mt-2 leading-7 text-onSurfaceVariant">{section.body}</p>
                    </div>
                  </div>
                </section>
              ))}
            </div>

            <aside className={`h-fit ${CONTENT_ASIDE}`}>
              <h2 className="font-display text-title-sm font-black text-brandInk sm:text-xl">Related pages</h2>
              <div className="mt-4 grid gap-2">
                {page.relatedLinks.map((link) => (
                  <a className={CONTENT_ROW_LINK} href={link.href} key={link.href}>
                    {link.label}
                    <ArrowRight aria-hidden="true" className="shrink-0 text-brandBlue" size={16} />
                  </a>
                ))}
              </div>
            </aside>
          </div>
        </section>

        <section className={`bg-surfaceBright py-16 md:py-24 ${CONTENT_GUTTER}`}>
          <div className="mx-auto max-w-3xl">
            <p className={`text-center ${CONTENT_EYEBROW}`}>FAQ</p>
            <h2 className={`mt-2 text-center ${CONTENT_SECTION_H2}`}>Quick answers before you travel.</h2>
            <div className="mt-8">
              <ContentFaq faqs={page.faqs} />
            </div>
          </div>
        </section>
      </article>
      <SiteFooter />
    </main>
  );
}
