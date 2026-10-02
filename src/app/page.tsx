import {
  ArrowRight,
  Check,
  CircleHelp,
  Globe2,
  Headphones,
  ShieldCheck,
  Zap,
} from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import { getImageProps } from "next/image";

import { JsonLd } from "./JsonLd";
import { SiteFooter } from "./SiteFooter";

import { Navbar } from './components/Navbar'
import { LinkButton } from "./components/Button";
import { createLandingJsonLd, createMetadata } from "@/lib/seo";
import { loadPublicTestimonials } from "@/lib/loadPublicTestimonials";
import { Testimonials } from "./Testimonials";
import { landingContent } from "@/content/landing";
import { HeroPackageSearch } from "./HeroPackageSearch";
import { HeroTuneButton } from "./HeroTuneButton";
import { TopDestinationLinks } from "./TopDestinationLinks";
import { HeroDestinationChips } from "./HeroDestinationChips";
import { DestinationBrowse } from "./destinations/DestinationBrowse";

const benefits = [
  {
    icon: Zap,
    title: "Instant Activation",
    description: "Get connected in under one minute with a QR code."
  },
  {
    icon: Globe2,
    title: "Global Coverage",
    description: "200+ countries and regions with reliable local networks."
  },
  {
    icon: ShieldCheck,
    title: "Transparent Pricing",
    description: "No hidden fees. What you see is exactly what you pay."
  },
  {
    icon: Headphones,
    title: "24/7 Support",
    description: "Our support team is available whenever you need help."
  }
];

const installationSteps = [
  {
    title: "Choose your plan",
    description: "Pick your destination and the data plan that fits your trip — real, live prices, no surprises."
  },
  {
    title: "Scan & install",
    description: "Scan the QR code from your order. Installs itself in seconds."
  },
  {
    title: "Connect & go",
    description: "Track data and manage every eSIM from one dashboard."
  }
];

export const metadata: Metadata = createMetadata({
  path: "/",
  title: "eSim2you | Travel Data for 200+ Destinations",
  description:
    "Buy a digital eSIM for 200+ destinations with instant activation and high-speed data. No physical SIM or roaming fees — set up in minutes before you travel."
});

export default async function Home() {
  const testimonials = await loadPublicTestimonials();

  return (
    <main className="min-h-screen overflow-x-hidden bg-surface text-onSurface">
      <JsonLd data={createLandingJsonLd()} />

      <Navbar />
      <Hero />
      <DestinationBrowse urlFilters={{}} />
      <TopDestinationLinks />
      <Benefits />
      <HowItWorks />
      <Testimonials items={testimonials} />
      <TrustAndFaq />
      <AppAndPartner />
      <Cta />
      <SiteFooter />
    </main>
  );
}

const HERO_PHOTO_ALT =
  "Southern Italy at night with sunrise breaking over the horizon, photographed from the International Space Station";

const heroPerks = [
  { icon: Zap, title: "Instant activation", body: "Install before you fly" },
  { icon: ShieldCheck, title: "No roaming fees", body: "Prepaid, no surprise bills" },
  { icon: Globe2, title: "200+ destinations", body: "Local, regional and global plans" },
  { icon: Headphones, title: "24/7 support", body: "Real people, in-app chat" }
];

function Hero() {
  // Art-directed hero photo (NASA iss065e045974): a tall crop below lg and a
  // wide crop from lg. <picture> lets the browser download only one of them.
  // Quality above the default 75, which visibly smears the point-like city
  // lights: 90 on desktop; 80 on phones, where 3x density hides the difference
  // and halves the LCP bytes (w=1200: 527 KB at 90, 268 KB at 80).
  const { props: { srcSet: wideSrcSet } } = getImageProps({
    alt: HERO_PHOTO_ALT,
    height: 1390,
    quality: 90,
    sizes: "(min-width: 1440px) 1400px, 1280px",
    src: "/images/hero-earth-wide.webp",
    width: 2880
  });
  const { props: tallImageProps } = getImageProps({
    alt: HERO_PHOTO_ALT,
    fetchPriority: "high",
    height: 1965,
    loading: "eager",
    quality: 80,
    sizes: "100vw",
    src: "/images/hero-earth-tall.webp",
    width: 1290
  });

  return (
    <section className="relative isolate z-20 bg-surface text-onSurface" id="home">
      <div className="lg:px-4 lg:pt-3">
        {/* Full-bleed under lg (the capsule navbar floats inside it), a rounded
            card from lg. No overflow-hidden here: the search dropdown is in
            normal flow and must never be clipped; only the photo layer clips. */}
        {/* data-nav-dark: NavbarTone keeps the fixed navbar dark glass while this card is under it. */}
        <div className="relative mx-auto max-w-[1400px] rounded-b-[28px] bg-brandInk text-white lg:rounded-[32px]" data-nav-dark="">
          <div className="absolute inset-0 overflow-hidden rounded-[inherit]">
            <picture>
              <source media="(min-width: 1024px)" sizes="(min-width: 1440px) 1400px, 1280px" srcSet={wideSrcSet} />
              <img
                {...tallImageProps}
                className="h-full w-full object-cover object-top lg:object-center"
              />
            </picture>
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-[linear-gradient(180deg,rgba(6,17,49,0.2)_0%,rgba(6,17,49,0.35)_28%,rgba(6,17,49,0.93)_58%)] lg:bg-[linear-gradient(90deg,rgba(6,17,49,0.92)_0%,rgba(6,17,49,0.62)_46%,rgba(6,17,49,0.05)_80%)]"
            />
          </div>

          {/* Phone top padding leaves the photo's lit coastline visible above
              the copy while keeping search above the bottom dock on
              640–667px-tall screens. items-end: the eSIM card sits low. */}
          <div className="relative mx-auto grid max-w-[1240px] gap-10 px-5 pb-8 pt-[184px] sm:pt-[240px] md:px-8 md:pt-[300px] lg:grid-cols-[minmax(0,1fr)_300px] lg:items-end lg:px-12 lg:pb-14 lg:pt-[148px]">
            <div className="min-w-0">
              <span className="inline-flex items-center gap-2 rounded-full border border-brandTeal/45 bg-brandTeal/15 px-3 py-1.5 text-xs font-bold text-[#CFFAF8]">
                <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-brandTeal" />
                200+ destinations · Instant activation
              </span>

              <h1 className="mt-3 font-display text-[30px] font-black leading-[1.02] tracking-[-0.045em] text-white text-balance sm:mt-4 sm:text-[48px] lg:text-[64px] xl:text-[72px]">
                Land anywhere.
                <br />
                <span className="text-brandTeal">Already connected.</span>
              </h1>

              <p className="mt-3 max-w-[520px] text-sm leading-6 text-white/80 sm:mt-4 sm:text-base sm:leading-7 lg:text-lg lg:leading-8">
                Premium eSIMs with high-speed data in 200+ countries and regions.
                No SIM card. No roaming fees.
              </p>

              <div className="mt-5 flex w-full max-w-[620px] items-start gap-2.5 text-onSurface sm:mt-6 lg:mt-8">
                <div className="min-w-0 flex-1">
                  <HeroPackageSearch />
                </div>

                <HeroTuneButton />
              </div>

              <HeroDestinationChips />
            </div>

            <aside
              aria-label="eSIM preview"
              className="hidden flex-col gap-4 rounded-[24px] bg-surface/95 p-5 text-onSurface shadow-[0_24px_60px_rgba(6,17,49,0.35)] backdrop-blur-sm lg:flex"
            >
              <div className="flex items-center justify-between">
                <span className="text-label-caps uppercase text-onSurfaceVariant">Your eSIM</span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-brandTeal/15 px-2.5 py-1 text-xs font-bold text-[#04625F]">
                  <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-brandTeal" />
                  Connected
                </span>
              </div>

              <div className="flex items-center gap-3.5">
                <span className="grid h-12 w-12 place-items-center rounded-[14px] bg-brandInk font-mono text-sm text-white">
                  IT
                </span>
                <div>
                  <p className="font-display text-[22px] font-black tracking-[-0.02em] text-brandInk">Italy</p>
                  <p className="text-[13px] text-onSurfaceVariant">Activates when you land</p>
                </div>
              </div>

              <div aria-hidden="true" className="h-2 overflow-hidden rounded-full bg-outline/40">
                <div className="h-full w-[68%] rounded-full bg-brandBlue" />
              </div>

              <p className="text-[13px] font-semibold text-onSurfaceVariant">
                Install in minutes · 24/7 support
              </p>
            </aside>
          </div>

          {/* NASA imagery is public domain; NASA asks for a credit line. */}
          <p className="absolute bottom-2 right-4 text-[10px] font-medium text-white/55 lg:bottom-3 lg:right-6">
            Photo: NASA
          </p>
        </div>
      </div>

      <ul className="mx-auto grid max-w-[1240px] grid-cols-2 gap-x-4 gap-y-5 px-5 py-8 md:px-8 lg:grid-cols-4 lg:px-12">
        {heroPerks.map((perk) => {
          const Icon = perk.icon;

          return (
            <li className="flex items-center gap-3" key={perk.title}>
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brandBlue/[0.08] text-brandBlue lg:h-12 lg:w-12">
                <Icon aria-hidden="true" size={21} />
              </span>
              <div className="min-w-0">
                <p className="font-display text-sm font-extrabold text-brandInk lg:text-[17px]">{perk.title}</p>
                <p className="text-xs leading-5 text-onSurfaceVariant lg:text-sm">{perk.body}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function Benefits() {
  return (
    <section
      className="bg-surface px-5 py-10 text-onSurface md:px-8"
      id="benefits"
    >
      <div className="mx-auto max-w-[1280px]">
        <p className="mb-5 text-center text-label-caps uppercase text-brandBlue">
          Why travelers choose eSim2you
        </p>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:grid-rows-[repeat(2,minmax(140px,auto))]">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            const style = BENEFIT_TILES[index];

            return (
              <article
                className={`flex flex-col justify-end gap-4 rounded-[20px] p-5 ${style.tile}`}
                key={benefit.title}
              >
                <span
                  className={`grid h-12 w-12 shrink-0 place-items-center rounded-full ${style.icon}`}
                >
                  <Icon aria-hidden="true" size={24} />
                </span>

                <div>
                  <h3 className={`font-display font-black ${style.title}`}>
                    {benefit.title}
                  </h3>

                  <p className={`mt-1 text-sm leading-5 ${style.body}`}>
                    {benefit.description}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/** Bento tile styling per benefit index: gradient hero tile, two tinted tiles, one ink strip. */
const BENEFIT_TILES = [
  {
    tile: "bg-gradient-to-br from-brandBlue via-[#0E86C0] to-brandTeal text-white sm:col-span-2 lg:row-span-2 lg:p-8",
    icon: "bg-white/20 text-white",
    title: "text-white text-xl lg:text-3xl",
    body: "text-white lg:text-base lg:leading-7",
  },
  {
    tile: "border border-outline/70 bg-surfaceBright",
    icon: "bg-white text-brandBlue",
    title: "text-brandInk text-base",
    body: "text-onSurfaceVariant",
  },
  {
    tile: "border border-outline/70 bg-surfaceBright",
    icon: "bg-white text-brandBlue",
    title: "text-brandInk text-base",
    body: "text-onSurfaceVariant",
  },
  {
    tile: "bg-brandInk text-white sm:col-span-2 lg:col-span-2",
    icon: "bg-white/10 text-brandTeal",
    title: "text-white text-base",
    body: "text-white/80",
  },
] as const;

function HowItWorks() {
  return (
    <section
      className="overflow-hidden bg-surface px-5 py-14 text-onSurface md:px-8 md:py-20"
      id="how-it-works"
    >
      <div className="mx-auto max-w-[720px] text-center">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brandBlue">
          How it works
        </p>

        <h2 className="mt-2 font-display text-3xl font-black text-brandInk sm:text-4xl">
          Set up your eSIM in minutes
        </h2>

        <p className="mx-auto mt-3 max-w-[480px] text-sm text-onSurfaceVariant">
          No store visit, no physical SIM. Everything happens on your phone before you land.
        </p>
      </div>

      <div className="mx-auto mt-10 flex flex-col items-center gap-10 sm:mt-14 sm:flex-row sm:items-center sm:justify-center sm:gap-0">
        <Image
          alt="eSim2you app screens: destination list, United Kingdom plans and billing details"
          className="z-10 h-auto w-[320px] shrink-0 sm:-mr-6 sm:w-[452px]"
          height={1080}
          sizes="(min-width: 640px) 452px, 320px"
          src="/images/how-it-works-app-screens.png"
          width={1080}
        />
      </div>

      <div className="mx-auto mt-8 grid max-w-[720px] gap-8 sm:mt-4 sm:grid-cols-3 sm:gap-10">
        {installationSteps.map((step, index) => (
          <div className="text-center" key={step.title}>
            <span className="mb-2 inline-grid h-[22px] w-[22px] place-items-center rounded-full bg-brandBlue text-[11px] font-black text-white">
              {index + 1}
            </span>

            <h3 className="font-display text-sm font-black text-brandInk">{step.title}</h3>

            <p className="mt-1 text-[12.5px] leading-[1.4] text-onSurfaceVariant">{step.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function TrustAndFaq() {
  return (
    <section className="bg-surface px-5 py-10 text-onSurface md:px-8 md:py-14" id="faq">
      <div className="mx-auto max-w-[1280px]">
        <div className="text-center">
          <p className="text-label-caps uppercase text-brandBlue">Plan with confidence</p>

          <h2 className="mt-2 font-display text-3xl font-black tracking-[-0.03em] text-brandInk sm:text-4xl">
            Clear plans. Straightforward setup.
          </h2>
        </div>

        <div className="mt-7 grid gap-4 md:grid-cols-3">
          {[
            ["Live availability", "Compare current data, validity, network, and price on each destination page."],
            ["Ready before arrival", "Install on Wi-Fi before departure and enable travel data when you land."],
            ["Help when needed", "Use the support center for setup, data, top-up, and refund questions."]
          ].map(([title, description]) => (
            <article className="rounded-[20px] border border-outline/70 bg-surfaceBright p-5 sm:p-6" key={title}>
              <h3 className="font-display text-lg font-black text-brandInk">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-onSurfaceVariant">{description}</p>
            </article>
          ))}
        </div>

        <div className="mx-auto mt-10 max-w-3xl">
          <p className="text-center text-label-caps uppercase text-brandBlue">
            Quick answers before you travel
          </p>
          <div className="mt-5 space-y-3">
            {landingContent.faqs.map((faq) => (
              <details className="group rounded-[16px] border border-outline/70 bg-surface px-5 py-2" key={faq.question}>
                <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 py-2 font-display font-black text-brandInk">
                  {faq.question}
                  <CircleHelp
                    aria-hidden="true"
                    className="shrink-0 text-brandBlue motion-safe:transition group-open:rotate-45"
                    size={20}
                  />
                </summary>
                <p className="pb-3 pt-1 leading-7 text-onSurfaceVariant">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/** App download + partner promo: two cards on one row at lg, stacked on phones. */
function AppAndPartner() {
  return (
    <div className="bg-surface px-5 py-10 text-onSurface md:px-8 md:py-14">
      <div className="mx-auto grid max-w-[1280px] gap-5 lg:grid-cols-[1.35fr_1fr]">
        <AppDownload />
        <PartnerPromo />
      </div>
    </div>
  );
}

function AppDownload() {
  return (
    <section
      className="relative min-w-0 overflow-hidden rounded-[24px] border border-outline/70 bg-surfaceBright p-6 sm:p-8"
      id="download-app"
    >
      <div className="relative z-20">
        <p className="text-label-caps uppercase text-brandBlue">eSim2you in your pocket</p>

        <h2 className="mt-3 font-display text-3xl font-black leading-[1.08] tracking-[-0.04em] text-brandInk sm:text-4xl">
          Download the App.
          <br />

          <span className="bg-gradient-to-r from-brandBlue to-brandTeal bg-clip-text text-transparent">
            Stay Connected Anywhere.
          </span>
        </h2>

        <p className="mt-4 max-w-[520px] text-sm leading-7 text-onSurfaceVariant sm:text-base">
          Purchase, install and manage your eSIM directly from your
          phone. Track your data usage and top up wherever your journey
          takes you.
        </p>

        <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3">
          {[
            "Instant eSIM activation",
            "Real-time data tracking",
            "Secure in-app purchases"
          ].map((feature) => (
            <div
              className="flex items-center gap-2 text-xs font-semibold text-onSurfaceVariant"
              key={feature}
            >
              <span className="grid h-5 w-5 place-items-center rounded-full border border-brandBlue/40 bg-brandBlue/10 text-brandBlue">
                <Check aria-hidden="true" size={11} strokeWidth={2.5} />
              </span>

              {feature}
            </div>
          ))}
        </div>

        {/* Store buttons: the accessible name starts with the visible text (label-in-name). */}
        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <a
            aria-label="Download on the App Store, eSim2you"
            className="group flex h-[64px] min-w-0 items-center gap-3 rounded-[16px] border border-outline bg-surface px-5 transition duration-300 hover:border-brandBlue/50 hover:bg-brandBlue/5 sm:min-w-[210px]"
            href="https://apps.apple.com/app/id6768258284"
          >
            <svg
              aria-hidden="true"
              className="h-8 w-8 shrink-0 fill-brandInk"
              viewBox="0 0 24 24"
            >
              <path d="M18.71 12.5c.03-2.3 1.88-3.4 1.97-3.45-1.07-1.57-2.74-1.78-3.33-1.8-1.4-.15-2.76.84-3.47.84-.72 0-1.81-.82-2.98-.79-1.51.02-2.93.9-3.71 2.27-1.62 2.8-.41 6.92 1.14 9.19.78 1.1 1.69 2.33 2.86 2.29 1.15-.05 1.58-.74 2.97-.74 1.37 0 1.78.74 2.98.71 1.23-.02 2.01-1.1 2.76-2.21.9-1.27 1.26-2.52 1.28-2.59-.03-.01-2.44-.95-2.47-3.72ZM16.43 5.77a3.84 3.84 0 0 0 .88-2.77 3.9 3.9 0 0 0-2.55 1.32 3.67 3.67 0 0 0-.91 2.67 3.22 3.22 0 0 0 2.58-1.22Z" />
            </svg>

            <span className="text-left">
              <span className="block text-xs font-medium leading-none text-onSurfaceVariant">
                Download on the
              </span>
              {" "}
              <span className="mt-1 block font-display text-lg font-black leading-none text-brandInk">
                App Store
              </span>
            </span>
          </a>

          <a
            aria-label="Get it on Google Play, eSim2you"
            className="group flex h-[64px] min-w-0 items-center gap-3 rounded-[16px] border border-outline bg-surface px-5 transition duration-300 hover:border-brandBlue/50 hover:bg-brandBlue/5 sm:min-w-[210px]"
            href="https://play.google.com/store/apps/details?id=com.uplisoft.velocityesim"
          >
            <svg
              aria-hidden="true"
              className="h-8 w-8 shrink-0"
              viewBox="0 0 24 24"
            >
              <path
                d="M3.6 2.55c-.37.39-.6.98-.6 1.74v15.42c0 .76.23 1.35.6 1.74l.09.08 8.64-8.64v-.2L3.69 2.46l-.09.09Z"
                fill="#41D691"
              />

              <path
                d="m15.21 15.78-2.88-2.89v-.2l2.89-2.89.06.04 3.43 1.95c.98.56.98 1.47 0 2.03l-3.43 1.95-.07.01Z"
                fill="#FFCC00"
              />

              <path
                d="m15.28 15.77-2.95-2.98-8.73 8.73c.32.34.86.38 1.47.04l10.21-5.79Z"
                fill="#F34A45"
              />

              <path
                d="M15.28 9.82 5.07 4.03c-.61-.35-1.15-.3-1.47.04l8.73 8.72 2.95-2.97Z"
                fill="#2AA4F4"
              />
            </svg>

            <span className="text-left">
              <span className="block text-xs font-medium leading-none text-onSurfaceVariant">
                Get it on
              </span>
              {" "}
              <span className="mt-1 block font-display text-lg font-black leading-none text-brandInk">
                Google Play
              </span>
            </span>
          </a>
        </div>
      </div>

      <div className="relative mt-6 flex justify-center">
        <Image
          alt="eSim2you mobile application"
          className="relative z-10 h-auto max-h-[300px] w-full max-w-[420px] object-contain object-bottom"
          height={800}
          sizes="(min-width: 1024px) 420px, 100vw"
          src="/images/app-download-phones.png"
          width={1200}
        />
      </div>
    </section>
  );
}

function PartnerPromo() {
  return (
    <section
      className="flex min-w-0 flex-col justify-between gap-8 rounded-[24px] border border-outline/70 bg-surface p-6 shadow-brandCard sm:p-8"
      id="partner-with-us"
    >
      <div>
        <p className="text-label-caps uppercase text-brandBlue">eSim2you partner program</p>

        <h2 className="mt-3 font-display text-2xl font-black leading-[1.1] tracking-[-0.03em] text-brandInk sm:text-3xl">
          Earn commission referring travelers to eSim2you
        </h2>

        <p className="mt-4 text-sm leading-6 text-onSurfaceVariant sm:text-base">
          Hotels, travel agencies, creators, and drivers can get a personal promo code and
          earn commission on every booking it brings in. Apply in a couple of minutes.
        </p>
      </div>

      <LinkButton className="w-full sm:w-auto sm:self-start sm:px-7" href="/partners/request">
        Become a partner
        <ArrowRight aria-hidden="true" size={16} />
      </LinkButton>
    </section>
  );
}

function Cta() {
  return (
    <section className="bg-surface px-5 pb-16 pt-6 text-onSurface md:px-8 md:pt-10" id="download">
      <div className="mx-auto flex max-w-[1280px] flex-col justify-center gap-7 rounded-[24px] bg-gradient-to-br from-brandInk via-brandBlue to-[#0E86C0] px-7 py-10 shadow-brandGlow md:flex-row md:items-center md:justify-between md:px-12 md:py-12">
        <div className="max-w-[560px]">
          <h2 className="font-display text-3xl font-black tracking-[-0.03em] text-white md:text-[38px] md:leading-[1.08]">
            Ready to Stay Connected Anywhere?
          </h2>

          <p className="mt-3 text-sm leading-6 text-white/80 md:text-base">
            Choose a live travel data plan and get connected before your trip.
          </p>
        </div>

        <LinkButton
          className="w-full ring-2 ring-white/70 md:w-auto md:min-w-[250px]"
          href="#download-app"
          size="lg"
        >
          Get eSIM Now
          <ArrowRight aria-hidden="true" size={20} />
        </LinkButton>
      </div>
    </section>
  );
}
