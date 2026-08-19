import { landingContent } from "@/content/landing";
import { guidePages, useCasePages } from "@/content/seo-pages";
import { socialLinks } from "@/lib/seo";
import { Facebook, Instagram } from "lucide-react";

const footerExploreLinks = [
  { label: "Browse all eSIM destinations", href: "/destinations" },
  ...useCasePages.map((page) => ({
    label:
      page.slug === "business-travel"
        ? "Business travel eSIM guide"
        : "Remote work eSIM guide",
    href: page.path
  }))
];
const footerResourceLinks = guidePages.slice(0, 3).map((page) => ({
  label:
    page.slug === "what-is-an-esim"
      ? "Beginner guide to eSIMs"
      : page.slug === "esim-vs-roaming"
        ? "Compare eSIM and roaming"
        : "Travel eSIM installation guide",
  href: page.path
}));
const footerCompanyLinks = [
  { label: "eSim2you support", href: "/support" },
  { label: "Contact eSim2you", href: "mailto:esim@uplisoft.com" },
  { label: "eSim2you privacy policy", href: "/policy" },
  { label: "eSim2you terms", href: "/terms" }
];

export function SiteFooter() {
  return (
    <footer aria-label="Footer" className="border-t border-outline bg-surface text-onSurface">
      <div className="mx-auto max-w-7xl px-5 py-12 md:px-8 md:py-16">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_1.4fr]">
          <div>
            <div className="flex items-center gap-3 font-display text-lg font-black">
              <img
                alt="eSim2you app logo"
                className="h-9 w-9 rounded-lg shadow-brandCard"
                src="/app-logo.png"
              />
              {landingContent.brand}
            </div>
            <p className="mt-4 max-w-md text-sm leading-6 text-onSurfaceVariant">
              eSim2you helps travelers choose reliable mobile data for international trips without roaming surprises.
            </p>
            <p className="mt-4 max-w-md text-sm leading-6 text-onSurfaceVariant/70">
              eSim2you travel data guides and destination pages are built for quick planning before you fly.
            </p>
            <div className="mt-5 flex items-center gap-3">
              <a
                aria-label="eSim2you on Instagram"
                className="grid h-10 w-10 place-items-center rounded-full border border-outline text-onSurfaceVariant transition hover:border-brandBlue/60 hover:text-brandBlue"
                href={socialLinks.instagram}
                rel="me noopener noreferrer"
                target="_blank"
              >
                <Instagram aria-hidden="true" size={18} />
              </a>
              <a
                aria-label="eSim2you on Facebook"
                className="grid h-10 w-10 place-items-center rounded-full border border-outline text-onSurfaceVariant transition hover:border-brandBlue/60 hover:text-brandBlue"
                href={socialLinks.facebook}
                rel="me noopener noreferrer"
                target="_blank"
              >
                <Facebook aria-hidden="true" size={18} />
              </a>
            </div>
          </div>
          <div className="grid gap-8 sm:grid-cols-3">
            <FooterLinkColumn title="Company" links={footerCompanyLinks} />
            <FooterLinkColumn title="Explore" links={footerExploreLinks} />
            <FooterLinkColumn title="Resources" links={footerResourceLinks} />
          </div>
        </div>
        <div className="mt-10 flex flex-col gap-3 border-t border-outline pt-6 text-xs font-semibold text-onSurfaceVariant/70 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 eSim2you. All rights reserved.</p>
          <p>eSim2you destination coverage for 200+ destinations.</p>
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
      <h2 className="text-xs font-black uppercase tracking-[0.08em] text-brandBlue">{title}</h2>
      <div className="mt-4 grid gap-3">
        {links.map((link) => (
          <a className="text-sm font-semibold text-onSurfaceVariant transition hover:text-brandBlue" href={link.href} key={link.href}>
            {link.label}
          </a>
        ))}
      </div>
    </nav>
  );
}
