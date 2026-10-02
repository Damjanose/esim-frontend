"use client";

import { Globe2 } from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

import {
  coveredDestinationsForOption,
  fetchPackageOptions,
  planCoversDestination,
  type HeroPackageOption,
} from "@/services/packages";
import {
  isDestinationFiltersActive,
  matchesDestinationFilters,
  parseDestinationFiltersFromParams,
} from "@/services/destinationFilters";
import { planRowTags } from "@/lib/planRow";
import { absoluteUrl, createOfferProductJsonLd } from "@/lib/seo";
import { Navbar } from "../components/Navbar";
import { CountryBanner } from "../components/CountryBanner";
import { CollapsedCountryBar } from "../components/CollapsedCountryBar";
import { PlanRow } from "../components/PlanRow";
import { SiteFooter } from "../SiteFooter";
import { JsonLd } from "../JsonLd";
import { visiblePlans, type PlanFilter, type PlanSort } from "./planList";
import { PlanFilterBar } from "./PlanFilterBar";
import { PlansSidebar } from "./PlansSidebar";
import { EmptyFilterState, ErrorState, MissingDestinationState, PlansLoading } from "./PlansStates";
import { useCountryHeroImage } from "./useCountryHeroImage";

type DestinationPlansProps = {
  countryCode: string;
  /** The wizard's `daysMin`/`daysMax`/`dataMin`/`dataMax`/`unlimited` query params, if it handed off a destination. */
  searchFilters?: Record<string, string | undefined>;
};

type CountryOption = {
  country: string;
  countryCode: string;
  flagUri: string;
  planCount: number;
};

function normalizeCountryCode(value: string) {
  return value.trim().toLowerCase().replace(/_/g, "-").replace(/\s+/g, "-");
}

function countryCodesMatch(firstCode: string, secondCode: string) {
  return normalizeCountryCode(firstCode) === normalizeCountryCode(secondCode);
}

function getCountryOptions(packages: readonly HeroPackageOption[]): CountryOption[] {
  const countryMap = new Map<string, CountryOption>();

  for (const plan of packages) {
    const destinations = [
      {
        country: plan.country,
        countryCode: plan.countryCode,
        flagUri: plan.flagUri,
      },
      ...(!plan.filters.includes("local")
        ? coveredDestinationsForOption(plan).map((destination) => ({
            country: destination.title,
            countryCode: destination.slug,
            flagUri: "",
          }))
        : []),
    ];

    for (const destination of destinations) {
      const normalizedCode = normalizeCountryCode(destination.countryCode);
      if (!destination.country.trim() || !normalizedCode) continue;

      const existingCountry = countryMap.get(normalizedCode);
      if (existingCountry) {
        existingCountry.planCount += 1;
        if (!existingCountry.flagUri && destination.flagUri) {
          existingCountry.flagUri = destination.flagUri;
        }
        continue;
      }

      countryMap.set(normalizedCode, {
        country: destination.country,
        countryCode: destination.countryCode,
        flagUri: destination.flagUri,
        planCount: 1,
      });
    }
  }

  return Array.from(countryMap.values()).sort((first, second) => first.country.localeCompare(second.country));
}

/**
 * Live plans for a destination without an /esim page (`/destinations?country=`).
 * Layout follows the app: photo banner, chip filters, plan rows, a sticky
 * sidebar at lg+, and a collapsed country bar on phones.
 */
export function DestinationPlans({ countryCode, searchFilters }: DestinationPlansProps) {
  const [packages, setPackages] = useState<HeroPackageOption[]>([]);
  const [filter, setFilter] = useState<PlanFilter>("all");
  const [sort, setSort] = useState<PlanSort>("recommended");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadPackages() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetchPackageOptions();

        if (active) {
          setPackages(response);
        }
      } catch (loadError) {
        console.error("Failed to load destination plans:", loadError);

        if (active) {
          setError("Available eSIM plans could not be loaded. Please try again shortly.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadPackages();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    setFilter("all");
    setSort("recommended");
  }, [countryCode]);

  const countries = useMemo(() => getCountryOptions(packages), [packages]);

  const selectedCountry = useMemo(
    () => countries.find((country) => countryCodesMatch(country.countryCode, countryCode)),
    [countries, countryCode],
  );

  const wizardFilters = useMemo(() => parseDestinationFiltersFromParams(searchFilters ?? {}), [searchFilters]);
  const wizardFiltersActive = isDestinationFiltersActive(wizardFilters);

  const selectedCountryPlans = useMemo(
    () =>
      packages.filter(
        (plan) => planCoversDestination(plan, countryCode) && matchesDestinationFilters(plan, wizardFilters),
      ),
    [packages, countryCode, wizardFilters],
  );

  const selectedCountryOffer = useMemo(() => {
    const prices = selectedCountryPlans.map((plan) => plan.priceNumeric).filter((price) => price > 0);

    if (prices.length === 0) {
      return null;
    }

    return {
      lowPrice: Math.min(...prices),
      highPrice: Math.max(...prices),
      currency: "EUR",
      offerCount: prices.length,
    };
  }, [selectedCountryPlans]);

  // The list as displayed. Its first row is the Best value (planRowTags position 0).
  const displayedPlans = useMemo(
    () => visiblePlans(selectedCountryPlans, filter, sort),
    [filter, selectedCountryPlans, sort],
  );

  const { image: heroImage, loading: heroImageLoading } = useCountryHeroImage({
    country: selectedCountry?.country,
    slug: selectedCountry?.countryCode ?? countryCode,
  });

  const countryName = loading ? "your destination" : (selectedCountry?.country ?? "your destination");

  return (
    <main className="min-h-screen overflow-x-clip bg-surface text-onSurface">
      {selectedCountry && selectedCountryOffer ? (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            ...createOfferProductJsonLd({
              url: absoluteUrl(`/destinations?country=${countryCode}`),
              name: `${selectedCountry.country} eSIM data plans`,
              description: `Prepaid travel eSIM data plans for ${selectedCountry.country}.`,
              offer: selectedCountryOffer,
            }),
          }}
        />
      ) : null}
      <Navbar />

      <CountryBanner
        credit={
          heroImage?.sourceUrl ? (
            <a className="transition hover:text-surface/80" href={heroImage.sourceUrl} rel="noreferrer" target="_blank">
              Image source: Wikimedia Commons
            </a>
          ) : undefined
        }
        crumb={selectedCountry?.country ?? "Plans"}
        photo={
          heroImage?.imageUrl ? (
            <Image
              alt={heroImage.alt || `${selectedCountry?.country ?? "International"} travel destination`}
              className={`object-cover motion-safe:transition-opacity motion-safe:duration-500 ${
                heroImageLoading ? "opacity-70" : "opacity-100"
              }`}
              fill
              key={heroImage.imageUrl}
              priority
              sizes="100vw"
              src={heroImage.imageUrl}
            />
          ) : undefined
        }
      >
        {heroImageLoading ? (
          <span className="sr-only" role="status">
            Loading destination image
          </span>
        ) : null}

        {/* Fixed-height slots: the flag pill and the price line appear after the catalog loads without moving anything. */}
        <div className="mt-6 flex h-9 items-center">
          {selectedCountry ? (
            <span className="inline-flex h-9 items-center gap-2 rounded-full border border-surface/25 bg-surface/10 pl-1 pr-3 backdrop-blur">
              {selectedCountry.flagUri ? (
                <img
                  alt={`${selectedCountry.country} flag`}
                  className="h-7 w-7 rounded-full border border-surface/20 object-cover"
                  src={selectedCountry.flagUri}
                />
              ) : (
                <span className="grid h-7 w-7 place-items-center">
                  <Globe2 aria-hidden="true" className="text-brandTeal" size={18} />
                </span>
              )}
              <span className="text-label-caps uppercase text-surface">{selectedCountry.country}</span>
            </span>
          ) : (
            <span aria-hidden="true" className="h-9 w-28 rounded-full bg-surface/10" />
          )}
        </div>

        <h1 className="mt-4 max-w-3xl font-display text-[30px] font-black leading-[1.08] tracking-[-0.03em] text-surface sm:text-5xl lg:text-[56px]">
          eSIM plans for
          <span className="block text-brandTeal">{countryName}</span>
        </h1>

        <p className="mt-4 max-w-[470px] text-sm leading-6 text-surface/75 sm:text-base sm:leading-7">
          Fast, reliable data wherever you go.
          <br />
          Choose the plan that fits your journey.
        </p>

        <div className="mt-5 h-9">
          {selectedCountryOffer ? (
            <p className="inline-flex h-9 items-center whitespace-nowrap rounded-full border border-surface/20 bg-surface/10 px-3 text-[11px] font-black text-surface backdrop-blur sm:px-4 sm:text-xs">
              Plans from €{selectedCountryOffer.lowPrice.toFixed(2)} to €{selectedCountryOffer.highPrice.toFixed(2)} ·{" "}
              {selectedCountryOffer.offerCount} plans
            </p>
          ) : null}
        </div>
      </CountryBanner>

      {selectedCountry ? (
        <CollapsedCountryBar
          country={selectedCountry.country}
          flagUri={selectedCountry.flagUri || undefined}
          fromPrice={selectedCountryOffer ? `€${selectedCountryOffer.lowPrice.toFixed(2)}` : undefined}
        />
      ) : null}

      <section className="mx-auto max-w-6xl px-5 pb-16 pt-6 md:px-8 md:pb-24 md:pt-8">
        {loading ? (
          <PlansLoading withFilters={!wizardFiltersActive} />
        ) : error ? (
          <ErrorState message={error} />
        ) : selectedCountry && selectedCountryPlans.length > 0 ? (
          <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start lg:gap-8">
            <div className="min-w-0">
              {!wizardFiltersActive ? (
                <PlanFilterBar filter={filter} onFilterChange={setFilter} onSortChange={setSort} sort={sort} />
              ) : null}

              {displayedPlans.length > 0 ? (
                <ul className="mt-4 grid grid-cols-1 gap-3">
                  {displayedPlans.map((plan, index) => (
                    <li key={plan.id}>
                      <PlanRow
                        buyHref={`/checkout?package=${encodeURIComponent(plan.id)}`}
                        plan={plan}
                        tags={planRowTags(plan, { position: index })}
                      />
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyFilterState onReset={() => setFilter("all")} />
              )}
            </div>

            <div className="mt-8 lg:sticky lg:top-6 lg:mt-0">
              <PlansSidebar plansCount={selectedCountryPlans.length} />
            </div>
          </div>
        ) : (
          <MissingDestinationState />
        )}
      </section>

      <SiteFooter />
    </main>
  );
}
