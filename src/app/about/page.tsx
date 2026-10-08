import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { JsonLd } from "../JsonLd";
import { Navbar } from "../components/Navbar";
import {
  CONTENT_CARD,
  CONTENT_EYEBROW,
  CONTENT_GUTTER,
  CONTENT_H1,
  CONTENT_ROW_LINK,
  CONTENT_SECTION_H2,
  CONTENT_TEXT_LINK,
  CONTENT_TOP
} from "../components/contentClasses";
import { SiteFooter } from "../SiteFooter";
import { landingContent } from "@/content/landing";
import { brandDescription, createMetadata, createWebPageJsonLd, siteUrl } from "@/lib/seo";

const title = "About eSIM2you | Travel eSIM Data for 200+ Destinations";
const description =
  "eSIM2you is a travel eSIM provider: prepaid mobile data in 200+ destinations, bought and installed from the eSIM2you app or website.";

export const metadata: Metadata = createMetadata({ path: "/about", title, description });

const facts = [
  {
    heading: "What eSIM2you does",
    body: "eSIM2you sells prepaid travel data as an eSIM. You pick a country, region or global plan, pay once, and install it on your phone with a QR code or manual setup. There is no physical SIM to post and no roaming bill afterwards."
  },
  {
    heading: "Where it works",
    body: "Plans cover 200+ destinations, from single countries like the USA, UK, Italy, Greece, Turkey and Albania to regional plans for Europe and the Balkans. The data runs on local partner networks in each destination."
  },
  {
    heading: "How you buy it",
    body: "Use the eSIM2you app for iOS and Android, or this website. The same account works in both: sign in with email, Google or Apple, and your eSIMs, top-ups and orders follow you."
  },
  {
    heading: "Help when you need it",
    body: "Setup guides, troubleshooting and refunds are on the support center, and signed-in travelers can chat with the eSIM2you team from the app or their profile."
  }
];

const destinationLinks = [
  { label: "eSIM2you USA eSIM", href: "/esim/usa" },
  { label: "eSIM2you UK eSIM", href: "/esim/uk" },
  { label: "eSIM2you Europe eSIM", href: "/esim/europe" },
  { label: "eSIM2you Italy eSIM", href: "/esim/italy" },
  { label: "eSIM2you Greece eSIM", href: "/esim/greece" },
  { label: "eSIM2you Turkey eSIM", href: "/esim/turkey" },
  { label: "eSIM2you Albania eSIM", href: "/esim/albania" }
];

const guideLinks = [
  { label: "What is an eSIM?", href: "/travel/what-is-an-esim" },
  { label: "Which phones support eSIM", href: "/travel/esim-compatible-phones" },
  { label: "How to install a travel eSIM", href: "/travel/how-to-install-esim" }
];

export default function AboutPage() {
  return (
    <main className="min-h-screen overflow-x-clip bg-surfaceBright text-onSurface">
      <JsonLd
        data={createWebPageJsonLd({
          path: "/about",
          name: "About eSIM2you",
          description,
          breadcrumbName: "About",
          pageType: "AboutPage"
        })}
      />
      <Navbar />
      <section className={`pb-16 md:pb-24 ${CONTENT_GUTTER} ${CONTENT_TOP}`}>
        <div className="mx-auto max-w-5xl">
          <p className={CONTENT_EYEBROW}>About us</p>
          <h1 className={`mt-3 max-w-4xl ${CONTENT_H1}`}>About eSIM2you</h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-onSurfaceVariant sm:text-lg sm:leading-8">
            {brandDescription} The official eSIM2you website is{" "}
            <Link className="font-bold text-brandBlue" href="/">
              {new URL(siteUrl).host}
            </Link>
            .
          </p>

          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {facts.map((fact) => (
              <section className={CONTENT_CARD} key={fact.heading}>
                <h2 className="font-display text-headline-md font-black text-brandInk">{fact.heading}</h2>
                <p className="mt-2 text-body-md text-onSurfaceVariant">{fact.body}</p>
              </section>
            ))}
          </div>

          <h2 className={`mt-14 ${CONTENT_SECTION_H2}`}>Popular eSIM2you destinations</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {destinationLinks.map((link) => (
              <Link className={CONTENT_ROW_LINK} href={link.href} key={link.href}>
                {link.label}
                <ArrowRight aria-hidden="true" size={16} />
              </Link>
            ))}
          </div>
          <Link className={`mt-3 ${CONTENT_TEXT_LINK}`} href="/destinations">
            See all eSIM2you destinations
            <ArrowRight aria-hidden="true" size={16} />
          </Link>

          <h2 className={`mt-14 ${CONTENT_SECTION_H2}`}>New to eSIMs?</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {guideLinks.map((link) => (
              <Link className={CONTENT_ROW_LINK} href={link.href} key={link.href}>
                {link.label}
                <ArrowRight aria-hidden="true" size={16} />
              </Link>
            ))}
          </div>

          <h2 className={`mt-14 ${CONTENT_SECTION_H2}`}>Get the eSIM2you app</h2>
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
          </div>

          <p className="mt-14 text-body-md text-onSurfaceVariant">
            Questions?{" "}
            <Link className="font-bold text-brandBlue" href="/contact">
              Contact eSIM2you
            </Link>{" "}
            or go back to the{" "}
            <Link className="font-bold text-brandBlue" href="/">
              eSIM2you homepage
            </Link>
            .
          </p>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
