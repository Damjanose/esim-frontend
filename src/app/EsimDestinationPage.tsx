import { ArrowRight, CheckCircle2, CircleHelp } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { JsonLd } from "./JsonLd";
import { Navbar } from "./components/Navbar";
import { LinkButton } from "./components/Button";
import { SiteFooter } from "./SiteFooter";
import { landingContent } from "@/content/landing";
import {
  destinationPages,
  priorityDestinationEnhancements,
  type SeoContentPage
} from "@/content/seo-pages";
import { destinationDisplay, destinationH1 } from "@/lib/esim-routes";
import {
  createContentPageJsonLd,
  type DestinationOfferInput
} from "@/lib/seo";
import type { DestinationPlanRow } from "@/lib/destinationPricing";
import { convertEurToGbp, formatGbp } from "@/lib/exchangeRate";

function relatedDestinationLinks(slug: string) {
  const related = destinationDisplay[slug]?.relatedSlugs ?? [];
  return related
    .map((relatedSlug) => {
      const page = destinationPages.find((entry) => entry.slug === relatedSlug);
      const name = destinationDisplay[relatedSlug]?.countryName;
      if (!page || !name) return null;
      return { href: page.path, label: `${name} eSIM plans` };
    })
    .filter((link): link is { href: string; label: string } => link !== null);
}

export function EsimDestinationPageView({
  page,
  offer,
  plans,
  gbpRate
}: {
  page: SeoContentPage;
  offer?: DestinationOfferInput;
  plans: DestinationPlanRow[];
  gbpRate?: number;
}) {
  const countryName = destinationDisplay[page.slug]?.countryName ?? page.eyebrow;
  const h1 = destinationH1(page.slug) ?? `eSIM for ${countryName}`;
  const neighborLinks = relatedDestinationLinks(page.slug);
  const lowestPriced = plans[0];
  const sections = [
    ...page.sections,
    ...(priorityDestinationEnhancements[page.slug] ?? [])
  ];

  return (
    <main className="min-h-screen overflow-x-hidden bg-surface text-onSurface">
      <JsonLd
        data={createContentPageJsonLd({
          path: page.path,
          name: h1,
          description: page.description,
          breadcrumbName: countryName,
          parent: { name: "Destinations", path: "/destinations" },
          faqs: page.faqs,
          offer
        })}
      />
      <Navbar />

      <article>
        <section className="relative isolate overflow-hidden bg-surface px-5 pb-14 pt-24 md:px-8 md:pb-20">
          <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[26px] bg-brandInk px-6 py-8 text-white shadow-[0_24px_70px_rgba(6,17,49,0.18)] sm:px-10 sm:py-12 lg:px-16 lg:py-14">
            <Image
              alt=""
              className="pointer-events-none absolute inset-0 -z-0 h-full w-full object-cover opacity-30"
              fill
              priority
              sizes="(max-width: 768px) 100vw, 1152px"
              src="/images/mountain.webp"
            />
            <div className="pointer-events-none absolute inset-0 -z-0 bg-[linear-gradient(110deg,rgba(6,17,49,0.98)_0%,rgba(6,17,49,0.88)_48%,rgba(11,73,183,0.52)_100%)]" />
            <div className="pointer-events-none absolute -right-24 -top-28 -z-0 h-72 w-72 rounded-full bg-brandTeal/25 blur-3xl" />
            <div className="relative z-10">
              <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-sm font-bold text-white/65">
              <Link className="transition hover:text-white" href="/">
                Home
              </Link>
              <span aria-hidden="true">/</span>
              <Link className="transition hover:text-white" href="/destinations">
                Destinations
              </Link>
              <span aria-hidden="true">/</span>
              <span className="text-white">{countryName}</span>
              </nav>
              <p className="mt-10 text-sm font-black uppercase tracking-[0.18em] text-brandTeal">{page.eyebrow}</p>
            <h1 className="mt-4 max-w-4xl font-display text-5xl font-black leading-[1.02] tracking-[-0.04em] text-white md:text-7xl">
              {h1}
            </h1>
            <p className="mt-4 max-w-3xl text-xl font-semibold text-white/90">{page.heading}</p>
            {offer ? (
              <p className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-black text-white backdrop-blur">
                Plans from €{offer.lowPrice.toFixed(2)} to €{offer.highPrice.toFixed(2)}
                {gbpRate
                  ? ` (~${formatGbp(convertEurToGbp(offer.lowPrice, gbpRate))}–${formatGbp(
                      convertEurToGbp(offer.highPrice, gbpRate)
                    )})`
                  : ""}
                {offer.offerCount > 0 ? ` · ${offer.offerCount} plans` : ""}
              </p>
            ) : null}
            {offer && gbpRate ? (
              <p className="mt-2 text-xs font-semibold text-white/60">
                Approximate GBP conversion, updated daily. You&apos;re charged in EUR at checkout.
              </p>
            ) : null}
            <p className="mt-6 max-w-3xl text-lg leading-8 text-white/75">{page.intro}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <LinkButton href="#plans" size="lg" tone="brand">
                {offer ? `Buy from €${offer.lowPrice.toFixed(2)}` : "View plans"}
                <ArrowRight aria-hidden="true" size={18} />
              </LinkButton>
              <LinkButton className="border-white/25 bg-white/10 text-white hover:bg-white/20" href={landingContent.appLinks.ios.href} size="lg">
                {landingContent.appLinks.ios.label}
                <ArrowRight aria-hidden="true" size={18} />
              </LinkButton>
            </div>
            <div className="mt-10 grid max-w-3xl gap-3 sm:grid-cols-3">
              {[
                ["Live plan pricing", offer ? `${offer.offerCount} options available` : "Compare current options"],
                ["Ready before you land", "Install on stable Wi-Fi"],
                ["Data-first travel", "Keep your usual number"]
              ].map(([label, value]) => (
                <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur" key={label}>
                  <p className="text-xs font-black text-white">{label}</p>
                  <p className="mt-1 text-xs font-semibold text-white/60">{value}</p>
                </div>
              ))}
            </div>
            </div>
          </div>
        </section>

        <section className="bg-surface px-5 py-12 md:px-8 md:py-20" id="plans">
          <div className="mx-auto max-w-6xl">
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-brandBlue">Plan comparison</p>
                <h2 className="mt-3 font-display text-4xl font-black tracking-[-0.03em] text-brandInk">
                  Live {countryName} eSIM plans
                </h2>
              </div>
              <span className="w-fit rounded-full border border-brandBlue/20 bg-brandBlue/5 px-4 py-2 text-xs font-black text-brandBlue">
                Current availability
              </span>
            </div>
            <p className="max-w-3xl leading-7 text-onSurfaceVariant">
              Prices are what eSIM2you currently sells for this destination. We do not claim these
              are the cheapest on the market. Prefer the lowest-priced row for a short trip, or a
              higher-data / longer-validity row when that matches your itinerary.
            </p>
            {lowestPriced ? (
              <p className="mt-4 text-sm font-bold text-brandInk">
                Best value starting point: {lowestPriced.dataLabel} for {lowestPriced.durationLabel} at{" "}
                {lowestPriced.price}.
              </p>
            ) : null}

            {plans.length > 0 ? (
              <div className="mt-8 overflow-x-auto rounded-[26px] border border-outline bg-white shadow-brandCard">
                <table className="min-w-full text-left text-sm">
                  <caption className="sr-only">
                    {countryName} eSIM plans with data, validity, network, and price
                  </caption>
                  <thead className="bg-gradient-to-r from-brandBlue/10 to-brandTeal/10 font-black text-brandInk">
                    <tr>
                      <th className="px-4 py-3" scope="col">
                        Plan
                      </th>
                      <th className="px-4 py-3" scope="col">
                        Data
                      </th>
                      <th className="px-4 py-3" scope="col">
                        Validity
                      </th>
                      <th className="px-4 py-3" scope="col">
                        Network
                      </th>
                      <th className="px-4 py-3 text-right" scope="col">
                        Price
                      </th>
                      <th className="px-4 py-3" scope="col">
                        <span className="sr-only">Buy</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {plans.map((plan) => (
                      <tr className="border-t border-outline" key={plan.id}>
                        <th className="px-4 py-3 font-bold text-brandInk" scope="row">
                          {plan.title}
                        </th>
                        <td className="px-4 py-3 text-onSurfaceVariant">{plan.dataLabel}</td>
                        <td className="px-4 py-3 text-onSurfaceVariant">{plan.durationLabel}</td>
                        <td className="px-4 py-3 text-onSurfaceVariant">{plan.network}</td>
                        <td className="px-4 py-3 text-right font-black text-brandInk">{plan.price}</td>
                        <td className="px-4 py-3">
                          <Link
                            className="font-black text-brandBlue hover:text-brandTeal"
                            href={`/checkout?package=${encodeURIComponent(plan.id)}`}
                          >
                            Buy
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="mt-8 rounded-xl border border-outline bg-mist p-6 text-onSurfaceVariant">
                Live plans for this destination are loading or temporarily unavailable. Browse all
                destinations or check back shortly.
              </p>
            )}
          </div>
        </section>

        <section className="px-5 pb-16 md:px-8 md:pb-24">
          <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1fr_320px]">
            <div className="space-y-5">
              {sections.map((section) => (
                <section className="rounded-xl border border-outline bg-white p-7 shadow-sm" key={section.title}>
                  <div className="flex gap-4">
                    <span className="mt-1 grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-brandBlue/10 text-brandInk">
                      <CheckCircle2 aria-hidden="true" size={20} />
                    </span>
                    <div>
                      <h2 className="font-display text-2xl font-black text-brandInk">{section.title}</h2>
                      <p className="mt-3 leading-7 text-onSurfaceVariant">{section.body}</p>
                    </div>
                  </div>
                </section>
              ))}
              <section className="rounded-xl border border-outline bg-white p-7 shadow-sm">
                <h2 className="font-display text-2xl font-black text-brandInk">How to install</h2>
                <p className="mt-3 leading-7 text-onSurfaceVariant">
                  Check that your phone supports eSIM, install the profile on Wi-Fi before you travel,
                  then enable the travel data line when you arrive. See the{" "}
                  <Link className="font-bold text-brandBlue" href="/travel/how-to-install-esim">
                    travel eSIM installation guide
                  </Link>
                  .
                </p>
              </section>
            </div>

            <aside className="h-fit space-y-5">
              {neighborLinks.length > 0 ? (
                <div className="rounded-xl border border-outline bg-mist p-6">
                  <h2 className="font-display text-xl font-black text-brandInk">Related destinations</h2>
                  <div className="mt-5 grid gap-3">
                    {neighborLinks.map((link) => (
                      <Link
                        className="flex items-center justify-between gap-3 rounded-lg border border-outline bg-white px-4 py-3 text-sm font-bold text-brandInk transition hover:border-brandBlue/50"
                        href={link.href}
                        key={link.href}
                      >
                        {link.label}
                        <ArrowRight aria-hidden="true" className="shrink-0 text-brandBlue" size={16} />
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null}
              <div className="rounded-xl border border-outline bg-mist p-6">
                <h2 className="font-display text-xl font-black text-brandInk">Guides</h2>
                <div className="mt-5 grid gap-3">
                  {page.relatedLinks.map((link) => (
                    <Link
                      className="flex items-center justify-between gap-3 rounded-lg border border-outline bg-white px-4 py-3 text-sm font-bold text-brandInk transition hover:border-brandBlue/50"
                      href={link.href}
                      key={link.href}
                    >
                      {link.label}
                      <ArrowRight aria-hidden="true" className="shrink-0 text-brandBlue" size={16} />
                    </Link>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </section>

        <section className="bg-mist px-5 py-16 md:px-8 md:py-24">
          <div className="mx-auto max-w-3xl">
            <p className="text-center text-sm font-black uppercase text-brandBlue">FAQ</p>
            <h2 className="mt-3 text-center font-display text-4xl font-black text-brandInk">
              Quick answers before you travel.
            </h2>
            <div className="mt-10 space-y-4">
              {page.faqs.map((faq) => (
                <details className="group rounded-xl border border-outline bg-white p-5 shadow-sm" key={faq.question}>
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display font-black text-brandInk">
                    {faq.question}
                    <CircleHelp
                      aria-hidden="true"
                      className="shrink-0 text-brandBlue transition group-open:rotate-45"
                      size={20}
                    />
                  </summary>
                  <p className="mt-4 leading-7 text-onSurfaceVariant">{faq.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </article>
      <SiteFooter />
    </main>
  );
}
