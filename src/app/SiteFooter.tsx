import { landingContent } from "@/content/landing";
import { guidePages, useCasePages } from "@/content/seo-pages";

const footerExploreLinks = [
  { label: "Destinations", href: "/destinations" },
  ...useCasePages.map((page) => ({ label: page.eyebrow, href: page.path }))
];
const footerResourceLinks = guidePages.slice(0, 3).map((page) => ({
  label: page.heading,
  href: page.path
}));
const footerCompanyLinks = [
  { label: "Support", href: "/support" },
  { label: "Contact", href: "mailto:esim@uplisoft.com" },
  { label: "Policy", href: "/policy" },
  { label: "Terms", href: "/terms" }
];

export function SiteFooter() {
  return (
    <footer aria-label="Footer" className="border-t border-cyan/10 bg-midnight text-white">
      <div className="mx-auto max-w-7xl px-5 py-12 md:px-8 md:py-16">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_1.4fr]">
          <div>
            <div className="flex items-center gap-3 font-display text-lg font-black">
              <img
                alt=""
                aria-hidden="true"
                className="h-9 w-9 rounded-lg shadow-glow"
                src="/app-logo.png"
              />
              {landingContent.brand}
            </div>
            <p className="mt-4 max-w-md text-sm leading-6 text-white/60">
              Velocity eSIM helps travelers choose reliable mobile data for international trips without roaming surprises.
            </p>
            <p className="mt-4 max-w-md text-sm leading-6 text-white/45">
              Velocity eSIM travel data guides and destination pages are built for quick planning before you fly.
            </p>
          </div>
          <div className="grid gap-8 sm:grid-cols-3">
            <FooterLinkColumn title="Company" links={footerCompanyLinks} />
            <FooterLinkColumn title="Explore" links={footerExploreLinks} />
            <FooterLinkColumn title="Resources" links={footerResourceLinks} />
          </div>
        </div>
        <div className="mt-10 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs font-semibold text-white/45 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 Velocity eSIM. All rights reserved.</p>
          <p>Velocity eSIM destination coverage for 200+ destinations.</p>
        </div>
      </div>
    </footer>
  );
}

function FooterLinkColumn({
  links,
  title
}: {
  links: readonly { label: string; href: string }[];
  title: string;
}) {
  return (
    <nav aria-label={title}>
      <h2 className="text-xs font-black uppercase tracking-[0.08em] text-cyan">{title}</h2>
      <div className="mt-4 grid gap-3">
        {links.map((link) => (
          <a className="text-sm font-semibold text-white/68 transition hover:text-cyan" href={link.href} key={link.href}>
            {link.label}
          </a>
        ))}
      </div>
    </nav>
  );
}
