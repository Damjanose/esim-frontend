import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Download } from "lucide-react";
import { JsonLd } from "../JsonLd";
import { Navbar } from "../components/Navbar";
import {
  CONTENT_CARD,
  CONTENT_EYEBROW,
  CONTENT_GUTTER,
  CONTENT_H1,
  CONTENT_ROW_LINK,
  CONTENT_SECTION_H2,
  CONTENT_TOP
} from "../components/contentClasses";
import { SiteFooter } from "../SiteFooter";
import { CopyField } from "../account/[orderId]/CopyField";
import { landingContent } from "@/content/landing";
import {
  absoluteUrl,
  brandDescription,
  createMetadata,
  createWebPageJsonLd,
  indexableRoutes,
  siteName,
  siteUrl,
  socialLinks,
  supportEmail
} from "@/lib/seo";

const route = indexableRoutes.find((entry) => entry.path === "/press")!;

export const metadata: Metadata = createMetadata({
  path: route.path,
  title: route.title,
  description: route.description
});

const siteHost = new URL(siteUrl).host;

// Only facts that are true today. Keep them in sync with
// docs/brand-outreach-kit.md so every mention of the brand matches.
const facts = [
  { label: "Name", value: siteName },
  { label: "What it is", value: "Travel eSIM provider: prepaid mobile data plans for international travel" },
  { label: "Coverage", value: "200+ destinations, single-country and regional plans" },
  { label: "Where to buy", value: `iOS app, Android app and ${siteHost}` },
  { label: "Website", value: siteHost },
  { label: "Media contact", value: supportEmail }
];

const logos = [
  { label: "App icon", file: "/app-logo.png", size: "1024 × 1024 PNG", width: 1024, height: 1024 },
  { label: "Logo with wordmark", file: "/logo-full.png", size: "1200 × 345 PNG", width: 1200, height: 345 },
  { label: "Logo mark", file: "/logo-icon.png", size: "512 × 512 PNG", width: 512, height: 512 },
  { label: "Social preview image", file: "/og/esim2you-og.png", size: "1200 × 630 PNG", width: 1200, height: 630 }
];

const linkSnippets = [
  { label: "Brand mention", value: `<a href="${absoluteUrl("/")}">eSIM2you</a>` },
  { label: "Country page (example: USA)", value: `<a href="${absoluteUrl("/esim/usa")}">eSIM2you USA eSIM</a>` },
  {
    label: "Price data",
    value: `<a href="${absoluteUrl("/esim-price-index")}">eSIM2you Travel eSIM Price Index</a>`
  }
];

const storyLinks = [
  { label: "Travel eSIM price index (live data)", href: "/esim-price-index" },
  { label: "What is an eSIM?", href: "/travel/what-is-an-esim" },
  { label: "eSIM vs roaming", href: "/travel/esim-vs-roaming" },
  { label: "Which phones support eSIM", href: "/travel/esim-compatible-phones" },
  { label: "How much data you need abroad", href: "/travel/how-much-data-when-traveling" },
  { label: "About eSIM2you", href: "/about" }
];

export default function PressPage() {
  return (
    <main className="min-h-screen overflow-x-clip bg-surfaceBright text-onSurface">
      <JsonLd
        data={createWebPageJsonLd({
          path: "/press",
          name: "eSIM2you press kit",
          description: route.description,
          breadcrumbName: "Press",
          pageType: "AboutPage"
        })}
      />
      <Navbar />
      <section className={`pb-16 md:pb-24 ${CONTENT_GUTTER} ${CONTENT_TOP}`}>
        <div className="mx-auto max-w-5xl">
          <p className={CONTENT_EYEBROW}>Press</p>
          <h1 className={`mt-3 max-w-4xl ${CONTENT_H1}`}>eSIM2you press kit</h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-onSurfaceVariant sm:text-lg sm:leading-8">
            Everything you need to write about eSIM2you: a description you can quote, key facts, logos and a
            media contact. For interviews, data requests or product questions, email{" "}
            <a className="font-bold text-brandBlue" href={`mailto:${supportEmail}`}>
              {supportEmail}
            </a>
            .
          </p>

          <h2 className={`mt-14 ${CONTENT_SECTION_H2}`}>About eSIM2you in one sentence</h2>
          <div className="mt-5">
            <CopyField label="Boilerplate" value={brandDescription} />
          </div>

          <h2 className={`mt-14 ${CONTENT_SECTION_H2}`}>Key facts</h2>
          <dl className="mt-5 grid gap-3 sm:grid-cols-2">
            {facts.map((fact) => (
              <div className={CONTENT_CARD} key={fact.label}>
                <dt className="text-label-caps uppercase text-onSurfaceVariant">{fact.label}</dt>
                <dd className="mt-1 font-bold text-brandInk">{fact.value}</dd>
              </div>
            ))}
          </dl>

          <h2 className={`mt-14 ${CONTENT_SECTION_H2}`}>Logos and images</h2>
          <p className="mt-3 max-w-3xl text-body-md text-onSurfaceVariant">
            Use the logos as they are, without recoloring or stretching them. The brand is always written{" "}
            <strong className="text-brandInk">eSIM2you</strong>: lowercase e, capital SIM, the number 2 and lowercase
            you.
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {logos.map((logo) => (
              <div className={`${CONTENT_CARD} flex items-center gap-4`} key={logo.file}>
                <div className="grid h-20 w-28 shrink-0 place-items-center rounded-[12px] border border-outline/60 bg-surfaceBright p-2">
                  <Image
                    alt={`eSIM2you ${logo.label.toLowerCase()}`}
                    className="max-h-16 w-auto object-contain"
                    height={logo.height}
                    src={logo.file}
                    width={logo.width}
                  />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-brandInk">{logo.label}</p>
                  <p className="text-xs text-onSurfaceVariant">{logo.size}</p>
                  <a
                    className="mt-1 inline-flex min-h-11 items-center gap-1.5 text-sm font-black text-brandBlue transition hover:text-brandInk"
                    download
                    href={logo.file}
                  >
                    <Download aria-hidden="true" size={14} />
                    Download
                  </a>
                </div>
              </div>
            ))}
          </div>

          <h2 className={`mt-14 ${CONTENT_SECTION_H2}`}>Linking to eSIM2you</h2>
          <p className="mt-3 max-w-3xl text-body-md text-onSurfaceVariant">
            When you mention eSIM2you, please link to {siteHost}, our only official website. These ready-made links
            use the correct name:
          </p>
          <div className="mt-5 grid gap-3">
            {linkSnippets.map((snippet) => (
              <CopyField key={snippet.label} label={snippet.label} value={snippet.value} />
            ))}
          </div>

          <h2 className={`mt-14 ${CONTENT_SECTION_H2}`}>Useful for your story</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {storyLinks.map((link) => (
              <Link className={CONTENT_ROW_LINK} href={link.href} key={link.href}>
                {link.label}
                <ArrowRight aria-hidden="true" size={16} />
              </Link>
            ))}
          </div>

          <h2 className={`mt-14 ${CONTENT_SECTION_H2}`}>Find eSIM2you elsewhere</h2>
          <div className="mt-5 flex flex-wrap gap-3">
            <a className={CONTENT_ROW_LINK} href={landingContent.appLinks.ios.href} rel="noopener noreferrer" target="_blank">
              eSIM2you on the {landingContent.appLinks.ios.label}
            </a>
            <a
              className={CONTENT_ROW_LINK}
              href={landingContent.appLinks.android.href}
              rel="noopener noreferrer"
              target="_blank"
            >
              eSIM2you on {landingContent.appLinks.android.label}
            </a>
            <a className={CONTENT_ROW_LINK} href={socialLinks.instagram} rel="me noopener noreferrer" target="_blank">
              Instagram
            </a>
            <a className={CONTENT_ROW_LINK} href={socialLinks.facebook} rel="me noopener noreferrer" target="_blank">
              Facebook
            </a>
          </div>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
