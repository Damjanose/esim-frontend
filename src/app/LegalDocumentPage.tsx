import Link from "next/link";
import type { LegalDocument } from "@/content/legal";
import { landingContent } from "@/content/landing";
import { CONTENT_EYEBROW, CONTENT_GUTTER, CONTENT_TEXT_LINK } from "./components/contentClasses";
import { SiteFooter } from "./SiteFooter";

type LegalDocumentPageProps = {
  document: LegalDocument;
};

export function LegalDocumentPage({ document }: LegalDocumentPageProps) {
  return (
    <main className="min-h-screen bg-surfaceBright text-onSurface">
      <header className="border-b border-outline/70 bg-surface">
        <nav className={`mx-auto flex h-16 max-w-3xl items-center justify-between lg:h-20 ${CONTENT_GUTTER}`}>
          <Link className="flex min-h-11 items-center gap-3 font-display text-lg font-bold text-brandInk" href="/">
            <img
              alt="eSIM2you app logo"
              className="h-9 w-9 rounded-lg"
              src="/app-logo.png"
            />
            {landingContent.brand}
          </Link>
          <Link className={`${CONTENT_TEXT_LINK} text-sm`} href="/">
            Home
          </Link>
        </nav>
      </header>

      <article className={`mx-auto max-w-3xl py-10 md:py-16 ${CONTENT_GUTTER}`}>
        <p className={CONTENT_EYEBROW}>{landingContent.brand}</p>
        <h1 className="mt-3 font-display text-[34px] font-black leading-[1.08] tracking-[-0.03em] text-brandInk md:text-5xl">
          {document.title}
        </h1>
        <p className="mt-3 text-sm font-semibold text-onSurfaceVariant">
          Last updated: {document.lastUpdated}
        </p>

        <div className="mt-8 rounded-[20px] border border-outline/70 bg-surface px-5 shadow-brandCard sm:px-8">
          {document.sections.map((section) => (
            <section className="border-t border-outline/70 py-7 first:border-t-0" key={section.title}>
              <h2 className="font-display text-headline-md font-black text-brandInk">{section.title}</h2>
              <div className="mt-3 space-y-4 text-base leading-8 text-onSurfaceVariant">
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </section>
          ))}
        </div>
      </article>

      <SiteFooter />
    </main>
  );
}
