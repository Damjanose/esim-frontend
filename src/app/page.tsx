import {
  ArrowRight,
  Check,
  Globe2,
  Headphones,
  ShieldCheck,
  Star,
  Zap,
} from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";

import { JsonLd } from "./JsonLd";
import { SiteFooter } from "./SiteFooter";

import { Navbar } from './components/Navbar'
import { LinkButton } from "./components/Button";
import { createLandingJsonLd, createMetadata } from "@/lib/seo";
import { HeroPackageSearch } from "./HeroPackageSearch";
import { HeroDestinationChips } from "./HeroDestinationChips";
import { DestinationBrowse } from "./destinations/DestinationBrowse";

const travelerImages = [
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&h=120&q=85",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&h=120&q=85",
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&h=120&q=85",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&h=120&q=85",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=120&h=120&q=85"
];

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

const testimonials = [
  {
    quote:
      "eSim2you made my Japan trip so easy. The installation was quick and the connection stayed fast throughout the trip.",
    name: "Sophia R.",
    country: "USA",
    image:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&h=120&q=85"
  },
  {
    quote:
      "The best eSIM service I have used. It was affordable, reliable and very easy to activate before my flight.",
    name: "Aisha M.",
    country: "Canada",
    image:
      "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=120&h=120&q=85"
  }
];

export const metadata: Metadata = createMetadata({
  path: "/",
  title: "eSim2you | Travel Data for 200+ Destinations",
  description:
    "Buy a digital SIM for 200+ destinations, install it in minutes, and skip surprise roaming fees."
});

export default function Home() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-surface text-onSurface">
      <JsonLd data={createLandingJsonLd()} />

      <Navbar theme="dark" />
      <Hero />
      <DestinationBrowse autoOpenWizard urlFilters={{}} />
      <Benefits />
      <HowItWorks />
      <TestimonialsAndFaq />
      <AppDownload />
      <PartnerPromo />
      <Cta />
      <SiteFooter />
    </main>
  );
}

function Hero() {
  return (
    <section className="relative isolate z-20 overflow-hidden bg-brandInk text-white" id="home">
      <Image
        alt="Mountain traveler destination at dusk"
        className="pointer-events-none absolute inset-0 -z-20 h-full w-full object-cover"
        fill
        priority
        sizes="100vw"
        src="/images/mountain.webp"
      />

      <div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(6,17,49,0.55)_0%,rgba(6,17,49,0.72)_55%,rgba(6,17,49,0.92)_100%)]" />

      <div className="mx-auto flex min-h-[640px] max-w-[1180px] flex-col items-center justify-center px-5 pb-16 pt-28 text-center md:px-8">
        <h1 className="max-w-[720px] font-display text-[38px] font-black leading-[1.08] tracking-[-0.04em] sm:text-[52px] lg:text-[62px]">
          A better way to stay
          <br />
          connected while you travel
        </h1>

        <p className="mt-5 max-w-[540px] text-[15px] leading-7 text-white/80 sm:text-base">
          Premium eSIMs with high-speed data in 200+ countries and regions.
          Instant activation. No SIM card. No roaming fees.
        </p>

        <div className="mt-8 w-full max-w-[620px]">
          <HeroPackageSearch />
        </div>

        <HeroDestinationChips />

        <HeroTrustSignals />
      </div>
    </section>
  );
}

function HeroTrustSignals() {
  return (
    <div className="mt-9 flex flex-col items-center gap-5 sm:flex-row sm:gap-7">
      <div>
        <p className="mb-3 text-xs font-medium text-white/70">
          Trusted by travelers from
        </p>

        <div className="flex justify-center -space-x-2">
          {travelerImages.map((image, index) => (
            <div
              className="h-10 w-10 overflow-hidden rounded-full border-2 border-white/80 bg-outline/20 shadow-[0_6px_14px_rgba(0,0,0,0.25)]"
              key={image}
            >
              <Image
                alt={`eSim2you traveler ${index + 1}`}
                className="h-full w-full object-cover"
                height={40}
                loading="lazy"
                referrerPolicy="no-referrer"
                src={image}
                width={40}
              />
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs text-white/70">
          and 50,000+ reviews
        </p>

        <div className="flex items-center justify-center gap-3">
          <div className="flex gap-1">
            {Array.from({ length: 5 }).map((_, index) => (
              <span
                className="grid h-[18px] w-[18px] place-items-center rounded-[4px] bg-[#00b67a]"
                key={index}
              >
                <Star
                  aria-hidden="true"
                  className="fill-white text-white"
                  size={11}
                />
              </span>
            ))}
          </div>

          <span className="text-xs font-semibold text-white">
            4.8/5
          </span>
        </div>
      </div>
    </div>
  );
}

function Benefits() {
  return (
    <section
      className="bg-surface px-5 py-10 text-onSurface md:px-8"
      id="benefits"
    >
      <div className="mx-auto max-w-[1280px]">
        <p className="mb-5 text-center text-[10px] font-black uppercase tracking-[0.2em] text-brandBlue">
          Why travelers choose eSim2you
        </p>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {benefits.map((benefit) => {
            const Icon = benefit.icon;

            return (
              <article
                className="rounded-2xl border border-outline bg-surface p-5 shadow-brandCard"
                key={benefit.title}
              >
                <div className="flex items-center gap-4">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[radial-gradient(circle_at_35%_30%,#0E86C0,#0B49B7)] text-white shadow-[0_0_26px_rgba(11,73,183,0.21)]">
                    <Icon aria-hidden="true" size={24} />
                  </span>

                  <div>
                    <h3 className="font-display text-base font-black text-brandInk">
                      {benefit.title}
                    </h3>

                    <p className="mt-1 text-xs leading-5 text-onSurfaceVariant">
                      {benefit.description}
                    </p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

const marketplaceRows = [
  { code: "af", country: "Afghanistan", plans: "5 plans · up to 10GB", price: "€4.73" },
  { code: "al", country: "Albania", plans: "12 plans · Unlimited", price: "€3.44" },
  { code: "dz", country: "Algeria", plans: "12 plans · Unlimited", price: "€3.87" },
  { code: "ad", country: "Andorra", plans: "12 plans · Unlimited", price: "€3.87" }
];

function PhoneFrame({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`relative h-[452px] w-[216px] shrink-0 rounded-[36px] bg-brandInk p-[11px] shadow-[0_24px_50px_rgba(6,17,49,0.28)] ${className}`}
    >
      <span className="absolute left-1/2 top-[11px] z-10 h-[18px] w-[84px] -translate-x-1/2 rounded-b-xl bg-brandInk" />

      <div className="relative flex h-full w-full flex-col overflow-hidden rounded-[26px] bg-white">
        {children}
      </div>
    </div>
  );
}

function PhoneStatusBar() {
  return (
    <div className="flex justify-between px-3.5 pb-1 pt-6 text-[9.5px] font-bold text-onSurfaceVariant">
      <span>9:41</span>
      <span>●●●●&nbsp;&nbsp;📶&nbsp;&nbsp;🔋</span>
    </div>
  );
}

function ChoosePlanScreen() {
  return (
    <>
      <div
        className="relative h-[152px] bg-cover bg-top"
        style={{ backgroundImage: "url('/images/how-it-works-marketplace.jpg')" }}
      >
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent from-70% to-brandInk/35" />

        <span className="absolute right-3 top-[30px] grid h-[26px] w-[26px] place-items-center overflow-hidden rounded-full border-2 border-white/85 bg-white">
          <Image alt="United States flag" className="h-full w-full object-cover" height={26} src="https://flagcdn.com/w80/us.png" unoptimized width={26} />
        </span>
      </div>

      <div className="relative z-[3] -mt-5 mx-3 flex items-center gap-1.5 rounded-2xl border border-outline bg-white/95 px-3 py-2 text-[9px] text-onSurfaceVariant shadow-[0_8px_20px_rgba(6,17,49,0.12)] backdrop-blur">
        🔍 Search countries or region
      </div>

      <div className="mx-3 mb-2 mt-2 flex gap-1.5 overflow-hidden">
        <span className="whitespace-nowrap rounded-xl border border-outline px-2 py-1 text-[8px] font-extrabold text-onSurfaceVariant">Favorites 3</span>
        <span className="whitespace-nowrap rounded-xl border border-brandBlue bg-brandBlue px-2 py-1 text-[8px] font-extrabold text-white">Countries 204</span>
        <span className="whitespace-nowrap rounded-xl border border-outline px-2 py-1 text-[8px] font-extrabold text-onSurfaceVariant">Popular 8</span>
      </div>

      <div className="flex flex-1 flex-col gap-1.5 overflow-hidden px-3">
        {marketplaceRows.map((row) => (
          <div className="flex items-center gap-2 rounded-[13px] border border-outline px-2.5 py-2" key={row.code}>
            <span className="grid h-[22px] w-[22px] shrink-0 place-items-center overflow-hidden rounded-full bg-[#eef0f7]">
              <Image alt={`${row.country} flag`} className="h-full w-full object-cover" height={22} src={`https://flagcdn.com/w80/${row.code}.png`} unoptimized width={22} />
            </span>

            <div className="min-w-0 flex-1">
              <b className="block truncate font-display text-[10px] font-black text-brandInk">{row.country}</b>
              <span className="text-[8px] text-onSurfaceVariant">{row.plans}</span>
            </div>

            <div className="shrink-0 text-right">
              <small className="block text-[6.5px] font-bold text-onSurfaceVariant">FROM</small>
              <b className="font-display text-[10px] font-black text-brandBlue">{row.price}</b>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-auto flex items-center justify-around border-t border-outline px-2.5 pb-3 pt-2">
        <span className="flex flex-col items-center gap-0.5 text-[7.5px] text-onSurfaceVariant">
          <span className="text-xs">🏠</span>Plans
        </span>

        <span className="-mt-[18px] grid h-[34px] w-[34px] place-items-center rounded-full border-[3px] border-white bg-brandBlue text-sm text-white shadow-[0_8px_18px_rgba(11,73,183,0.4)]">
          🏪
        </span>

        <span className="flex flex-col items-center gap-0.5 text-[7.5px] text-onSurfaceVariant">
          <span className="text-xs">👤</span>Profile
        </span>
      </div>
    </>
  );
}

function ScanInstallScreen() {
  return (
    <>
      <PhoneStatusBar />

      <p className="px-3.5 pb-2.5 font-display text-sm font-black text-brandInk">Scan to activate</p>

      <div className="mx-3.5 flex flex-col items-center gap-2 rounded-2xl border border-brandBlue/20 bg-gradient-to-br from-brandBlue/[0.06] to-brandTeal/[0.06] p-3.5 text-center">
        <p className="flex items-center gap-1.5 font-display text-[10px] font-black text-brandInk">
          <Image alt="Italy flag" className="inline-block h-[13px] w-[13px] rounded-full object-cover align-[-2px]" height={13} src="https://flagcdn.com/w80/it.png" unoptimized width={13} />
          Italy · Unlimited / 7 days
        </p>

        <div className="rounded-[10px] bg-white p-1.5 shadow-[0_8px_20px_rgba(6,17,49,0.12)]">
          <Image alt="QR code linking to esim.uplisoft.com" className="h-[118px] w-[118px]" height={118} src="/images/qr-esim-uplisoft.svg" unoptimized width={118} />
        </div>

        <p className="max-w-[160px] text-[9.5px] leading-[1.4] text-onSurfaceVariant">
          Scan with your phone&apos;s camera to open Settings and install this eSIM.
        </p>

        <span className="flex items-center gap-1 rounded-full bg-brandTeal/10 px-2.5 py-1 text-[9.5px] font-extrabold text-brandTeal">
          ⟳ Installing eSIM…
        </span>
      </div>

      <ul className="mx-3.5 mt-3.5 flex flex-col gap-1.5">
        {["Settings → Cellular → Add eSIM", "Scan the QR code above", "Confirm and you're connected"].map((line) => (
          <li className="flex items-center gap-1.5 text-[9px] text-onSurfaceVariant" key={line}>
            <span className="h-[5px] w-[5px] shrink-0 rounded-full bg-brandBlue" />
            {line}
          </li>
        ))}
      </ul>
    </>
  );
}

function ConnectedScreen() {
  return (
    <>
      <PhoneStatusBar />

      <p className="px-3.5 pb-2.5 font-display text-sm font-black text-brandInk">My eSIMs</p>

      <div className="flex flex-col gap-2.5 px-3.5 pb-3.5">
        <div className="rounded-2xl border border-brandBlue/20 bg-gradient-to-br from-brandBlue/[0.06] to-brandTeal/[0.06] p-3">
          <div className="mb-2 flex items-center gap-2">
            <Image alt="Italy flag" className="h-4 w-4 rounded-full object-cover" height={16} src="https://flagcdn.com/w80/it.png" unoptimized width={16} />
            <b className="font-display text-[11.5px] font-black text-brandInk">Italy · 5GB / 7 days</b>
            <span className="ml-auto rounded-full bg-brandTeal px-1.5 py-0.5 text-[8.5px] font-extrabold text-white">ACTIVE</span>
          </div>

          <div className="h-1.5 overflow-hidden rounded-full bg-outline">
            <div className="h-full w-[62%] bg-gradient-to-r from-brandBlue to-brandTeal" />
          </div>

          <div className="mt-1.5 flex justify-between text-[9px] text-onSurfaceVariant">
            <span>3.1 GB used</span>
            <span>4 days left</span>
          </div>

          <p className="mt-2.5 text-[8.5px] text-onSurfaceVariant">eSim2you · Data plan</p>
        </div>

        <div className="rounded-2xl border border-outline/70 bg-outline/10 p-3 opacity-55">
          <div className="mb-2 flex items-center gap-2">
            <Image alt="France flag" className="h-4 w-4 rounded-full object-cover" height={16} src="https://flagcdn.com/w80/fr.png" unoptimized width={16} />
            <b className="font-display text-[11.5px] font-black text-brandInk">France · 10GB / 15 days</b>
            <span className="ml-auto rounded-full bg-outline px-1.5 py-0.5 text-[8.5px] font-extrabold text-onSurfaceVariant">EXPIRED</span>
          </div>

          <div className="flex justify-between text-[9px] text-onSurfaceVariant">
            <span>Used 9.4 GB</span>
            <span>Expired</span>
          </div>
        </div>
      </div>
    </>
  );
}

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
        <PhoneFrame className="z-10 sm:-mr-6 sm:translate-y-2 sm:-rotate-[7deg]">
          <ChoosePlanScreen />
        </PhoneFrame>

        <PhoneFrame className="z-20">
          <ScanInstallScreen />
        </PhoneFrame>

        <PhoneFrame className="z-10 sm:-ml-6 sm:translate-y-2 sm:rotate-[7deg]">
          <ConnectedScreen />
        </PhoneFrame>
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

function TestimonialsAndFaq() {
  return (
    <section className="relative overflow-hidden bg-surface px-5 py-10 text-onSurface md:px-8">
      <div className="relative mx-auto max-w-[1280px]">
        <div className="text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brandBlue">
            Trusted by travelers
          </p>

          <h2 className="mt-2 font-display text-3xl font-black tracking-[-0.03em] text-brandInk sm:text-4xl">
            Loved by Millions Around the World
          </h2>
        </div>

        <div className="mt-7 grid items-stretch gap-5 md:grid-cols-[0.82fr_1fr_1fr]">
          <div className="relative hidden min-h-[285px] md:block">
            <img
              alt="eSim2you mobile applications"
              className="pointer-events-none absolute bottom-[-5px] left-1/2 h-[116%] w-[142%] max-w-none -translate-x-1/2 object-contain object-bottom drop-shadow-[0_24px_32px_rgba(0,0,0,0.45)]"
              loading="lazy"
              src="/images/2-iphones.png"
            />
          </div>

          {testimonials.slice(0, 2).map((testimonial) => (
            <article
              className="group relative flex min-h-[285px] flex-col overflow-hidden rounded-[18px] border border-outline bg-surface p-6 shadow-brandCard transition duration-300 hover:-translate-y-1 hover:border-brandBlue/40 hover:shadow-brandGlow"
              key={testimonial.name}
            >
              <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-brandBlue/30 to-transparent" />

              <span
                aria-hidden="true"
                className="relative font-display text-[42px] font-black leading-none text-onSurfaceVariant/35"
              >
                “
              </span>

              <p className="relative mt-2 flex-1 text-sm font-medium leading-7 text-onSurface">
                {testimonial.quote}
              </p>

              <div className="relative mt-6 flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <Image
                    alt={testimonial.name}
                    className="h-11 w-11 shrink-0 rounded-full border border-outline object-cover shadow-[0_8px_20px_rgba(0,0,0,0.12)]"
                    height={44}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    src={testimonial.image}
                    width={44}
                  />

                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-onSurface">
                      {testimonial.name}
                    </p>

                    <p className="mt-0.5 text-[10px] text-onSurfaceVariant">
                      {testimonial.country}
                    </p>
                  </div>
                </div>

                <div
                  aria-label="5 out of 5 stars"
                  className="flex shrink-0 gap-0.5"
                >
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star
                      aria-hidden="true"
                      className="fill-[#ffca28] text-[#ffca28]"
                      key={index}
                      size={14}
                      strokeWidth={1.5}
                    />
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function AppDownload() {
  return (
    <section
      className="relative overflow-hidden bg-surface px-5 py-16 text-onSurface md:px-8 md:py-24"
      id="download-app"
    >
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[70%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brandBlue/6 blur-[130px]" />

      <div className="relative mx-auto max-w-[1280px]">
        <div className="relative overflow-hidden rounded-[26px] border border-outline bg-surface shadow-brandCard">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_75%_45%,rgba(11,73,183,0.11),transparent_42%)]" />

          <div className="pointer-events-none absolute inset-x-20 top-0 h-px bg-gradient-to-r from-transparent via-brandBlue/30 to-transparent" />

          <div className="relative grid min-h-[390px] items-center gap-10 px-7 py-12 sm:px-10 lg:grid-cols-[0.95fr_1.05fr] lg:px-16 lg:py-14">
            {/* Content */}
            <div className="relative z-20 max-w-[570px]">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-brandBlue">
                eSim2you in your pocket
              </p>

              <h2 className="mt-3 font-display text-3xl font-black leading-[1.08] tracking-[-0.04em] text-brandInk sm:text-4xl lg:text-[46px]">
                Download the App.
                <br />

                <span className="bg-gradient-to-r from-brandBlue to-brandTeal bg-clip-text text-transparent">
                  Stay Connected Anywhere.
                </span>
              </h2>

              <p className="mt-5 max-w-[520px] text-sm leading-7 text-onSurfaceVariant sm:text-base">
                Purchase, install and manage your eSIM directly from your
                phone. Track your data usage and top up wherever your journey
                takes you.
              </p>

              <div className="mt-7 flex flex-wrap gap-x-6 gap-y-3">
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

              {/* Store buttons */}
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <a
                  aria-label="Download eSim2you on the App Store"
                  className="group flex h-[64px] min-w-[210px] items-center gap-3 rounded-[16px] border border-outline bg-surface px-5 shadow-brandCard transition duration-300 hover:-translate-y-1 hover:border-brandBlue/50 hover:bg-brandBlue/5"
                  href="https://apps.apple.com/am/app/velocityesim/id6768258284"
                >
                  <svg
                    aria-hidden="true"
                    className="h-8 w-8 shrink-0 fill-brandInk"
                    viewBox="0 0 24 24"
                  >
                    <path d="M18.71 12.5c.03-2.3 1.88-3.4 1.97-3.45-1.07-1.57-2.74-1.78-3.33-1.8-1.4-.15-2.76.84-3.47.84-.72 0-1.81-.82-2.98-.79-1.51.02-2.93.9-3.71 2.27-1.62 2.8-.41 6.92 1.14 9.19.78 1.1 1.69 2.33 2.86 2.29 1.15-.05 1.58-.74 2.97-.74 1.37 0 1.78.74 2.98.71 1.23-.02 2.01-1.1 2.76-2.21.9-1.27 1.26-2.52 1.28-2.59-.03-.01-2.44-.95-2.47-3.72ZM16.43 5.77a3.84 3.84 0 0 0 .88-2.77 3.9 3.9 0 0 0-2.55 1.32 3.67 3.67 0 0 0-.91 2.67 3.22 3.22 0 0 0 2.58-1.22Z" />
                  </svg>

                  <span className="text-left">
                    <span className="block text-[10px] font-medium leading-none text-onSurfaceVariant">
                      Download on the
                    </span>

                    <span className="mt-1 block font-display text-lg font-black leading-none text-brandInk">
                      App Store
                    </span>
                  </span>
                </a>

                <a
                  aria-label="Get eSim2you on Google Play"
                  className="group flex h-[64px] min-w-[210px] items-center gap-3 rounded-[16px] border border-outline bg-surface px-5 shadow-brandCard transition duration-300 hover:-translate-y-1 hover:border-brandBlue/50 hover:bg-brandBlue/5"
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
                    <span className="block text-[10px] font-medium leading-none text-onSurfaceVariant">
                      Get it on
                    </span>

                    <span className="mt-1 block font-display text-lg font-black leading-none text-brandInk">
                      Google Play
                    </span>
                  </span>
                </a>
              </div>
            </div>

            {/* App visual */}
            <div className="relative flex min-h-[300px] items-end justify-center lg:min-h-[360px]">
              <div className="pointer-events-none absolute left-1/2 top-1/2 h-[240px] w-[340px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brandBlue/13 blur-[85px]" />

              <div className="pointer-events-none absolute bottom-3 left-1/2 h-[50px] w-[72%] -translate-x-1/2 rounded-full bg-black/70 blur-[28px]" />

              <img
                alt="eSim2you mobile application"
                className="relative z-10 max-h-[390px] w-full max-w-[520px] object-contain object-bottom drop-shadow-[0_35px_45px_rgba(0,0,0,0.5)]"
                loading="lazy"
                src="/images/app-store.png"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function PartnerPromo() {
  return (
    <section className="bg-surface px-5 py-16 text-onSurface md:px-8 md:py-20" id="partner-with-us">
      <div className="mx-auto flex max-w-[1280px] flex-col items-center gap-8 rounded-[26px] border border-outline bg-mist px-7 py-12 text-center shadow-brandCard sm:px-10 lg:flex-row lg:items-center lg:justify-between lg:text-left">
        <div className="max-w-[560px]">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-brandBlue">
            eSim2you partner program
          </p>

          <h2 className="mt-3 font-display text-2xl font-black leading-[1.1] tracking-[-0.03em] text-brandInk sm:text-3xl">
            Earn commission referring travelers to eSim2you
          </h2>

          <p className="mt-4 text-sm leading-6 text-onSurfaceVariant sm:text-base">
            Hotels, travel agencies, creators, and drivers can get a personal promo code and
            earn commission on every booking it brings in. Apply in a couple of minutes.
          </p>
        </div>

        <LinkButton className="shrink-0 px-7" href="/partners/request">
          Become a partner
          <ArrowRight size={16} />
        </LinkButton>
      </div>
    </section>
  );
}

function Cta() {
  return (
    <section
      className="overflow-hidden bg-surface px-5 pb-16 pt-20 text-onSurface md:px-8 md:pt-24"
      id="download"
    >
      <div className="relative mx-auto max-w-[1280px]">
        <div className="relative min-h-[220px] overflow-visible rounded-[22px] border border-outline shadow-[0_25px_80px_rgba(11,73,183,0.14)] md:min-h-[190px]">
          <Image
            alt="Blue travel route background for eSim2you"
            className="pointer-events-none absolute inset-0 h-full w-full rounded-[22px] object-cover"
            fill
            loading="lazy"
            referrerPolicy="no-referrer"
            sizes="(max-width: 768px) 100vw, 1280px"
            src="/images/mountain.webp"
          />

          <div className="pointer-events-none absolute inset-0 rounded-[22px] bg-[linear-gradient(90deg,rgba(6,17,49,0.88)_0%,rgba(6,17,49,0.66)_45%,rgba(6,17,49,0.5)_100%)]" />

          <img
            alt="Traveler using eSim2you in the mountains"
            className="pointer-events-none absolute bottom-0 left-[58%] z-20 hidden h-[145%] max-w-none -translate-x-1/2 object-contain object-bottom md:block lg:left-[60%]"
            loading="lazy"
            referrerPolicy="no-referrer"
            src="/images/person.png"
          />

          <div className="relative z-10 flex min-h-[220px] flex-col justify-center gap-7 overflow-hidden rounded-[22px] px-7 py-9 md:min-h-[190px] md:flex-row md:items-center md:justify-between md:px-12 md:py-8">
            <div className="max-w-[560px] md:pr-20 lg:pr-0">
              <h2 className="font-display text-3xl font-black tracking-[-0.03em] text-white md:text-[38px] md:leading-[1.08]">
                Ready to Stay Connected Anywhere?
              </h2>

              <p className="mt-3 text-sm leading-6 text-white/75 md:text-base">
                Join millions of travelers who trust eSim2you for seamless
                connectivity.
              </p>
            </div>

            <LinkButton className="relative z-30 min-w-[250px] self-start md:self-auto" href="#download-app" size="lg">
              Get eSIM Now
              <ArrowRight aria-hidden="true" size={20} />
            </LinkButton>
          </div>
        </div>
      </div>
    </section>
  );
}
