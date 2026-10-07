import { ArrowRight, Plus } from "lucide-react";
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
import { DestinationBrowse } from "./destinations/DestinationBrowse";

const installationSteps = [
  {
    title: "Pick where you're going",
    description: "Choose a plan by how much data you need and how long you're away."
  },
  {
    title: "Install it before you go",
    description: "Scan the QR code from your order email while you're still on home Wi-Fi."
  },
  {
    title: "Turn it on when you land",
    description: "Switch data to the eSIM and you're online. Check usage or top up from the app."
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
      <HowItWorks />
      <Testimonials items={testimonials} />
      <TrustAndFaq />
      <PartnerBand />
      <SiteFooter />
    </main>
  );
}

const HERO_PHOTO_ALT =
  "Southern Italy at night with sunrise breaking over the horizon, photographed from the International Space Station";

const heroPerks = [
  "Prepaid, so no roaming bill later",
  "Keep your number for calls and WhatsApp",
  "Real people on chat, any time"
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
          <div className="relative mx-auto grid max-w-[1240px] gap-10 px-5 pb-8 pt-[184px] sm:pt-[240px] md:px-8 md:pt-[300px] lg:px-12 lg:pb-14 lg:pt-[148px]">
            <div className="min-w-0 max-w-[760px]">
              <h1 className="font-display text-[30px] font-black leading-[1.05] tracking-[-0.04em] text-white text-balance sm:text-[48px] lg:text-[60px] xl:text-[68px]">
                Your phone works the minute you land.
              </h1>

              <p className="mt-3 max-w-[520px] text-sm leading-6 text-white/80 sm:mt-4 sm:text-base sm:leading-7 lg:text-lg lg:leading-8">
                Data plans for 200+ countries. Install the eSIM before you go
                and skip the roaming bill.
              </p>

              <div className="mt-5 flex w-full max-w-[620px] items-start gap-2.5 text-onSurface sm:mt-6 lg:mt-8">
                <div className="min-w-0 flex-1">
                  <HeroPackageSearch />
                </div>

                <HeroTuneButton />
              </div>

              <HeroAppBadges />
            </div>

          </div>

        </div>
      </div>

      <ul className="mx-auto flex max-w-[1240px] flex-wrap gap-x-8 gap-y-2 px-5 py-6 text-sm text-onSurfaceVariant md:px-8 lg:px-12">
        {heroPerks.map((perk) => (
          <li key={perk}>{perk}</li>
        ))}
      </ul>
    </section>
  );
}

function HowItWorks() {
  return (
    <section
      className="overflow-hidden bg-surface px-5 py-10 text-onSurface md:px-8 md:py-20"
      id="how-it-works"
    >
      <div className="mx-auto max-w-[720px] sm:text-center">
        <h2 className="font-display text-3xl font-black text-brandInk sm:text-4xl">
          How it works
        </h2>

        <p className="mt-2 max-w-[480px] text-sm text-onSurfaceVariant sm:mx-auto sm:mt-3">
          No shop, no plastic SIM. It takes about five minutes on your phone.
        </p>
      </div>

      {/* The square PNG only has phones in its middle band (y 169-910 of
          1080); a 17:12 box with object-cover crops the empty top and bottom. */}
      <div className="relative mx-auto mt-6 aspect-[17/12] w-full max-w-[360px] sm:mt-10 sm:max-w-[452px]">
        <Image
          alt="eSim2you app screens: destination list, United Kingdom plans and billing details"
          className="object-cover"
          fill
          sizes="(min-width: 640px) 452px, 360px"
          src="/images/how-it-works-app-screens.png"
        />
      </div>

      <ol className="mx-auto mt-6 grid max-w-[720px] gap-5 sm:mt-8 sm:grid-cols-3 sm:gap-10">
        {installationSteps.map((step, index) => (
          <li className="flex gap-3.5 sm:block sm:text-center" key={step.title}>
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brandBlue text-xs font-black text-white sm:mx-auto sm:mb-2 sm:h-[22px] sm:w-[22px] sm:text-[11px]">
              {index + 1}
            </span>

            <div className="min-w-0">
              <h3 className="font-display text-base font-black text-brandInk sm:text-sm">{step.title}</h3>

              <p className="mt-0.5 text-sm leading-5 text-onSurfaceVariant sm:mt-1 sm:text-[12.5px] sm:leading-[1.4]">{step.description}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function TrustAndFaq() {
  return (
    <section className="bg-surface px-5 py-10 text-onSurface md:px-8 md:py-14" id="faq">
      <div className="mx-auto max-w-[1280px]">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center font-display text-3xl font-black tracking-[-0.03em] text-brandInk sm:text-4xl">
            Questions people ask
          </h2>
          <div className="mt-5 space-y-3">
            {landingContent.faqs.map((faq) => (
              <details className="group rounded-[16px] border border-outline/70 bg-surface px-5 py-2" key={faq.question}>
                <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 py-2 font-display font-black text-brandInk">
                  {faq.question}
                  <Plus
                    aria-hidden="true"
                    className="shrink-0 text-onSurfaceVariant motion-safe:transition group-open:rotate-45"
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

/**
 * App Store / Google Play buttons inside the dark hero, under the search, on
 * every size: the app is a first-screen choice, not a section further down.
 * Dark glass so they stay secondary to the search. #download-app is the
 * anchor old links and the landing tests point at.
 */
function HeroAppBadges() {
  return (
    <div className="mt-4 w-full max-w-[620px] sm:mt-5" id="download-app">
      <div className="flex items-center gap-3 lg:hidden">
        <span aria-hidden="true" className="h-px flex-1 bg-white/20" />
        <span className="text-sm text-white/75">or get the app</span>
        <span aria-hidden="true" className="h-px flex-1 bg-white/20" />
      </div>

      {/* Store buttons: the accessible name starts with the visible text (label-in-name). */}
      <div className="mt-3 grid grid-cols-1 gap-2.5 min-[360px]:grid-cols-2 lg:mt-0 lg:flex lg:items-center lg:gap-3">
        <span className="hidden text-sm text-white/75 lg:mr-1 lg:block">Or get the app</span>
        <a
          aria-label="Download on the App Store, eSim2you"
          className="flex h-[52px] min-w-0 items-center gap-2 rounded-[14px] border border-white/25 bg-white/[0.08] px-3 text-white transition duration-300 hover:border-white/45 hover:bg-white/15 min-[400px]:gap-2.5 min-[400px]:px-3.5 sm:px-4"
          href="https://apps.apple.com/app/id6768258284"
        >
          <svg
            aria-hidden="true"
            className="h-6 w-6 shrink-0 fill-white"
            viewBox="0 0 24 24"
          >
            <path d="M18.71 12.5c.03-2.3 1.88-3.4 1.97-3.45-1.07-1.57-2.74-1.78-3.33-1.8-1.4-.15-2.76.84-3.47.84-.72 0-1.81-.82-2.98-.79-1.51.02-2.93.9-3.71 2.27-1.62 2.8-.41 6.92 1.14 9.19.78 1.1 1.69 2.33 2.86 2.29 1.15-.05 1.58-.74 2.97-.74 1.37 0 1.78.74 2.98.71 1.23-.02 2.01-1.1 2.76-2.21.9-1.27 1.26-2.52 1.28-2.59-.03-.01-2.44-.95-2.47-3.72ZM16.43 5.77a3.84 3.84 0 0 0 .88-2.77 3.9 3.9 0 0 0-2.55 1.32 3.67 3.67 0 0 0-.91 2.67 3.22 3.22 0 0 0 2.58-1.22Z" />
          </svg>

          <span className="text-left">
            <span className="block whitespace-nowrap text-xs font-medium leading-none text-white/75">
              Download on the
            </span>
            {" "}
            <span className="mt-1 block whitespace-nowrap font-display text-base font-black leading-none text-white">
              App Store
            </span>
          </span>
        </a>

        <a
          aria-label="Get it on Google Play, eSim2you"
          className="flex h-[52px] min-w-0 items-center gap-2 rounded-[14px] border border-white/25 bg-white/[0.08] px-3 text-white transition duration-300 hover:border-white/45 hover:bg-white/15 min-[400px]:gap-2.5 min-[400px]:px-3.5 sm:px-4"
          href="https://play.google.com/store/apps/details?id=com.uplisoft.velocityesim"
        >
          <svg
            aria-hidden="true"
            className="h-[22px] w-[22px] shrink-0"
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
            <span className="block whitespace-nowrap text-xs font-medium leading-none text-white/75">
              Get it on
            </span>
            {" "}
            <span className="mt-1 block whitespace-nowrap font-display text-base font-black leading-none text-white">
              Google Play
            </span>
          </span>
        </a>
      </div>
    </div>
  );
}

/** Partner promo on its own row near the end of the page. */
function PartnerBand() {
  return (
    <div className="bg-surface px-5 py-10 text-onSurface md:px-8 md:py-14">
      <div className="mx-auto max-w-[1280px]">
        <PartnerPromo />
      </div>
    </div>
  );
}

function PartnerPromo() {
  return (
    <section
      className="flex min-w-0 flex-col gap-6 self-start rounded-[24px] border border-outline/70 bg-surface p-6 sm:p-8"
      id="partner-with-us"
    >
      <div>
        <h2 className="font-display text-2xl font-black leading-[1.1] tracking-[-0.03em] text-brandInk sm:text-3xl">
          Send travelers our way, earn on every booking
        </h2>

        <p className="mt-4 text-sm leading-6 text-onSurfaceVariant sm:text-base">
          Run a hotel, travel agency or travel channel, or drive tourists around?
          Get your own promo code and a cut of every eSIM it sells.
        </p>
      </div>

      <LinkButton className="w-full sm:w-auto sm:self-start sm:px-7" href="/partners/request" variant="tint">
        Become a partner
        <ArrowRight aria-hidden="true" size={16} />
      </LinkButton>
    </section>
  );
}

