import {
  ArrowRight,
  Check,
  ChevronDown,
  Globe2,
  Headphones,
  MapPin,
  Plus,
  QrCode,
  ShieldCheck,
  ShoppingCart,
  Star,
  Wifi,
  Zap
} from "lucide-react";
import type { Metadata } from "next";

import { JsonLd } from "./JsonLd";
import { SiteFooter } from "./SiteFooter";

import { landingContent } from "@/content/landing";
import { createLandingJsonLd, createMetadata } from "@/lib/seo";
import { HeroPackageSearch } from "./HeroPackageSearch";

const travelerImages = [
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&h=120&q=85",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&h=120&q=85",
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&h=120&q=85",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&h=120&q=85",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=120&h=120&q=85"
];

const plans = [
  {
    title: "Local eSIM",
    subtitle: "Stay connected in one country",
    price: "$4.99",
    icon: MapPin,
    iconClass:
      "bg-gradient-to-br from-[#1471ff] to-[#1549e8] shadow-[0_0_28px_rgba(28,116,255,0.45)]",
    features: [
      "1 – 30 GB Data",
      "Valid for up to 30 Days",
      "Perfect for short trips"
    ],
    buttonLabel: "View Local Plans",
    highlighted: false
  },
  {
    title: "Regional eSIM",
    subtitle: "Travel across multiple countries",
    price: "$19.99",
    icon: Globe2,
    iconClass:
      "bg-gradient-to-br from-[#7c3cff] to-[#4920d8] shadow-[0_0_28px_rgba(119,61,255,0.48)]",
    features: [
      "5 – 50 GB Data",
      "Valid for up to 30 Days",
      "Ideal for regional travel"
    ],
    buttonLabel: "View Regional Plans",
    highlighted: true
  },
  {
    title: "Global eSIM",
    subtitle: "One eSIM. 200+ countries.",
    price: "$39.99",
    icon: Globe2,
    iconClass:
      "bg-gradient-to-br from-[#38cce6] to-[#1684a8] shadow-[0_0_28px_rgba(41,199,229,0.45)]",
    features: [
      "10 – 100 GB Data",
      "Valid for up to 365 Days",
      "Perfect for global travelers"
    ],
    buttonLabel: "View Global Plans",
    highlighted: false
  }
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
    icon: ShoppingCart,
    title: "Choose Your Plan",
    description: "Select your destination and the data plan that fits your trip."
  },
  {
    icon: QrCode,
    title: "Scan & Install",
    description: "Scan the QR code and install your eSIM in just a few seconds."
  },
  {
    icon: Wifi,
    title: "Connect & Go",
    description: "Enjoy high-speed mobile data when you arrive."
  }
];

const testimonials = [
  {
    quote:
      "Velocity eSIM made my Japan trip so easy. The installation was quick and the connection stayed fast throughout the trip.",
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
  title: "Velocity eSIM | Travel Data for 200+ Destinations",
  description:
    "Buy a digital SIM for 200+ destinations, install it in minutes, and skip surprise roaming fees."
});

export default function Home() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#020916] text-white">
      <JsonLd data={createLandingJsonLd()} />

      <Nav />
      <Hero />
      <Plans />
      <Benefits />
      <JourneyAndCoverage />
      <TestimonialsAndFaq />
      <AppDownload />
      <Cta />
      <SiteFooter />
    </main>
  );
}

function Nav() {
  const navItems = [
    {
      label: "Home",
      href: "#"
    },
    {
      label: "Plans",
      href: "#plans"
    },
    {
      label: "Destinations",
      href: "#coverage"
    },
    {
      label: "How it Works",
      href: "#how-it-works"
    },
    {
      label: "About Us",
      href: "#benefits"
    },
    {
      label: "Support",
      href: "#faq"
    }
  ];

  return (
    <header className="absolute inset-x-0 top-0 z-50">
      <nav className="mx-auto flex h-20 max-w-[1440px] items-center justify-between px-5 lg:px-10 xl:px-14">
        <a
          aria-label="Velocity eSIM home"
          className="flex shrink-0 items-center gap-2.5"
          href="#"
        >
          <img
            alt=""
            aria-hidden="true"
            className="h-9 w-9 object-contain"
            src="/app-logo.png"
          />

          <span className="font-display text-lg font-bold tracking-[-0.02em] text-white">
            {landingContent.brand}
          </span>
        </a>

        <div className="hidden items-center gap-8 lg:flex">
          {navItems.map((item) => (
            <a
              className="text-sm font-medium text-white/70 transition-colors hover:text-white"
              href={item.href}
              key={item.href}
            >
              {item.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <button
            aria-label="Change language"
            className="hidden items-center gap-2 text-sm font-semibold text-white/75 transition hover:text-white md:flex"
            type="button"
          >
            <Globe2 aria-hidden="true" size={17} />
            <span>EN</span>
            <ChevronDown aria-hidden="true" size={14} />
          </button>

          <a
            className="inline-flex h-11 items-center justify-center rounded-full bg-gradient-to-r from-[#1557ff] to-[#27c6ff] px-5 text-sm font-bold text-white shadow-[0_12px_32px_rgba(24,111,255,0.38)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_38px_rgba(24,111,255,0.5)] sm:px-7"
            href="#download"
          >
            Get eSIM Now
          </a>
        </div>
      </nav>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative isolate z-20 min-h-[780px] overflow-visible bg-[#020916] pt-20 text-white">
      <div className="pointer-events-none absolute inset-0 -z-20 bg-[radial-gradient(circle_at_72%_38%,rgba(0,102,255,0.18),transparent_38%),radial-gradient(circle_at_18%_20%,rgba(14,78,170,0.1),transparent_32%),linear-gradient(180deg,#020814_0%,#020916_58%,#030b18_100%)]" />

      <div className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-60 bg-gradient-to-t from-[#020916] to-transparent" />

      <div className="mx-auto grid min-h-[700px] max-w-[1440px] items-center gap-10 px-5 pb-24 pt-14 lg:grid-cols-[0.82fr_1.18fr] lg:px-10 lg:pb-16 lg:pt-8 xl:px-14">
        <div className="relative z-20 max-w-[590px] pt-5 lg:pt-0">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#27527d]/55 bg-[#071629]/75 px-4 py-2 text-xs font-semibold text-white/80">
            <Star
              aria-hidden="true"
              className="fill-[#ffd54a] text-[#ffd54a]"
              size={14}
            />

            Trusted by 1M+ Travelers Worldwide
          </div>

          <h1 className="max-w-[570px] font-display text-[46px] font-black leading-[1.04] tracking-[-0.045em] sm:text-[58px] lg:text-[64px] xl:text-[70px]">
            Stay Connected
            <br />
            Worldwide with
            <br />
            <span className="bg-gradient-to-r from-[#236cff] via-[#298cff] to-[#27c8ff] bg-clip-text text-transparent">
              Premium eSIMs
            </span>
          </h1>

          <p className="mt-7 max-w-[520px] text-base leading-7 text-[#a9b7cb] sm:text-[17px]">
            High-speed data in 200+ countries and regions.
            <br className="hidden sm:block" />
            Instant activation. No SIM card. No roaming fees.
          </p>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <a
              className="group inline-flex h-[52px] min-w-[190px] items-center justify-center gap-3 rounded-full bg-gradient-to-r from-[#1857ff] to-[#29c9ff] px-7 text-sm font-bold text-white"
              href="#download"
            >
              Get eSIM Now
              <ArrowRight
                aria-hidden="true"
                className="transition-transform group-hover:translate-x-1"
                size={18}
              />
            </a>

            <a
              className="inline-flex h-[52px] min-w-[150px] items-center justify-center rounded-full border border-[#5f86b8]/70 bg-[#061122]/45 px-7 text-sm font-bold text-white"
              href="#plans"
            >
              View Plans
            </a>
          </div>

          <HeroPackageSearch />

          <TravelerReviews />
        </div>

        <HeroVisual />
      </div>
    </section>
  );
}

function TravelerReviews() {
  return (
    <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-6">
      <div>
        <p className="mb-3 text-xs font-medium text-white/55">
          Trusted by travelers from
        </p>

        <div className="flex -space-x-2">
          {travelerImages.map((image, index) => (
            <div
              className="h-9 w-9 overflow-hidden rounded-full border-2 border-[#07101f] bg-[#12213a]"
              key={image}
            >
              <img
                alt={`Velocity eSIM traveler ${index + 1}`}
                className="h-full w-full object-cover"
                loading="lazy"
                referrerPolicy="no-referrer"
                src={image}
              />
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs text-white/60">
          and 50,000+ reviews
        </p>

        <div className="flex items-center gap-3">
          <div className="flex gap-1">
            {Array.from({ length: 5 }).map((_, index) => (
              <span
                className="grid h-4 w-4 place-items-center rounded-[3px] bg-[#00b67a]"
                key={index}
              >
                <Star
                  aria-hidden="true"
                  className="fill-white text-white"
                  size={10}
                />
              </span>
            ))}
          </div>

          <span className="text-xs font-semibold text-white/75">
            4.8/5
          </span>
        </div>
      </div>
    </div>
  );
}

function HeroVisual() {
  return (
    <div className="relative mx-auto flex min-h-[420px] w-full max-w-[810px] items-center justify-center sm:min-h-[520px] lg:min-h-[650px]">
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[62%] w-[74%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#006cff]/20 blur-[90px]" />

      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[78%] w-[90%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#126ce4]/15" />

      <img
        alt="Velocity eSIM worldwide coverage map and mobile application"
        className="relative z-10 h-auto w-full max-w-[760px] object-contain drop-shadow-[0_35px_55px_rgba(0,0,0,0.55)]"
        src="/images/hero.png"
      />
    </div>
  );
}

function Plans() {
  return (
    <section
    className="relative z-0 bg-[#020916] px-5 pb-10 pt-4 text-white md:px-8"
    id="plans"
    >
      <div className="pointer-events-none absolute left-1/2 top-24 h-52 w-[65%] -translate-x-1/2 rounded-full bg-[#045fff]/10 blur-[100px]" />

      <div className="relative mx-auto max-w-[1280px]">
        <div className="text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#289cff]">
            Popular plans
          </p>

          <h2 className="mt-3 font-display text-3xl font-black tracking-[-0.03em] sm:text-4xl lg:text-[42px]">
            Choose the Perfect Plan for Your Journey
          </h2>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          {plans.map((plan) => {
            const Icon = plan.icon;

            return (
              <article
                className={`relative rounded-[20px] border bg-[linear-gradient(145deg,rgba(12,29,54,0.96),rgba(5,16,33,0.98))] p-6 shadow-[0_22px_60px_rgba(0,0,0,0.28)] ${
                  plan.highlighted
                    ? "border-[#755cff] ring-1 ring-[#1ba9ff]/80"
                    : "border-[#23466d]/75"
                }`}
                key={plan.title}
              >
                {plan.highlighted ? (
                  <span className="absolute -top-3 left-5 rounded-full bg-gradient-to-r from-[#1679ff] to-[#2cc8ff] px-3 py-1 text-[9px] font-black uppercase tracking-[0.1em] text-white">
                    Best value
                  </span>
                ) : null}

                <div className="flex items-start justify-between gap-5">
                  <div>
                    <h3 className="font-display text-xl font-black">
                      {plan.title}
                    </h3>

                    <p className="mt-1 text-sm text-white/55">
                      {plan.subtitle}
                    </p>
                  </div>

                  <span
                    className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-white ${plan.iconClass}`}
                  >
                    <Icon aria-hidden="true" size={27} />
                  </span>
                </div>

                <div className="mt-5 flex items-end gap-2">
                  <span className="font-display text-4xl font-black tracking-[-0.04em]">
                    {plan.price}
                  </span>

                  <span className="pb-1 text-xs text-white/50">
                    From
                  </span>
                </div>

                <ul className="mt-6 space-y-3">
                  {plan.features.map((feature) => (
                    <li
                      className="flex items-center gap-2.5 text-sm text-white/72"
                      key={feature}
                    >
                      <span className="grid h-4 w-4 shrink-0 place-items-center rounded-full border border-[#2d789f] text-[#48c9ff]">
                        <Check aria-hidden="true" size={10} />
                      </span>

                      {feature}
                    </li>
                  ))}
                </ul>

                <a
                  className={`mt-7 inline-flex h-11 w-full items-center justify-center rounded-full border text-sm font-bold transition ${
                    plan.highlighted
                      ? "border-transparent bg-gradient-to-r from-[#1658ff] to-[#28bfff] text-white shadow-[0_10px_28px_rgba(22,112,255,0.33)] hover:-translate-y-0.5"
                      : "border-[#245b98] bg-transparent text-white hover:border-[#39bfff] hover:bg-[#0a203a]"
                  }`}
                  href="/destinations"
                >
                  {plan.buttonLabel}
                </a>
              </article>
            );
          })}
        </div>

        <p className="mt-4 flex items-center justify-center gap-2 text-xs text-white/45">
          <Wifi aria-hidden="true" size={14} />
          All plans include high-speed 4G/5G data
        </p>
      </div>
    </section>
  );
}

function Benefits() {
  return (
    <section
      className="bg-[#020916] px-5 py-10 text-white md:px-8"
      id="benefits"
    >
      <div className="mx-auto max-w-[1280px]">
        <p className="mb-5 text-center text-[10px] font-black uppercase tracking-[0.2em] text-[#28a7ff]">
          Why travelers choose Velocity eSIM
        </p>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {benefits.map((benefit) => {
            const Icon = benefit.icon;

            return (
              <article
                className="rounded-2xl border border-[#234363]/75 bg-[linear-gradient(145deg,rgba(12,29,51,0.95),rgba(6,18,35,0.95))] p-5 shadow-[0_16px_42px_rgba(0,0,0,0.2)]"
                key={benefit.title}
              >
                <div className="flex items-center gap-4">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[radial-gradient(circle_at_35%_30%,#2e9dff,#153cf2)] text-white shadow-[0_0_26px_rgba(26,107,255,0.42)]">
                    <Icon aria-hidden="true" size={24} />
                  </span>

                  <div>
                    <h3 className="font-display text-base font-black">
                      {benefit.title}
                    </h3>

                    <p className="mt-1 text-xs leading-5 text-white/55">
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

function JourneyAndCoverage() {
  const cardClassName =
    "relative mt-7 h-auto min-h-[420px] w-full overflow-hidden rounded-[22px] border border-[#234767]/75 bg-[#061326] shadow-[0_28px_70px_rgba(0,0,0,0.3)] sm:h-[420px]";

  return (
    <section
      className="overflow-hidden bg-[#020916] px-5 py-14 text-white md:px-8 md:py-20"
      id="how-it-works"
    >
      <div className="mx-auto grid max-w-[1320px] items-start gap-12 lg:grid-cols-2 lg:gap-8">
        {/* How it works */}
        <div className="mx-auto w-full max-w-[630px]">
          <div className="text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#289fff]">
              How it works
            </p>

            <h2 className="mt-2 font-display text-3xl font-black">
              3 Simple Steps
            </h2>
          </div>

          <div
            className={`${cardClassName} flex items-center justify-center px-6 py-10 sm:px-8`}
          >
            <div className="pointer-events-none absolute left-1/2 top-1/2 h-[230px] w-[80%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#006cff]/10 blur-[90px]" />

            <div className="relative z-10 grid w-full gap-10 sm:grid-cols-3 sm:gap-0">
              {installationSteps.map((step, index) => {
                const Icon = step.icon;
                const isLastStep = index === installationSteps.length - 1;

                return (
                  <div
                    className="relative flex min-w-0 flex-col items-center text-center"
                    key={step.title}
                  >
                    {!isLastStep && (
                      <div className="pointer-events-none absolute left-[calc(50%+48px)] top-[36px] z-0 hidden w-[calc(100%-96px)] items-center sm:flex">
                        <span className="h-px flex-1 bg-gradient-to-r from-[#2b8cff]/65 via-[#2b8cff]/80 to-[#2b8cff]/45" />

                        <ArrowRight
                          aria-hidden="true"
                          className="-ml-[2px] shrink-0 text-[#60afff]"
                          size={18}
                          strokeWidth={1.7}
                        />
                      </div>
                    )}

                    <div className="relative z-10">
                      <span className="absolute -left-3 -top-3 grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-[#2796ff] to-[#1750f4] text-xs font-black shadow-[0_0_22px_rgba(30,119,255,0.7)]">
                        {index + 1}
                      </span>

                      <span className="grid h-[74px] w-[74px] place-items-center rounded-[18px] border border-[#32618c] bg-[linear-gradient(145deg,#102844,#071629)] text-white shadow-[0_16px_30px_rgba(0,0,0,0.3)]">
                        <Icon aria-hidden="true" size={30} strokeWidth={2.2} />
                      </span>
                    </div>

                    <h3 className="mt-5 whitespace-nowrap font-display text-sm font-black">
                      {step.title}
                    </h3>

                    <p className="mt-2 max-w-[165px] text-xs leading-5 text-white/55">
                      {step.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Coverage */}
        <div className="mx-auto w-full max-w-[630px]" id="coverage">
          <div className="text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#289fff]">
              Global coverage
            </p>

            <h2 className="mt-2 font-display text-3xl font-black">
              Where Will You Go Next?
            </h2>
          </div>

          <div
            className={`${cardClassName} bg-[image:url('/images/6__.png')] bg-cover bg-center bg-no-repeat`}
          >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(0,108,255,0.12),transparent_58%)]" />

            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#020916]/5 via-transparent to-[#03101f]/90" />

            <div className="relative z-10 flex h-full items-end p-4 sm:p-5">
              <div className="grid h-[92px] w-full grid-cols-3 overflow-hidden rounded-[18px] border border-[#31577c]/85 bg-[#06162a]/90 text-center shadow-[0_18px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl">
                <div className="flex flex-col items-center justify-center px-2">
                  <p className="font-display text-xl font-black sm:text-2xl">
                    200+
                  </p>

                  <p className="mt-1 text-[9px] text-white/50 sm:text-[10px]">
                    Countries
                  </p>
                </div>

                <div className="my-4 flex flex-col items-center justify-center border-x border-white/10 px-2">
                  <p className="font-display text-xl font-black sm:text-2xl">
                    500+
                  </p>

                  <p className="mt-1 text-[9px] text-white/50 sm:text-[10px]">
                    Networks
                  </p>
                </div>

                <div className="flex flex-col items-center justify-center px-2">
                  <p className="font-display text-xl font-black sm:text-2xl">
                    99%
                  </p>

                  <p className="mt-1 text-[9px] text-white/50 sm:text-[10px]">
                    Global Coverage
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 flex justify-center">
            <a
              className="group inline-flex h-11 min-w-[230px] items-center justify-center gap-3 rounded-full border border-[#275da0] bg-[#07172a] px-6 text-sm font-bold transition duration-300 hover:border-[#39bfff] hover:bg-[#0b213d]"
              href="/destinations"
            >
              <span>View All Destinations</span>

              <ArrowRight
                aria-hidden="true"
                className="shrink-0 transition-transform duration-300 group-hover:translate-x-1"
                size={17}
              />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

function TestimonialsAndFaq() {
  return (
    <section className="relative overflow-hidden bg-[#020916] px-5 py-10 text-white md:px-8">
      <div className="relative mx-auto max-w-[1280px]">
        <div className="text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#289fff]">
            Trusted by travelers
          </p>

          <h2 className="mt-2 font-display text-3xl font-black tracking-[-0.03em] sm:text-4xl">
            Loved by Millions Around the World
          </h2>
        </div>

        <div className="mt-7 grid items-stretch gap-5 md:grid-cols-[0.82fr_1fr_1fr]">
          <div className="relative hidden min-h-[285px] md:block">
            <img
              alt="Velocity eSIM mobile applications"
              className="pointer-events-none absolute bottom-[-5px] left-1/2 h-[116%] w-[142%] max-w-none -translate-x-1/2 object-contain object-bottom drop-shadow-[0_24px_32px_rgba(0,0,0,0.45)]"
              loading="lazy"
              src="/images/a6.png"
            />
          </div>

          {testimonials.slice(0, 2).map((testimonial) => (
            <article
              className="group relative flex min-h-[285px] flex-col overflow-hidden rounded-[18px] border border-[#234767]/80 bg-[linear-gradient(145deg,rgba(10,27,49,0.98),rgba(4,15,30,0.98))] p-6 shadow-[0_18px_50px_rgba(0,0,0,0.24)] transition duration-300 hover:-translate-y-1 hover:border-[#3477a9] hover:shadow-[0_24px_60px_rgba(0,78,180,0.18)]"
              key={testimonial.name}
            >
              <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[#55b2ff]/50 to-transparent" />

              <span
                aria-hidden="true"
                className="relative font-display text-[42px] font-black leading-none text-white/35"
              >
                “
              </span>

              <p className="relative mt-2 flex-1 text-sm font-medium leading-7 text-white/76">
                {testimonial.quote}
              </p>

              <div className="relative mt-6 flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <img
                    alt={testimonial.name}
                    className="h-11 w-11 shrink-0 rounded-full border border-white/15 object-cover shadow-[0_8px_20px_rgba(0,0,0,0.35)]"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    src={testimonial.image}
                  />

                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-white">
                      {testimonial.name}
                    </p>

                    <p className="mt-0.5 text-[10px] text-white/45">
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
      className="relative overflow-hidden bg-[#020916] px-5 py-16 text-white md:px-8 md:py-24"
      id="download-app"
    >
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[70%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#006cff]/10 blur-[130px]" />

      <div className="relative mx-auto max-w-[1280px]">
        <div className="relative overflow-hidden rounded-[26px] border border-[#285378]/80 bg-[linear-gradient(135deg,rgba(9,28,53,0.98),rgba(4,15,31,0.99))] shadow-[0_30px_90px_rgba(0,0,0,0.4)]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_75%_45%,rgba(20,112,255,0.22),transparent_42%)]" />

          <div className="pointer-events-none absolute inset-x-20 top-0 h-px bg-gradient-to-r from-transparent via-[#55b2ff]/60 to-transparent" />

          <div className="relative grid min-h-[390px] items-center gap-10 px-7 py-12 sm:px-10 lg:grid-cols-[0.95fr_1.05fr] lg:px-16 lg:py-14">
            {/* Content */}
            <div className="relative z-20 max-w-[570px]">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#289fff]">
                Velocity in your pocket
              </p>

              <h2 className="mt-3 font-display text-3xl font-black leading-[1.08] tracking-[-0.04em] sm:text-4xl lg:text-[46px]">
                Download the App.
                <br />

                <span className="bg-gradient-to-r from-[#2874ff] to-[#35caff] bg-clip-text text-transparent">
                  Stay Connected Anywhere.
                </span>
              </h2>

              <p className="mt-5 max-w-[520px] text-sm leading-7 text-[#a9b7cb] sm:text-base">
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
                    className="flex items-center gap-2 text-xs font-semibold text-white/70"
                    key={feature}
                  >
                    <span className="grid h-5 w-5 place-items-center rounded-full border border-[#2f77a9] bg-[#0b2740] text-[#53caff]">
                      <Check aria-hidden="true" size={11} strokeWidth={2.5} />
                    </span>

                    {feature}
                  </div>
                ))}
              </div>

              {/* Store buttons */}
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <a
                  aria-label="Download Velocity eSIM on the App Store"
                  className="group flex h-[64px] min-w-[210px] items-center gap-3 rounded-[16px] border border-[#315778]/85 bg-[#050d19]/90 px-5 shadow-[0_14px_35px_rgba(0,0,0,0.28)] transition duration-300 hover:-translate-y-1 hover:border-[#42baff] hover:bg-[#09182a]"
                  href="https://apps.apple.com/am/app/velocityesim/id6768258284"
                >
                  <svg
                    aria-hidden="true"
                    className="h-8 w-8 shrink-0 fill-white"
                    viewBox="0 0 24 24"
                  >
                    <path d="M18.71 12.5c.03-2.3 1.88-3.4 1.97-3.45-1.07-1.57-2.74-1.78-3.33-1.8-1.4-.15-2.76.84-3.47.84-.72 0-1.81-.82-2.98-.79-1.51.02-2.93.9-3.71 2.27-1.62 2.8-.41 6.92 1.14 9.19.78 1.1 1.69 2.33 2.86 2.29 1.15-.05 1.58-.74 2.97-.74 1.37 0 1.78.74 2.98.71 1.23-.02 2.01-1.1 2.76-2.21.9-1.27 1.26-2.52 1.28-2.59-.03-.01-2.44-.95-2.47-3.72ZM16.43 5.77a3.84 3.84 0 0 0 .88-2.77 3.9 3.9 0 0 0-2.55 1.32 3.67 3.67 0 0 0-.91 2.67 3.22 3.22 0 0 0 2.58-1.22Z" />
                  </svg>

                  <span className="text-left">
                    <span className="block text-[10px] font-medium leading-none text-white/55">
                      Download on the
                    </span>

                    <span className="mt-1 block font-display text-lg font-black leading-none text-white">
                      App Store
                    </span>
                  </span>
                </a>

                <a
                  aria-label="Get Velocity eSIM on Google Play"
                  className="group flex h-[64px] min-w-[210px] items-center gap-3 rounded-[16px] border border-[#315778]/85 bg-[#050d19]/90 px-5 shadow-[0_14px_35px_rgba(0,0,0,0.28)] transition duration-300 hover:-translate-y-1 hover:border-[#42baff] hover:bg-[#09182a]"
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
                    <span className="block text-[10px] font-medium leading-none text-white/55">
                      Get it on
                    </span>

                    <span className="mt-1 block font-display text-lg font-black leading-none text-white">
                      Google Play
                    </span>
                  </span>
                </a>
              </div>
            </div>

            {/* App visual */}
            <div className="relative flex min-h-[300px] items-end justify-center lg:min-h-[360px]">
              <div className="pointer-events-none absolute left-1/2 top-1/2 h-[240px] w-[340px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#096cff]/25 blur-[85px]" />

              <div className="pointer-events-none absolute bottom-3 left-1/2 h-[50px] w-[72%] -translate-x-1/2 rounded-full bg-black/70 blur-[28px]" />

              <img
                alt="Velocity eSIM mobile application"
                className="relative z-10 max-h-[390px] w-full max-w-[520px] object-contain object-bottom drop-shadow-[0_35px_45px_rgba(0,0,0,0.5)]"
                loading="lazy"
                src="/images/6c.png"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Cta() {
  return (
    <section
      className="overflow-hidden bg-[#020916] px-5 pb-16 pt-20 text-white md:px-8 md:pt-24"
      id="download"
    >
      <div className="relative mx-auto max-w-[1280px]">
        <div className="relative min-h-[220px] overflow-visible rounded-[22px] border border-white/80 shadow-[0_25px_80px_rgba(16,70,222,0.28)] md:min-h-[190px]">
          <img
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 h-full w-full rounded-[22px] object-cover"
            loading="lazy"
            referrerPolicy="no-referrer"
            src="/images/3.png"
          />

          <div className="pointer-events-none absolute inset-0 rounded-[22px] bg-[linear-gradient(90deg,rgba(3,17,48,0.88)_0%,rgba(3,22,62,0.66)_45%,rgba(2,14,42,0.5)_100%)]" />

          <img
            alt="Traveler using Velocity eSIM in the mountains"
            className="pointer-events-none absolute bottom-0 left-[58%] z-20 hidden h-[145%] max-w-none -translate-x-1/2 object-contain object-bottom md:block lg:left-[60%]"
            loading="lazy"
            referrerPolicy="no-referrer"
            src="/images/4-.png"
          />

          <div className="relative z-10 flex min-h-[220px] flex-col justify-center gap-7 overflow-hidden rounded-[22px] px-7 py-9 md:min-h-[190px] md:flex-row md:items-center md:justify-between md:px-12 md:py-8">
            <div className="max-w-[560px] md:pr-20 lg:pr-0">
              <h2 className="font-display text-3xl font-black tracking-[-0.03em] md:text-[38px] md:leading-[1.08]">
                Ready to Stay Connected Anywhere?
              </h2>

              <p className="mt-3 text-sm leading-6 text-white/75 md:text-base">
                Join millions of travelers who trust Velocity eSIM for seamless
                connectivity.
              </p>
            </div>

            <a
              className="relative z-30 inline-flex h-14 min-w-[250px] items-center justify-center gap-5 self-start rounded-full bg-white px-8 text-sm font-black text-[#1c55cc] shadow-[0_16px_40px_rgba(0,0,0,0.2)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_48px_rgba(0,0,0,0.28)] md:self-auto"
              href="#plans"
            >
              Get eSIM Now
              <ArrowRight aria-hidden="true" size={20} />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}