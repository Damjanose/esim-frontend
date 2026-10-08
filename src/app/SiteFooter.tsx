import Image from "next/image";
import { landingContent } from "@/content/landing";
import { guidePages, useCasePages } from "@/content/seo-pages";
import { crawlRel } from "@/lib/robots-policy";
import { socialLinks } from "@/lib/seo";
import { Facebook, Instagram } from "lucide-react";
import { PrivacyChoicesLink } from "./ConsentManager";

const footerUseCaseLabels: Record<string, string> = {
  "business-travel": "Business travel eSIM guide",
  "remote-work": "Remote work eSIM guide",
  cruises: "Cruise port-day eSIM guide",
  "study-abroad": "Study abroad eSIM guide"
};

const footerGuideLabels: Record<string, string> = {
  "how-much-data-when-traveling": "How much travel data do you need",
  "travel-data-and-wifi": "Travel data and Wi-Fi planning",
  "keep-your-number-with-esim": "Keep your number with a travel eSIM",
  "what-is-an-esim": "Beginner guide to eSIMs",
  "esim-vs-roaming": "Compare eSIM and roaming",
  "how-to-install-esim": "Travel eSIM installation guide"
};

const footerExploreLinks = [
  { label: "Browse all eSIM destinations", href: "/destinations" },
  { label: "Compare travel eSIMs", href: "/compare" },
  { label: "Travel eSIM guides", href: "/travel" },
  { label: "AI trip planner", href: "/trip-plan" },
  ...useCasePages.map((page) => ({
    label: footerUseCaseLabels[page.slug] ?? page.heading,
    href: page.path
  }))
];
const footerResourceLinks = guidePages.slice(0, 3).map((page) => ({
  label: footerGuideLabels[page.slug] ?? page.heading,
  href: page.path
}));
const footerCompanyLinks = [
  { label: "eSim2you support", href: "/support" },
  { label: "Contact eSim2you", href: "mailto:esim2you@uplisoft.com" },
  { label: "Partner with eSim2you", href: "/partners/request" },
  { label: "eSim2you privacy policy", href: "/policy" },
  { label: "eSim2you terms", href: "/terms" }
];

export function SiteFooter() {
  return (
    <footer aria-label="Footer" className="border-t border-outline/60 bg-surfaceBright text-onSurface">
      <div className="mx-auto max-w-7xl px-5 py-10 md:px-8 md:py-16">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_1.4fr] lg:gap-10">
          <div>
            <div className="flex items-center gap-3 font-display text-lg font-black">
              <Image
                alt="eSim2you app logo"
                className="h-9 w-9 rounded-lg shadow-brandCard"
                height={36}
                src="/app-logo.png"
                width={36}
              />
              {landingContent.brand}
            </div>
            <p className="mt-3 max-w-md text-sm leading-6 text-onSurfaceVariant">
              eSim2you helps travelers get prepaid mobile data in 200+ countries, without the roaming bill.
            </p>
            <div className="mt-4 flex items-center gap-3">
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
          {/* Phones: one group per row, links wrap inline. sm+: three columns. */}
          <div className="grid gap-6 sm:grid-cols-3 sm:gap-x-6 sm:gap-y-8">
            <FooterLinkColumn title="Company" links={footerCompanyLinks} />
            <FooterLinkColumn title="Explore" links={footerExploreLinks} />
            <FooterLinkColumn title="Resources" links={footerResourceLinks} />
          </div>
        </div>
        <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-outline pt-5 text-xs font-semibold text-onSurfaceVariant sm:mt-10 sm:justify-between sm:pt-6">
          <p className="w-full sm:w-auto">© 2026 eSim2you</p>
          <a
            className="transition hover:text-brandBlue"
            href="https://www.producthunt.com/products/esim2you?embed=true&utm_source=embed&utm_medium=post_embed"
            rel="noopener"
            target="_blank"
          >
            Featured on Product Hunt
          </a>
          <PrivacyChoicesLink />
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
      <h2 className="font-display text-sm font-black text-brandInk">{title}</h2>
      <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-2 sm:mt-4 sm:grid sm:gap-3">
        {links.map((link) => (
          <a className="text-sm font-medium text-onSurfaceVariant transition hover:text-brandBlue" href={link.href} key={link.href} rel={crawlRel(link.href)}>
            {link.label}
          </a>
        ))}
      </div>
    </nav>
  );
}
