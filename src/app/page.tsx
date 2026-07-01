import {
  ArrowRight,
  BadgeCheck,
  CircleHelp,
  Download,
  Globe2,
  Headphones,
  MapPin,
  Plane,
  QrCode,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Wifi
} from "lucide-react";
import { HeroPackageSearch } from "./HeroPackageSearch";
import { landingContent } from "@/content/landing";

const stepIcons = [MapPin, QrCode, Wifi];
const benefitIcons = [Sparkles, ShieldCheck, Headphones];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-white text-ink">
      <Nav />
      <Hero />
      <Destinations />
      <HowItWorks />
      <Benefits />
      <Faq />
      <Cta />
      <Footer />
    </main>
  );
}

function Nav() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-cyan/10 bg-white/82 backdrop-blur-xl">
      <nav className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 md:px-8">
        <a className="flex items-center gap-3 font-display text-lg font-bold" href="#">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-midnight text-cyan shadow-glow">
            <Globe2 aria-hidden="true" size={20} />
          </span>
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
        <div>
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
                href="#destinations"
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
    <div className="relative mx-auto w-full max-w-[440px]">
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
            <article
              className="group overflow-hidden rounded-xl border border-line bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-card"
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
            </article>
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
            Built for smarter travel and future support.
          </h2>
          <p className="mt-5 max-w-xl leading-8 text-white/70">
            The landing page introduces the service clearly today, while the structure leaves room for support pages, contact forms, and app deep links tomorrow.
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
          Download links will guide travelers straight to the mobile app as soon as your release is ready.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <a className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-cyan px-6 font-black text-midnight transition hover:bg-aqua" href="#">
            <Download aria-hidden="true" size={18} />
            App Store
          </a>
          <a className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-white px-6 font-black text-midnight transition hover:bg-cloud" href="#">
            <Download aria-hidden="true" size={18} />
            Google Play
          </a>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-cyan/10 bg-midnight py-12 text-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-5 md:grid-cols-[1fr_auto] md:px-8">
        <div>
          <div className="flex items-center gap-3 font-display text-lg font-black">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-cyan text-midnight">
              <Globe2 aria-hidden="true" size={20} />
            </span>
            {landingContent.brand}
          </div>
          <p className="mt-4 max-w-md text-sm leading-6 text-white/60">
            Simple global connectivity for travelers who want reliable mobile data without roaming surprises.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-5">
          {landingContent.supportLinks.map((link) => (
            <a className="text-sm font-semibold text-white/70 transition hover:text-cyan" href={link.href} key={link.label}>
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </footer>
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
