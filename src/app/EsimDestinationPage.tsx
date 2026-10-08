import { ArrowRight, CheckCircle2, CircleHelp } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { JsonLd } from "./JsonLd";
import { Navbar } from "./components/Navbar";
import { LinkButton } from "./components/Button";
import { CountryBanner } from "./components/CountryBanner";
import { CollapsedCountryBar } from "./components/CollapsedCountryBar";
import { PlanBuyLink, PlanDataDisc, PlanPrice, PlanTags } from "./components/PlanRow";
import { SiteFooter } from "./SiteFooter";
import { landingContent } from "@/content/landing";
import { priorityDestinationEnhancements, type SeoContentPage } from "@/content/seo-pages";
import { destinationAnswerFaq } from "@/lib/destination-answer";
import { destinationDisplay, destinationH1 } from "@/lib/esim-routes";
import { destinationGuideLinks, relatedDestinationLinks } from "@/lib/internal-links";
import {
  createContentPageJsonLd,
  type DestinationOfferInput
} from "@/lib/seo";
import type { DestinationPlanRow } from "@/lib/destinationPricing";
import type { DestinationMedia } from "@/lib/destinationMedia";
import { isOptimizableImageUrl } from "./destinations/countryImageCache";
import { convertEurToGbp, formatGbp } from "@/lib/exchangeRate";
import { hasBestValueTag, planDurationText, planRowTags } from "@/lib/planRow";

function trustPoints(offer?: DestinationOfferInput) {
  return [
    ["Live plan pricing", offer ? `${offer.offerCount} options available` : "Compare current options"],
    ["Ready before you land", "Install on stable Wi-Fi"],
    ["Data-first travel", "Keep your usual number"]
  ];
}

/*
 * Plan table cells. Phones: each row is a PlanRow-style card (display:grid), so
 * the table, its rows and cells carry explicit ARIA roles: changing a table's
 * display drops its semantics in some browsers (Safari) otherwise. sm+: a real
 * table with border-separate card rows.
 */
const CELL = "p-0 sm:border-y sm:bg-surface sm:px-4 sm:py-3 sm:align-middle";
const FIRST_CELL = "sm:rounded-l-[18px] sm:border-l";
const LAST_CELL = "sm:rounded-r-[18px] sm:border-r";

export function EsimDestinationPageView({
  page,
  offer,
  plans,
  coverage = [],
  gbpRate,
  flagUri,
  heroImage
}: {
  page: SeoContentPage;
  offer?: DestinationOfferInput;
  plans: DestinationPlanRow[];
  /** Countries every plan covers; only set for regional destinations. */
  coverage?: string[];
  gbpRate?: number;
  /** The destination's flag image, when the catalog has one. */
  flagUri?: string;
  /** The country's photo; without it the banner uses the generic mountain photo. */
  heroImage?: DestinationMedia;
}) {
  const countryName = destinationDisplay[page.slug]?.countryName ?? page.eyebrow;
  const h1 = destinationH1(page.slug) ?? `eSIM for ${countryName}`;
  // "eSIM for <country>": the country name is the H1's teal accent.
  const accentStart = h1.lastIndexOf(countryName);
  const h1Lead = accentStart > 0 ? h1.slice(0, accentStart) : h1;
  const h1Accent = accentStart > 0 ? h1.slice(accentStart) : "";
  const neighborLinks = relatedDestinationLinks(page.slug);
  const guideLinks = destinationGuideLinks(page);
  const lowestPriced = plans[0];
  const coverageNote = destinationDisplay[page.slug]?.coverageNote;
  // Answer-first: the generated "Does eSIM2you work in X?" leads the visible
  // FAQ and the FAQPage schema (both read `faqs`), only when plans are live.
  const answerFaq = destinationAnswerFaq({ countryName, plans, offer });
  const faqs = answerFaq ? [answerFaq, ...page.faqs] : page.faqs;
  const sections = [
    ...page.sections,
    ...(priorityDestinationEnhancements[page.slug] ?? [])
  ];

  return (
    <main className="min-h-screen overflow-x-clip bg-surface text-onSurface">
      <JsonLd
        data={createContentPageJsonLd({
          path: page.path,
          name: h1,
          description: page.description,
          breadcrumbName: countryName,
          parent: { name: "Destinations", path: "/destinations" },
          faqs,
          offer
        })}
      />
      <Navbar />

      <article>
        <CountryBanner
          credit={
            heroImage?.sourceUrl ? (
              <a className="transition hover:text-surface/80" href={heroImage.sourceUrl} rel="noreferrer" target="_blank">
                Image source: Wikimedia Commons
              </a>
            ) : undefined
          }
          crumb={countryName}
          photo={
            <Image
              alt={heroImage ? heroImage.alt || `${countryName} travel destination` : ""}
              className="object-cover"
              fetchPriority="high"
              fill
              priority
              sizes="100vw"
              src={heroImage?.imageUrl ?? "/images/mountain.webp"}
              unoptimized={heroImage ? !isOptimizableImageUrl(heroImage.imageUrl) : false}
            />
          }
        >
          <div className="mt-6 flex items-center gap-3">
            {flagUri ? (
              <img
                alt={`${countryName} flag`}
                className="h-8 w-8 shrink-0 rounded-full border border-surface/30 object-cover"
                src={flagUri}
              />
            ) : null}
            <p className="text-label-caps uppercase text-brandTeal">{page.eyebrow}</p>
          </div>
          <h1 className="mt-3 max-w-4xl font-display text-[34px] font-black leading-[1.08] tracking-[-0.03em] text-surface sm:text-5xl lg:text-[56px]">
            {h1Lead}
            {h1Accent ? <span className="text-brandTeal">{h1Accent}</span> : null}
          </h1>
          <p className="mt-3 max-w-3xl text-lg font-semibold text-surface/90">{page.heading}</p>
          {offer ? (
            <p className="mt-5 inline-flex flex-wrap items-center gap-x-1 rounded-full border border-surface/20 bg-surface/10 px-4 py-2 text-sm font-black text-surface backdrop-blur">
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
            <p className="mt-2 text-xs font-semibold text-surface/60">
              Approximate GBP conversion, updated daily. You&apos;re charged in EUR at checkout.
            </p>
          ) : null}
          <p className="mt-5 max-w-3xl text-base leading-7 text-surface/75 sm:text-lg sm:leading-8">{page.intro}</p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            {/* Flat: the best-value row's Buy now is this page's one gradient CTA. */}
            <LinkButton href="#plans" size="lg" variant="tint">
              {offer ? `Buy from €${offer.lowPrice.toFixed(2)}` : "View plans"}
              <ArrowRight aria-hidden="true" size={18} />
            </LinkButton>
            <LinkButton href={landingContent.appLinks.ios.href} size="lg" variant="tint">
              {landingContent.appLinks.ios.label}
              <ArrowRight aria-hidden="true" size={18} />
            </LinkButton>
          </div>
        </CountryBanner>

        <CollapsedCountryBar
          country={countryName}
          flagUri={flagUri}
          fromPrice={offer ? `€${offer.lowPrice.toFixed(2)}` : undefined}
        />

        <section className="px-5 py-10 md:px-8 md:py-16" id="plans">
          <div className="mx-auto max-w-6xl lg:grid lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start lg:gap-8">
            <div className="min-w-0">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-label-caps uppercase text-brandBlue">Plan comparison</p>
                  <h2 className="mt-2 font-display text-display-lg font-black text-brandInk md:text-[32px] md:leading-[38px]">
                    Live {countryName} eSIM plans
                  </h2>
                </div>
                <span className="w-fit rounded-full border border-brandBlue/20 bg-brandBlue/5 px-4 py-2 text-xs font-black text-brandBlue">
                  Current availability
                </span>
              </div>
              <p className="mt-4 max-w-3xl leading-7 text-onSurfaceVariant">
                Prices are what eSIM2you currently sells for this destination. We do not claim these
                are the cheapest on the market. Prefer the lowest-priced row for a short trip, or a
                higher-data / longer-validity row when that matches your itinerary.
              </p>
              {lowestPriced ? (
                <p className="mt-3 text-sm font-bold text-brandInk">
                  Best value starting point: {lowestPriced.dataLabel} for {lowestPriced.durationLabel} at{" "}
                  {lowestPriced.price}.
                </p>
              ) : null}

              {/* `relative` keeps the sr-only (absolute) caption, "Buy" header and phone thead
                  inside this scroller; without it they escape to the page and widen the mobile
                  layout viewport (375px phones rendered /esim/* at 479px, f195). */}
              {plans.length > 0 ? (
                <div className="relative mt-8 overflow-x-auto">
                  <table className="block w-full text-left text-sm sm:table sm:border-separate sm:border-spacing-y-2" role="table">
                    <caption className="sr-only">
                      {countryName} eSIM plans with data, validity, network, and price
                    </caption>
                    <thead
                      className="sr-only sm:not-sr-only sm:table-header-group"
                      role="rowgroup"
                    >
                      <tr className="text-label-caps uppercase text-onSurfaceVariant" role="row">
                        <th className="px-4 pb-1" role="columnheader" scope="col">
                          Data
                        </th>
                        <th className="px-4 pb-1" role="columnheader" scope="col">
                          Plan
                        </th>
                        <th className="px-4 pb-1" role="columnheader" scope="col">
                          Validity
                        </th>
                        <th className="px-4 pb-1" role="columnheader" scope="col">
                          Network
                        </th>
                        <th className="px-4 pb-1 text-right" role="columnheader" scope="col">
                          Price
                        </th>
                        <th className="px-4 pb-1" role="columnheader" scope="col">
                          <span className="sr-only">Buy</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="grid gap-2 sm:table-row-group" role="rowgroup">
                      {plans.map((plan, index) => {
                        const tags = planRowTags(plan, { position: index });
                        const bestValue = hasBestValueTag(tags);
                        const border = bestValue ? "border-brandBlue/40" : "border-outline/70";

                        return (
                          <tr
                            className={`grid grid-cols-[48px_minmax(0,1fr)_auto] gap-x-3 gap-y-1 rounded-[18px] border bg-surface p-3 sm:table-row sm:rounded-none sm:border-0 sm:bg-transparent sm:p-0 ${border}`}
                            key={plan.id}
                            role="row"
                          >
                            <td
                              className={`${CELL} ${FIRST_CELL} ${border} col-start-1 row-span-3 row-start-1 self-center`}
                              role="cell"
                            >
                              <PlanDataDisc plan={plan} />
                            </td>
                            <th
                              className={`${CELL} ${border} col-span-2 col-start-2 row-start-1 font-bold text-brandInk`}
                              role="rowheader"
                              scope="row"
                            >
                              {plan.title}
                              <PlanTags className="mt-1" tags={tags} />
                            </th>
                            <td
                              className={`${CELL} ${border} col-start-2 row-start-2 self-center text-xs text-onSurfaceVariant sm:text-sm`}
                              role="cell"
                            >
                              {planDurationText(plan)}
                            </td>
                            <td
                              className={`${CELL} ${border} col-start-2 row-start-3 self-center text-xs text-onSurfaceVariant sm:text-sm`}
                              role="cell"
                            >
                              {plan.network}
                            </td>
                            <td
                              className={`${CELL} ${border} col-start-3 row-start-2 self-center text-right`}
                              role="cell"
                            >
                              <PlanPrice plan={plan} />
                            </td>
                            <td
                              className={`${CELL} ${LAST_CELL} ${border} col-start-3 row-start-3 text-right`}
                              role="cell"
                            >
                              <PlanBuyLink
                                href={`/checkout?package=${encodeURIComponent(plan.id)}`}
                                planTitle={plan.title}
                                primary={bestValue}
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="mt-8 rounded-[20px] border border-outline/70 bg-surfaceBright p-6 text-onSurfaceVariant">
                  Live plans for this destination are loading or temporarily unavailable. Browse all
                  destinations or check back shortly.
                </p>
              )}

              {coverage.length > 0 ? (
                <div className="mt-8 rounded-[26px] border border-outline/70 bg-surfaceBright p-5 md:p-8" id="coverage">
                  <h3 className="font-display text-headline-md font-black text-brandInk">
                    {coverage.length} countries covered by every {countryName} plan
                  </h3>
                  {coverageNote ? (
                    <p className="mt-3 max-w-3xl leading-7 text-onSurfaceVariant">{coverageNote}</p>
                  ) : null}
                  <ul className="mt-5 flex flex-wrap gap-2">
                    {coverage.map((country) => (
                      <li
                        className="rounded-full border border-outline/70 bg-surface px-3 py-1.5 text-sm font-bold text-brandInk"
                        key={country}
                      >
                        {country}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>

            <aside className="mt-8 lg:sticky lg:top-6 lg:mt-0">
              <ul className="grid gap-4 rounded-[20px] border border-outline/70 bg-surface p-5 shadow-brandCard sm:grid-cols-3 lg:grid-cols-1">
                {trustPoints(offer).map(([label, value]) => (
                  <li className="flex items-start gap-3" key={label}>
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[12px] bg-brandBlue/10 text-brandBlue">
                      <CheckCircle2 aria-hidden="true" size={18} />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-black text-brandInk">{label}</span>
                      <span className="mt-0.5 block text-xs font-semibold text-onSurfaceVariant">{value}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </aside>
          </div>
        </section>

        <section className="px-5 pb-16 md:px-8 md:pb-24">
          <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
            <div className="min-w-0 space-y-4">
              {sections.map((section) => (
                <section className="rounded-[20px] border border-outline/70 bg-surface p-5 sm:p-7" key={section.title}>
                  <div className="flex gap-4">
                    <span className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-[12px] bg-brandBlue/10 text-brandBlue">
                      <CheckCircle2 aria-hidden="true" size={20} />
                    </span>
                    <div className="min-w-0">
                      <h2 className="font-display text-headline-md font-black text-brandInk">{section.title}</h2>
                      <p className="mt-2 leading-7 text-onSurfaceVariant">{section.body}</p>
                    </div>
                  </div>
                </section>
              ))}
              <section className="rounded-[20px] border border-outline/70 bg-surface p-5 sm:p-7">
                <h2 className="font-display text-headline-md font-black text-brandInk">How to install</h2>
                <p className="mt-2 leading-7 text-onSurfaceVariant">
                  Check that your phone supports eSIM, install the profile on Wi-Fi before you travel,
                  then enable the travel data line when you arrive. See the{" "}
                  <Link className="font-bold text-brandBlue" href="/travel/how-to-install-esim">
                    travel eSIM installation guide
                  </Link>
                  .
                </p>
              </section>
            </div>

            <aside className="h-fit space-y-4">
              {neighborLinks.length > 0 ? (
                <div className="rounded-[20px] border border-outline/70 bg-surfaceBright p-5 sm:p-6">
                  <h2 className="font-display text-title-sm font-black text-brandInk sm:text-xl">Related destinations</h2>
                  <div className="mt-4 grid gap-2">
                    {neighborLinks.map((link) => (
                      <Link
                        className="flex min-h-11 items-center justify-between gap-3 rounded-[14px] border border-outline/70 bg-surface px-4 py-2.5 text-sm font-bold text-brandInk transition hover:border-brandBlue/50"
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
              <div className="rounded-[20px] border border-outline/70 bg-surfaceBright p-5 sm:p-6">
                <h2 className="font-display text-title-sm font-black text-brandInk sm:text-xl">Guides</h2>
                <div className="mt-4 grid gap-2">
                  {guideLinks.map((link) => (
                    <Link
                      className="flex min-h-11 items-center justify-between gap-3 rounded-[14px] border border-outline/70 bg-surface px-4 py-2.5 text-sm font-bold text-brandInk transition hover:border-brandBlue/50"
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

        <section className="bg-surfaceBright px-5 py-16 md:px-8 md:py-24">
          <div className="mx-auto max-w-3xl">
            <p className="text-center text-label-caps uppercase text-brandBlue">FAQ</p>
            <h2 className="mt-2 text-center font-display text-display-lg font-black text-brandInk md:text-[32px] md:leading-[38px]">
              Quick answers before you travel.
            </h2>
            <div className="mt-8 space-y-3">
              {faqs.map((faq) => (
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
        </section>
      </article>
      <SiteFooter />
    </main>
  );
}
