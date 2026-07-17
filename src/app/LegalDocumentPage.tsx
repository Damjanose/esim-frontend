import Link from "next/link";
import type { LegalDocument } from "@/content/legal";
import { landingContent } from "@/content/landing";
import { SiteFooter } from "./SiteFooter";

type LegalDocumentPageProps = {
  document: LegalDocument;
};

export function LegalDocumentPage({ document }: LegalDocumentPageProps) {
  return (
    <main className="min-h-screen bg-cloud text-ink">
      <header className="border-b border-line bg-white">
        <nav className="mx-auto flex h-20 max-w-4xl items-center justify-between px-5 md:px-8">
          <Link className="flex items-center gap-3 font-display text-lg font-bold" href="/">
            <img
              alt=""
              aria-hidden="true"
              className="h-9 w-9 rounded-lg shadow-glow"
              src="/app-logo.png"
            />
            {landingContent.brand}
          </Link>
          <Link className="text-sm font-bold text-midnight transition hover:text-cyan" href="/">
            Home
          </Link>
        </nav>
      </header>

      <article className="mx-auto max-w-4xl px-5 py-14 md:px-8 md:py-20">
        <p className="text-sm font-black uppercase text-cyan">{landingContent.brand}</p>
        <h1 className="mt-3 font-display text-4xl font-black leading-tight text-midnight md:text-5xl">
          {document.title}
        </h1>
        <p className="mt-3 text-sm font-semibold text-slate-500">
          Last updated: {document.lastUpdated}
        </p>

        <div className="mt-10 space-y-9">
          {document.sections.map((section) => (
            <section className="border-t border-line pt-7" key={section.title}>
              <h2 className="font-display text-2xl font-black text-midnight">{section.title}</h2>
              <div className="mt-4 space-y-4 text-base leading-8 text-slate-600">
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
