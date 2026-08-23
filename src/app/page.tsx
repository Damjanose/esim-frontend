import {
  ArrowRight,
  Check,
  ChevronDown,
  Globe2,
  Headphones,
  QrCode,
  ShieldCheck,
  ShoppingCart,
  Star,
  Wifi,
  Zap,
  CalendarDays,
  Infinity as InfinityIcon,
  Plane,
  SlidersHorizontal,
} from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";

import { JsonLd } from "./JsonLd";
import { SiteFooter } from "./SiteFooter";

import { Navbar } from './components/Navbar'
import { LinkButton } from "./components/Button";
import { createLandingJsonLd, createMetadata } from "@/lib/seo";
import { HeroPackageSearch } from "./HeroPackageSearch";

const travelerImages = [
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&h=120&q=85",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&h=120&q=85",
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&h=120&q=85",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&h=120&q=85",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=120&h=120&q=85"
];

const heroDestinations = [
  {
    city: "New York",
    country: "USA",
    flag: "🇺🇸",
    image:
      "https://images.unsplash.com/photo-1522083165195-3424ed129620?auto=format&fit=crop&w=240&q=90",
    className:
      "left-[2%] top-[9%] lg:left-[4%] lg:top-[7%]",
  },
  {
    city: "Paris",
    country: "France",
    flag: "🇫🇷",
    image:
      "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=240&q=90",
    className:
      "right-[0%] top-[12%] lg:right-[-1%] lg:top-[10%]",
  },
  {
    city: "Bali",
    country: "Indonesia",
    flag: "🇮🇩",
    image:
      "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=240&q=90",
    className:
      "bottom-[5%] left-[4%] lg:bottom-[7%] lg:left-[3%]",
  },
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

      <Navbar />
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

function Hero() {
  return (
    <section className="relative isolate z-20 overflow-hidden bg-surface pt-20 text-onSurface" id="home">
      {/* Background lighting */}
      <div className="pointer-events-none absolute inset-0 -z-20 bg-[radial-gradient(circle_at_73%_43%,rgba(11,73,183,0.09),transparent_34%),radial-gradient(circle_at_18%_23%,rgba(11,73,183,0.045),transparent_30%)]" />

      <div className="pointer-events-none absolute left-[55%] top-[34%] -z-10 h-[620px] w-[620px] rounded-full bg-brandBlue/8 blur-[150px]" />

      <div className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-48 bg-gradient-to-t from-surface via-surface/75 to-transparent" />

      <div className="mx-auto grid min-h-[700px] max-w-[1480px] items-center gap-10 px-5 pb-20 pt-12 md:px-8 lg:grid-cols-[0.82fr_1.18fr] lg:px-10 lg:pb-16 lg:pt-8 xl:px-14">
        {/* Left content */}
        <div className="relative z-20 mx-auto w-full max-w-[610px] text-center lg:mx-0 lg:text-left">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-outline bg-surface px-4 py-2 text-xs font-semibold text-onSurfaceVariant shadow-brandCard">
            <Star
              aria-hidden="true"
              className="fill-[#ffd54a] text-[#ffd54a]"
              size={14}
            />

            Trusted by 1M+ Travelers Worldwide
          </div>

          <h1 className="mx-auto max-w-[590px] font-display text-[44px] font-black leading-[1.04] tracking-[-0.045em] text-brandInk sm:text-[56px] lg:mx-0 lg:text-[61px] xl:text-[68px]">
            Stay Connected
            <br />
            Worldwide with
            <br />

            <span className="bg-gradient-to-r from-brandBlue via-[#0E86C0] to-brandTeal bg-clip-text text-transparent">
              Premium eSIMs
            </span>
          </h1>

          <p className="mx-auto mt-7 max-w-[530px] text-[15px] leading-7 text-onSurfaceVariant sm:text-[17px] lg:mx-0">
            Premium eSIMs with high-speed data in 200+ countries and regions.
            <br className="hidden sm:block" />
            Instant activation. No SIM card. No roaming fees.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row lg:justify-start">
            <LinkButton className="group min-w-[210px]" href="#download-app" size="lg">
              Get eSIM Now

              <ArrowRight
                aria-hidden="true"
                className="transition-transform group-hover:translate-x-1"
                size={19}
              />
            </LinkButton>

            <LinkButton className="min-w-[170px]" href="#plans" size="lg" tone="brand" variant="flat">
              View Plans
            </LinkButton>
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
    <div className="mt-11 flex flex-col items-center gap-5 sm:flex-row sm:justify-center sm:gap-7 lg:justify-start">
      <div>
        <p className="mb-3 text-xs font-medium text-onSurfaceVariant">
          Trusted by travelers from
        </p>

        <div className="flex justify-center -space-x-2 lg:justify-start">
          {travelerImages.map((image, index) => (
            <div
              className="h-10 w-10 overflow-hidden rounded-full border-2 border-surface bg-outline/20 shadow-[0_6px_14px_rgba(0,0,0,0.12)]"
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
        <p className="mb-2 text-xs text-onSurfaceVariant">
          and 50,000+ reviews
        </p>

        <div className="flex items-center justify-center gap-3 lg:justify-start">
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

          <span className="text-xs font-semibold text-onSurface">
            4.8/5
          </span>
        </div>
      </div>
    </div>
  );
}

function HeroVisual() {
  return (
    <div className="relative mx-auto h-[520px] w-full max-w-[850px] sm:h-[610px] lg:h-[660px]">
      {/* Main glow */}
      <div className="pointer-events-none absolute left-1/2 top-[49%] h-[65%] w-[76%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brandBlue/9 blur-[100px]" />

      {/* Orbit lines */}
      <div className="pointer-events-none absolute left-1/2 top-[48%] hidden h-[500px] w-[740px] -translate-x-1/2 -translate-y-1/2 rounded-[50%] border border-brandBlue/15 sm:block" />

      <div className="pointer-events-none absolute left-1/2 top-[51%] hidden h-[390px] w-[610px] -translate-x-1/2 -translate-y-1/2 rounded-[50%] border border-brandBlue/10 sm:block" />

      {/* Premium phone and map artwork */}
      <Image
        alt="eSim2you mobile application with worldwide coverage"
        className="pointer-events-none absolute left-1/2 top-1/2 z-10 w-[610px] max-w-none -translate-x-1/2 -translate-y-[48%] object-contain drop-shadow-[0_40px_65px_rgba(0,0,0,0.6)] sm:w-[750px] lg:w-[850px]"
        height={638}
        priority
        sizes="(max-width: 1024px) 100vw, 850px"
        src="/images/hero-map.webp"
        width={850}
      />

      {/* Country bubbles */}
      {heroDestinations.map((destination) => (
        <DestinationBubble
          city={destination.city}
          className={destination.className}
          country={destination.country}
          flag={destination.flag}
          image={destination.image}
          key={destination.city}
        />
      ))}

      {/* Coverage card */}
      <FeatureCard
        className="bottom-[18%] left-[1%] lg:bottom-[17%] lg:left-[2%]"
        description="Worldwide Coverage"
        icon={<Globe2 size={22} />}
        title={
          <>
            200+
            <br />
            Countries
          </>
        }
      />

      {/* Activation card */}
      <FeatureCard
        className="right-[0%] top-[31%] lg:right-[-2%] lg:top-[30%]"
        description="In Under 1 Minute"
        icon={<Zap size={22} />}
        title={
          <>
            Instant
            <br />
            Activation
          </>
        }
      />

      {/* Plans card */}
      <FeatureCard
        className="bottom-[13%] right-[4%] lg:bottom-[13%] lg:right-[2%]"
        description="1GB to Unlimited"
        icon={<SlidersHorizontal size={22} />}
        title={
          <>
            Flexible
            <br />
            Data Plans
          </>
        }
      />
    </div>
  );
}

type DestinationBubbleProps = {
  city: string;
  country: string;
  flag: string;
  image: string;
  className: string;
};

function DestinationBubble({
  city,
  country,
  flag,
  image,
  className,
}: DestinationBubbleProps) {
  return (
    <div
      className={`absolute z-30 hidden items-center gap-3 sm:flex ${className}`}
    >
      <div className="h-[68px] w-[68px] overflow-hidden rounded-full border-2 border-brandBlue/50 bg-surface p-1 shadow-[0_0_30px_rgba(11,73,183,0.18)]">
        <Image
          alt={`${city}, ${country}`}
          className="h-full w-full rounded-full object-cover"
          height={60}
          loading="lazy"
          referrerPolicy="no-referrer"
          src={image}
          width={60}
        />
      </div>

      <div className="min-w-[92px]">
        <p className="flex items-center gap-1.5 text-sm font-semibold text-onSurface">
          <span>{flag}</span>
          {city}
        </p>

        <p className="mt-1 text-xs text-onSurfaceVariant">
          {country}
        </p>
      </div>
    </div>
  );
}

type FeatureCardProps = {
  title: React.ReactNode;
  description: string;
  icon: React.ReactNode;
  className: string;
};

function FeatureCard({
  title,
  description,
  icon,
  className,
}: FeatureCardProps) {
  return (
    <div
      className={`absolute z-30 hidden w-[145px] rounded-[20px] border border-outline bg-surface p-4 shadow-brandCard backdrop-blur-xl sm:block lg:w-[158px] lg:p-5 ${className}`}
    >
      <div className="grid h-10 w-10 place-items-center rounded-full border border-brandBlue/45 bg-[linear-gradient(145deg,#0B49B7,#0E86C0)] text-white shadow-[0_0_22px_rgba(11,73,183,0.2)]">
        {icon}
      </div>

      <p className="mt-4 text-[17px] font-black leading-[1.2] text-brandInk lg:text-[19px]">
        {title}
      </p>

      <p className="mt-2 text-[11px] leading-4 text-onSurfaceVariant">
        {description}
      </p>
    </div>
  );
}


function Plans() {
  const planTypes = [
    {
      title: "Short Trips",
      subtitle: "For weekends and quick getaways",
      icon: CalendarDays,
      eyebrow: "1–7 days",
      description:
        "Stay connected for navigation, messaging, bookings, and essential travel apps.",
      features: [
        "Flexible short-term validity",
        "Light and medium data options",
        "Instant digital activation",
      ],
      accent:
        "from-brandBlue/13 via-brandBlue/10 to-transparent",
      iconClass:
        "border-brandBlue/50 bg-brandBlue/10 text-brandBlue",
    },
    {
      title: "Longer Journeys",
      subtitle: "For holidays and business travel",
      icon: Plane,
      eyebrow: "8–30 days",
      description:
        "Choose larger data allowances designed for longer stays and frequent daily usage.",
      features: [
        "More data for longer stays",
        "Ideal for work and entertainment",
        "Premium local network access",
      ],
      accent:
        "from-brandBlue/13 via-brandBlue/10 to-transparent",
      iconClass:
        "border-brandBlue/50 bg-brandBlue/10 text-brandBlue",
      highlighted: true,
    },
    {
      title: "Unlimited Data",
      subtitle: "For maximum flexibility abroad",
      icon: InfinityIcon,
      eyebrow: "No data limits",
      description:
        "Browse, stream, navigate, and stay online without monitoring every megabyte.",
      features: [
        "Unlimited data options",
        "Perfect for heavy daily usage",
        "Available in selected destinations",
      ],
      accent:
        "from-brandTeal/10 via-brandTeal/10 to-transparent",
      iconClass:
        "border-brandTeal/50 bg-brandTeal/10 text-brandTeal",
    },
  ];

  return (
    <section
      className="relative z-0 overflow-hidden bg-surface px-5 pb-16 pt-8 text-onSurface md:px-8 md:pb-20"
      id="plans"
    >
      <div className="pointer-events-none absolute left-1/2 top-20 h-72 w-[70%] -translate-x-1/2 rounded-full bg-brandBlue/6 blur-[120px]" />

      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-outline to-transparent" />

      <div className="relative mx-auto max-w-[1280px]">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-outline bg-surface px-4 py-2 shadow-brandCard">
            <Wifi
              aria-hidden="true"
              className="text-brandBlue"
              size={14}
            />

            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-brandBlue">
              Flexible connectivity
            </span>
          </div>

          <h2 className="mt-5 font-display text-3xl font-black tracking-[-0.04em] text-brandInk sm:text-4xl lg:text-[46px]">
            A plan for every kind of journey
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-onSurfaceVariant sm:text-base">
            Select your destination first, then compare the
            available data and validity options for your trip.
          </p>
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {planTypes.map((plan) => {
            const Icon = plan.icon;

            return (
              <article
                className={[
                  "group relative flex min-h-[390px] flex-col overflow-hidden rounded-[24px]",
                  "border bg-surface",
                  "p-6 shadow-brandCard transition duration-300",
                  "hover:-translate-y-1",
                  plan.highlighted
                    ? "border-brandBlue shadow-brandGlow"
                    : "border-outline hover:border-brandBlue/40",
                ].join(" ")}
                key={plan.title}
              >
                <div
                  className={`pointer-events-none absolute inset-x-0 top-0 h-52 bg-gradient-to-b ${plan.accent}`}
                />

                <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full border border-brandBlue/10" />

                <div className="pointer-events-none absolute -right-9 -top-9 h-28 w-28 rounded-full border border-brandBlue/10" />

                {plan.highlighted ? (
                  <span className="absolute right-5 top-5 rounded-full border border-brandBlue/50 bg-brandBlue/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.13em] text-brandBlue">
                    Most popular
                  </span>
                ) : null}

                <div className="relative">
                  <span
                    className={[
                      "grid h-14 w-14 place-items-center rounded-[17px] border",
                      "shadow-[0_12px_32px_rgba(0,0,0,0.22)]",
                      plan.iconClass,
                    ].join(" ")}
                  >
                    <Icon
                      aria-hidden="true"
                      size={27}
                      strokeWidth={2}
                    />
                  </span>

                  <p className="mt-6 text-[10px] font-black uppercase tracking-[0.18em] text-brandBlue">
                    {plan.eyebrow}
                  </p>

                  <h3 className="mt-3 font-display text-2xl font-black tracking-[-0.025em] text-brandInk">
                    {plan.title}
                  </h3>

                  <p className="mt-1 text-sm font-semibold text-onSurfaceVariant">
                    {plan.subtitle}
                  </p>

                  <p className="mt-5 min-h-[72px] text-sm leading-6 text-onSurfaceVariant">
                    {plan.description}
                  </p>
                </div>

                <div className="relative mt-6 border-t border-outline pt-5">
                  <ul className="space-y-3">
                    {plan.features.map((feature) => (
                      <li
                        className="flex items-center gap-3 text-sm text-onSurfaceVariant"
                        key={feature}
                      >
                        <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full border border-brandBlue/40 bg-brandBlue/10 text-brandBlue">
                          <Check
                            aria-hidden="true"
                            size={11}
                            strokeWidth={3}
                          />
                        </span>

                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                {plan.highlighted ? (
                  <LinkButton className="group mt-5 w-full" href="#home" size="md">
                    Find plans for your destination

                    <ArrowRight
                      aria-hidden="true"
                      className="transition-transform group-hover:translate-x-1"
                      size={16}
                    />
                  </LinkButton>
                ) : (
                  <LinkButton className="group mt-5 w-full" href="#home" size="md" tone="brand" variant="flat">
                    Find plans for your destination

                    <ArrowRight
                      aria-hidden="true"
                      className="transition-transform group-hover:translate-x-1"
                      size={16}
                    />
                  </LinkButton>
                )}
              </article>
            );
          })}
        </div>

        {/* <div className="mt-6 flex flex-col items-center justify-between gap-4 rounded-[18px] border border-outline bg-surface px-5 py-4 text-center shadow-brandCard sm:flex-row sm:text-left">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-brandBlue/40 bg-brandBlue/10 text-brandBlue">
              <Globe2 aria-hidden="true" size={19} />
            </span>

            <div>
              <p className="text-sm font-black text-brandInk">
                Plans and prices depend on your destination
              </p>

              <p className="mt-1 text-xs text-onSurfaceVariant">
                Search a country to view live packages and exact
                pricing.
              </p>
            </div>
          </div>

          <a
            className="inline-flex shrink-0 items-center gap-2 text-sm font-black text-brandBlue transition hover:text-brandBlue/70"
            href="#home"
          >
            Search destinations
            <ArrowRight aria-hidden="true" size={16} />
          </a>
        </div> */}
      </div>
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

function JourneyAndCoverage() {
  const cardClassName =
    "relative mt-7 h-auto min-h-[420px] w-full overflow-hidden rounded-[22px] border border-outline bg-surface shadow-brandCard sm:h-[420px]";

  return (
    <section
      className="overflow-hidden bg-surface px-5 py-14 text-onSurface md:px-8 md:py-20"
      id="how-it-works"
    >
      <div className="mx-auto grid max-w-[1320px] items-start gap-12 lg:grid-cols-2 lg:gap-8">
        {/* How it works */}
        <div className="mx-auto w-full max-w-[630px]">
          <div className="text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brandBlue">
              How it works
            </p>

            <h2 className="mt-2 font-display text-3xl font-black text-brandInk">
              3 Simple Steps
            </h2>
          </div>

          <div
            className={`${cardClassName} flex items-center justify-center px-6 py-10 sm:px-8`}
          >
            <div className="pointer-events-none absolute left-1/2 top-1/2 h-[230px] w-[80%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brandBlue/8 blur-[90px]" />

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
                        <span className="h-px flex-1 bg-gradient-to-r from-brandBlue/40 via-brandBlue/55 to-brandBlue/30" />

                        <ArrowRight
                          aria-hidden="true"
                          className="-ml-[2px] shrink-0 text-brandBlue"
                          size={18}
                          strokeWidth={1.7}
                        />
                      </div>
                    )}

                    <div className="relative z-10">
                      <span className="absolute -left-3 -top-3 grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-brandBlue to-[#0E86C0] text-xs font-black text-white shadow-[0_0_22px_rgba(11,73,183,0.35)]">
                        {index + 1}
                      </span>

                      <span className="grid h-[74px] w-[74px] place-items-center rounded-[18px] border border-outline bg-brandBlue/10 text-brandBlue shadow-brandCard">
                        <Icon aria-hidden="true" size={30} strokeWidth={2.2} />
                      </span>
                    </div>

                    <h3 className="mt-5 whitespace-nowrap font-display text-sm font-black text-brandInk">
                      {step.title}
                    </h3>

                    <p className="mt-2 max-w-[165px] text-xs leading-5 text-onSurfaceVariant">
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
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brandBlue">
              Global coverage
            </p>

            <h2 className="mt-2 font-display text-3xl font-black text-brandInk">
              Where Will You Go Next?
            </h2>
          </div>

          <div
            className={`${cardClassName} bg-[image:url('/images/6__.webp')] bg-cover bg-center bg-no-repeat`}
          >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(11,73,183,0.1),transparent_58%)]" />

            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-brandInk/25" />

            <div className="relative z-10 flex h-full items-end p-4 sm:p-5">
              <div className="grid h-[92px] w-full grid-cols-3 overflow-hidden rounded-[18px] border border-outline bg-surface/90 text-center shadow-brandCard backdrop-blur-xl">
                <div className="flex flex-col items-center justify-center px-2">
                  <p className="font-display text-xl font-black text-brandInk sm:text-2xl">
                    200+
                  </p>

                  <p className="mt-1 text-[9px] text-onSurfaceVariant sm:text-[10px]">
                    Countries
                  </p>
                </div>

                <div className="my-4 flex flex-col items-center justify-center border-x border-outline px-2">
                  <p className="font-display text-xl font-black text-brandInk sm:text-2xl">
                    500+
                  </p>

                  <p className="mt-1 text-[9px] text-onSurfaceVariant sm:text-[10px]">
                    Networks
                  </p>
                </div>

                <div className="flex flex-col items-center justify-center px-2">
                  <p className="font-display text-xl font-black text-brandInk sm:text-2xl">
                    99%
                  </p>

                  <p className="mt-1 text-[9px] text-onSurfaceVariant sm:text-[10px]">
                    Global Coverage
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 flex justify-center">
            <LinkButton className="group min-w-[230px]" href="/destinations" size="md" tone="brand" variant="flat">
              <span>View All Destinations</span>

              <ArrowRight
                aria-hidden="true"
                className="shrink-0 transition-transform duration-300 group-hover:translate-x-1"
                size={17}
              />
            </LinkButton>
          </div>
        </div>
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
              src="/images/a6.png"
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
            src="/images/3.webp"
          />

          <div className="pointer-events-none absolute inset-0 rounded-[22px] bg-[linear-gradient(90deg,rgba(6,17,49,0.88)_0%,rgba(6,17,49,0.66)_45%,rgba(6,17,49,0.5)_100%)]" />

          <img
            alt="Traveler using eSim2you in the mountains"
            className="pointer-events-none absolute bottom-0 left-[58%] z-20 hidden h-[145%] max-w-none -translate-x-1/2 object-contain object-bottom md:block lg:left-[60%]"
            loading="lazy"
            referrerPolicy="no-referrer"
            src="/images/4-.png"
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
