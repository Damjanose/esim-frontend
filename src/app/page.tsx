import {
  ArrowRight,
  BadgeCheck,
  CircleHelp,
  Headphones,
  MapPin,
  Plane,
  QrCode,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Wifi
} from "lucide-react";
import type { Metadata } from "next";
import { JsonLd } from "./JsonLd";
import { HeroPackageSearch } from "./HeroPackageSearch";
import { SiteFooter } from "./SiteFooter";
import { landingContent } from "@/content/landing";
import { createLandingJsonLd, createMetadata } from "@/lib/seo";

const stepIcons = [MapPin, QrCode, Wifi];
const benefitIcons = [Sparkles, ShieldCheck, Headphones];

export const metadata: Metadata = createMetadata({
  path: "/",
  title: "Velocity eSIM | Travel Data for 200+ Destinations",
  description:
    "Buy a digital SIM for 200+ destinations, install it in minutes, and skip surprise roaming fees."
});

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-white text-ink">
      <JsonLd data={createLandingJsonLd()} />
      <Nav />
      <Hero />
      <Destinations />
      <HowItWorks />
      <Benefits />
      <Faq />
      <Cta />
      <SiteFooter />
    </main>
  );
}

function Nav() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-cyan/10 bg-white/82 backdrop-blur-xl">
      <nav className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 md:px-8">
        <a className="flex items-center gap-3 font-display text-lg font-bold" href="#">
          <img
            alt=""
            aria-hidden="true"
            className="h-9 w-9 rounded-lg shadow-glow"
            src="/app-logo.png"
          />
          {landingContent.brand}
        </a>
        <div className="hidden items-center gap-8 md:flex">
          {landingContent.navItems.map((item) => (
            <a
              className="text-sm font-medium text-slate-600 transition hover:text-midnight"
              href={item.href}
              key={item.href}
            >
              {item.label}
            </a>
          ))}
        </div>
        <a
          className="inline-flex h-11 items-center gap-2 rounded-lg bg-midnight px-5 text-sm font-bold text-cyan transition hover:bg-ink"
          href="#download"
        >
          Get App
          <ArrowRight aria-hidden="true" size={16} />
        </a>
      </nav>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative isolate pt-32">
      <div className="hero-grid absolute inset-0 -z-10" />
      <div className="absolute left-1/2 top-24 -z-10 h-72 w-72 -translate-x-1/2 rounded-full bg-cyan/20 blur-3xl" />
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 pb-20 md:grid-cols-[1.03fr_0.97fr] md:px-8 md:pb-28 md:pt-14">
        <div className="relative z-20">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan/30 bg-white/70 px-4 py-2 text-xs font-bold uppercase text-midnight shadow-sm backdrop-blur">
            <span className="h-2 w-2 rounded-full bg-cyan" />
            {landingContent.hero.eyebrow}
          </div>
          <h1 className="max-w-4xl font-display text-5xl font-black leading-none text-midnight md:text-7xl">
            {landingContent.hero.title}
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
            {landingContent.hero.body}
          </p>
          <HeroPackageSearch />
          <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-slate-500">
            <span className="font-semibold text-midnight">Popular:</span>
          {landingContent.hero.popular.map((item) => (
            <a
              className="rounded-full border border-line bg-white px-3 py-1 font-medium transition hover:border-cyan hover:text-midnight"
                href={item === "USA" ? "/destinations/usa" : item === "Japan" ? "/destinations/japan" : "/destinations/europe"}
              key={item}
            >
                {item}
              </a>
            ))}
          </div>
        </div>
        <HeroDevice />
      </div>
    </section>
  );
}

function HeroDevice() {
  return (
    <div className="relative z-0 mx-auto w-full max-w-[440px]">
      <div className="absolute -left-8 top-10 hidden rounded-xl border border-cyan/20 bg-white/80 p-4 shadow-card backdrop-blur sm:block">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-cyan/15 text-midnight">
            <Plane aria-hidden="true" size={18} />
          </span>
          <div>
            <p className="text-xs font-bold uppercase text-slate-500">Ready before arrival</p>
            <p className="text-sm font-black text-midnight">Install in minutes</p>
          </div>
        </div>
      </div>
      <div className="ml-auto rounded-[2rem] border border-midnight/10 bg-midnight p-4 shadow-glow">
        <div className="rounded-[1.55rem] bg-white p-5">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase text-slate-400">Active plan</p>
              <p className="font-display text-2xl font-black text-midnight">Tokyo, Japan</p>
            </div>
            <span className="grid h-11 w-11 place-items-center rounded-lg bg-cyan text-midnight">
              <Smartphone aria-hidden="true" size={21} />
            </span>
          </div>
          <div className="rounded-xl bg-cloud p-4">
            <div className="mb-2 flex justify-between text-xs font-bold uppercase text-slate-500">
              <span>Data usage</span>
              <span>7.6 GB / 10 GB</span>
            </div>
            <div className="h-3 rounded-full bg-white">
              <div className="h-3 w-3/4 rounded-full bg-cyan" />
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-line p-4">
              <p className="text-xs font-bold uppercase text-slate-400">Network</p>
              <p className="mt-1 font-black text-midnight">5G / LTE</p>
            </div>
            <div className="rounded-xl border border-line p-4">
              <p className="text-xs font-bold uppercase text-slate-400">Validity</p>
              <p className="mt-1 font-black text-midnight">30 days</p>
            </div>
          </div>
          <div className="mt-4 rounded-xl bg-midnight p-4 text-white">
            <div className="flex items-center gap-3">
              <BadgeCheck aria-hidden="true" className="text-cyan" size={20} />
              <p className="text-sm font-semibold">Connected with Velocity eSIM</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Destinations() {
  return (
    <section className="bg-cloud py-20 md:py-28" id="destinations">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <SectionHeading
          body="Browse starter plans for traveler favorites. More destinations can plug into this section later."
          kicker="Popular destinations"
          title="Choose data where your trip begins."
        />
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {landingContent.destinations.map((destination) => (
            <a
              className="group overflow-hidden rounded-xl border border-line bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-card"
              href={destination.href}
              key={destination.country}
            >
              <div className={`relative h-40 overflow-hidden bg-gradient-to-br ${destination.palette}`}>
                <img
                  alt={destination.imageAlt}
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  loading="lazy"
                  src={destination.imageUrl}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-midnight/55 via-midnight/10 to-transparent" />
                <span className="absolute left-5 top-5 rounded-full bg-white/82 px-3 py-1 text-xs font-black text-midnight">
                  {destination.landmark}
                </span>
              </div>
              <div className="p-5">
                <div className="flex min-h-7 items-center justify-between gap-3">
                  <h3 className="font-display text-lg font-black text-midnight">
                    {destination.country}
                  </h3>
                  {destination.badge ? (
                    <span className="rounded-full bg-cyan px-2 py-1 text-[10px] font-black uppercase text-midnight">
                      {destination.badge}
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-sm text-slate-500">{destination.region}</p>
                <div className="mt-5 flex items-end justify-between">
                  <span className="text-xs font-semibold text-slate-400">Starting from</span>
                  <span className="font-display text-xl font-black text-midnight">
                    {destination.price}
                  </span>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section className="py-20 md:py-28" id="how-it-works">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <SectionHeading
          align="center"
          body="A simple travel-data flow your users can understand in seconds."
          kicker="How it works"
          title="From checkout to connection in three steps."
        />
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {landingContent.steps.map((step, index) => {
            const Icon = stepIcons[index];
            return (
              <article className="rounded-xl border border-line bg-white p-7 text-center shadow-sm" key={step.title}>
                <span className="mx-auto grid h-14 w-14 place-items-center rounded-xl bg-cyan/12 text-midnight">
                  <Icon aria-hidden="true" size={24} />
                </span>
                <p className="mt-6 text-sm font-black uppercase text-cyan">Step {index + 1}</p>
                <h3 className="mt-2 font-display text-xl font-black text-midnight">{step.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{step.description}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Benefits() {
  return (
    <section className="bg-midnight py-20 text-white md:py-28" id="benefits">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 md:grid-cols-[0.95fr_1.05fr] md:px-8">
        <div>
          <p className="text-sm font-black uppercase text-cyan">Benefits</p>
          <h2 className="mt-3 max-w-xl font-display text-4xl font-black leading-tight md:text-5xl">
            Built for smarter travel, business trips, and fewer roaming surprises.
          </h2>
          <p className="mt-5 max-w-xl leading-8 text-white/70">
            Velocity eSIM gives travelers a practical way to prepare international data,
            keep mobile internet abroad, and use a roaming alternative for vacations,
            remote work, and business travel.
          </p>
        </div>
        <div className="grid gap-4">
          {landingContent.benefits.map((benefit, index) => {
            const Icon = benefitIcons[index];
            return (
              <article className="rounded-xl border border-cyan/20 bg-white/8 p-6 backdrop-blur" key={benefit.title}>
                <div className="flex gap-4">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-cyan text-midnight">
                    <Icon aria-hidden="true" size={22} />
                  </span>
                  <div>
                    <h3 className="font-display text-xl font-black">{benefit.title}</h3>
                    <p className="mt-2 leading-7 text-white/70">{benefit.description}</p>
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

function Faq() {
  return (
    <section className="py-20 md:py-28" id="faq">
      <div className="mx-auto max-w-3xl px-5 md:px-8">
        <SectionHeading
          align="center"
          body="The first answers customers need before choosing an eSIM."
          kicker="FAQ"
          title="Common questions, simple answers."
        />
        <div className="mt-10 space-y-4">
          {landingContent.faqs.map((faq) => (
            <details className="group rounded-xl border border-line bg-white p-5 shadow-sm" key={faq.question}>
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display font-black text-midnight">
                {faq.question}
                <CircleHelp aria-hidden="true" className="shrink-0 text-cyan transition group-open:rotate-45" size={20} />
              </summary>
              <p className="mt-4 leading-7 text-slate-600">{faq.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function Cta() {
  return (
    <section className="px-5 pb-20 md:px-8 md:pb-28" id="download">
      <div className="mx-auto max-w-7xl rounded-2xl bg-midnight px-6 py-14 text-center text-white shadow-card md:px-12">
        <p className="text-sm font-black uppercase text-cyan">Ready for your next adventure?</p>
        <h2 className="mx-auto mt-3 max-w-3xl font-display text-4xl font-black leading-tight md:text-5xl">
          Keep the app ready before your next border crossing.
        </h2>
        <p className="mx-auto mt-5 max-w-2xl leading-8 text-white/70">
          Download Velocity eSIM to choose travel data for 200+ destinations, install
          before departure, and keep mobile internet ready for the moments roaming feels unclear.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <a
            aria-label="Download Velocity eSIM on the App Store"
            className="inline-flex min-h-16 items-center justify-center gap-3 rounded-lg border border-white/20 bg-white px-5 text-left text-midnight shadow-[0_18px_38px_rgba(255,255,255,0.14)] transition hover:-translate-y-0.5 hover:border-cyan hover:shadow-[0_22px_48px_rgba(27,211,232,0.2)]"
            href={landingContent.appLinks.ios.href}
            rel="noopener noreferrer"
            target="_blank"
          >
            <AppleStoreIcon />
            <span className="grid leading-none">
              <span className="text-[11px] font-black uppercase tracking-[0.08em] text-midnight/65">
                Download on the
              </span>
              <span className="mt-1 font-display text-lg font-black">
                {landingContent.appLinks.ios.label}
              </span>
            </span>
          </a>
          <a
            aria-label="Download Velocity eSIM on Google Play"
            className="inline-flex min-h-16 items-center justify-center gap-3 rounded-lg border border-cyan/60 bg-cyan px-5 text-left text-midnight shadow-[0_18px_38px_rgba(27,211,232,0.28)] transition hover:-translate-y-0.5 hover:bg-aqua hover:shadow-[0_22px_48px_rgba(27,211,232,0.36)]"
            href={landingContent.appLinks.android.href}
            rel="noopener noreferrer"
            target="_blank"
          >
            <GooglePlayIcon />
            <span className="grid leading-none">
              <span className="text-[11px] font-black uppercase tracking-[0.08em] text-midnight/65">
                Get it on
              </span>
              <span className="mt-1 font-display text-lg font-black">
                {landingContent.appLinks.android.label}
              </span>
            </span>
          </a>
        </div>
      </div>
    </section>
  );
}

function AppleStoreIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-8 w-8 shrink-0"
      fill="currentColor"
      viewBox="0 0 24 24"
    >
      <path d="M16.54 12.36c-.03-2.28 1.86-3.38 1.95-3.43-1.07-1.57-2.72-1.78-3.3-1.8-1.39-.14-2.73.82-3.44.82-.72 0-1.82-.8-3-.78-1.54.02-2.97.91-3.76 2.3-1.61 2.79-.41 6.89 1.13 9.15.77 1.1 1.67 2.33 2.84 2.29 1.15-.05 1.58-.73 2.97-.73 1.38 0 1.78.73 2.98.7 1.23-.02 2.01-1.1 2.75-2.21.89-1.26 1.24-2.51 1.25-2.58-.03-.01-2.34-.9-2.37-3.73Z" />
      <path d="M14.28 5.65c.62-.75 1.04-1.8.92-2.85-.9.04-2.03.62-2.68 1.37-.58.66-1.1 1.75-.96 2.77 1.02.08 2.08-.52 2.72-1.29Z" />
    </svg>
  );
}

function GooglePlayIcon() {
  return (
    <svg aria-hidden="true" className="h-8 w-8 shrink-0" viewBox="0 0 32 32">
      <path d="M5.4 3.8c-.37.4-.6 1.02-.6 1.84v20.72c0 .82.23 1.44.62 1.84l.08.08L17.1 16.14v-.28L5.48 3.72l-.08.08Z" fill="#1a73e8" />
      <path d="m20.96 20.02-3.86-4.02v-.28l3.86-4.02.08.05 4.58 2.6c1.31.74 1.31 1.96 0 2.71l-4.58 2.6-.08.36Z" fill="#fbbc04" />
      <path d="m21.04 19.66-3.94-3.94L5.4 28.2c.58.62 1.55.69 2.65.07l12.99-8.61Z" fill="#34a853" />
      <path d="M21.04 12.34 8.05 3.73c-1.1-.62-2.07-.55-2.65.07l11.7 12.2 3.94-3.66Z" fill="#ea4335" />
    </svg>
  );
}

function SectionHeading({
  align = "left",
  body,
  kicker,
  title
}: {
  align?: "left" | "center";
  body: string;
  kicker: string;
  title: string;
}) {
  return (
    <div className={align === "center" ? "mx-auto max-w-3xl text-center" : "max-w-3xl"}>
      <p className="text-sm font-black uppercase text-cyan">{kicker}</p>
      <h2 className="mt-3 font-display text-4xl font-black leading-tight text-midnight md:text-5xl">
        {title}
      </h2>
      <p className="mt-4 leading-7 text-slate-600">{body}</p>
    </div>
  );
}
