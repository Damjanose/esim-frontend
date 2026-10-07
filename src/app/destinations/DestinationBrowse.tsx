"use client";

import { ArrowDownUp, ChevronDown, ChevronUp, RefreshCw, Sparkles, WifiOff } from "lucide-react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  fetchPackageGroups,
  fetchPackageOptions,
  normalizeDestinationValue,
  type HeroPackageOption,
  type PackageGroupOptions,
} from "@/services/packages";
import {
  matchesDestinationFilters,
  parseDestinationFiltersFromParams,
  wizardFiltersToQueryParams,
  type DestinationBrowseFilters,
} from "@/services/destinationFilters";
import { destinationBrowseHref } from "@/lib/esim-routes";
import { Button } from "../components/Button";
import { useConsent } from "../ConsentManager";
import { BrowseSkeleton } from "./BrowseSkeleton";
import { toCountryOptions } from "./browseCountries";
import { CountryRow } from "./CountryRow";
import type { WizardResult } from "./HelpMeChooseWizard";
import { PhotoTile } from "./PhotoTile";
import { onPlanWizardRequest } from "./planWizardOpener";
import { TileCarousel } from "./TileCarousel";
import { WizardWelcomeIntro } from "./WizardWelcomeIntro";

const HelpMeChooseWizard = dynamic(
  () => import("./HelpMeChooseWizard").then((module) => module.HelpMeChooseWizard),
  { ssr: false },
);

/** Minimum time the welcome intro stays on screen before the wizard opens. */
const WELCOME_MIN_DELAY_MS = 2000;
const DESTINATIONS_COLLAPSED_COUNT = 20;

type RailDef = {
  id: keyof PackageGroupOptions;
  label: string;
};

type TrendingSortOption = "recommended" | "price-low" | "price-high" | "duration";

const RAILS: RailDef[] = [
  { id: "popular", label: "Popular destinations" },
  { id: "bestValue", label: "Featured plans" },
  { id: "unlimited", label: "Unlimited data" },
  { id: "longStay", label: "Long stay (30+ days)" },
  { id: "regional", label: "Regional & global bundles" },
];

const EMPTY_GROUPS: PackageGroupOptions = {
  popular: [],
  bestValue: [],
  unlimited: [],
  longStay: [],
  regional: [],
};

function isUnlimitedPlan(plan: HeroPackageOption) {
  return (
    plan.dataNumericGb >= 999 ||
    plan.dataLabel.toLowerCase().includes("unlimited") ||
    plan.title.toLowerCase().includes("unlimited")
  );
}

function getPlanValueScore(plan: HeroPackageOption) {
  if (plan.priceNumeric <= 0) return 0;
  if (isUnlimitedPlan(plan)) {
    return Math.max(plan.durationDays, 1) / plan.priceNumeric;
  }
  return Math.max(plan.dataNumericGb, 0.1) / plan.priceNumeric;
}

type DestinationBrowseProps = {
  /** Wizard filters carried in from the URL (see `parseDestinationFiltersFromParams`). */
  urlFilters: Record<string, string | undefined>;
  /**
   * Opens the "Help me choose" wizard as soon as this component mounts,
   * instead of waiting for the button to be clicked — used on the homepage
   * only. `/destinations` keeps the button-only behavior (`false`, the
   * default) since a visitor already navigated there to browse.
   */
  autoOpenWizard?: boolean;
};

export function DestinationBrowse({ urlFilters, autoOpenWizard = false }: DestinationBrowseProps) {
  const router = useRouter();
  const { setSuggestionModalOpen } = useConsent();
  const [packages, setPackages] = useState<HeroPackageOption[]>([]);
  const [groups, setGroups] = useState<PackageGroupOptions>(EMPTY_GROUPS);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  /**
   * Set by an outside "open the wizard" request (the homepage hero's tune
   * button, via planWizardOpener). Held until the fetch settles, for the same
   * reason the Help me choose button is disabled while loading.
   */
  const [wizardRequested, setWizardRequested] = useState(false);
  /**
   * Shown instead of the wizard for the first `WELCOME_MIN_DELAY_MS` on an
   * auto-opened wizard, so it doesn't just snap open the instant the page
   * loads. Also gates the actual wizard open on data having finished
   * loading (see the effect below) — opening it before `packages` has
   * arrived would show "No destination found" for every real query.
   */
  const [showWelcome, setShowWelcome] = useState(autoOpenWizard);
  const [welcomeMinDelayDone, setWelcomeMinDelayDone] = useState(false);
  const [gridSearch, setGridSearch] = useState("");
  const [showAllDestinations, setShowAllDestinations] = useState(false);
  const [trendingSort, setTrendingSort] = useState<TrendingSortOption>("recommended");
  /** Bumped to re-run the load effect when the user clicks "Try again". */
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    setSuggestionModalOpen(showWelcome || wizardOpen);
    return () => setSuggestionModalOpen(false);
  }, [setSuggestionModalOpen, showWelcome, wizardOpen]);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        setLoading(true);
        setLoadError(false);
        const [packageOptions, groupOptions] = await Promise.all([
          fetchPackageOptions(),
          fetchPackageGroups(),
        ]);
        if (active) {
          setPackages(packageOptions);
          setGroups(groupOptions);
        }
      } catch (error) {
        console.error("Failed to load marketplace destinations:", error);
        if (active) setLoadError(true);
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [retryCount]);

  const handleRetry = useCallback(() => setRetryCount((count) => count + 1), []);

  // Minimum time the welcome intro stays visible, independent of how fast
  // (or slow) the data fetch settles.
  useEffect(() => {
    if (!showWelcome) return;
    const timer = setTimeout(() => setWelcomeMinDelayDone(true), WELCOME_MIN_DELAY_MS);
    return () => clearTimeout(timer);
  }, [showWelcome]);

  // Once both the minimum delay has elapsed AND the fetch has settled,
  // hand off from the welcome intro to the actual wizard — never open it
  // while `packages` is still empty, or every destination search would
  // come back "No destination found" regardless of what was typed.
  useEffect(() => {
    if (!showWelcome || !welcomeMinDelayDone || loading) return;
    setShowWelcome(false);
    if (!loadError) setWizardOpen(true);
  }, [showWelcome, welcomeMinDelayDone, loading, loadError]);

  useEffect(() => onPlanWizardRequest(() => setWizardRequested(true)), []);

  // Same rule as the manual button (enabled once loading is false), so an
  // early click on the hero tune button opens the wizard as soon as the
  // destinations have arrived instead of showing "No destination found".
  useEffect(() => {
    if (!wizardRequested || loading) return;
    setWizardRequested(false);
    setWizardOpen(true);
  }, [wizardRequested, loading]);

  const filters: DestinationBrowseFilters = useMemo(
    () => parseDestinationFiltersFromParams(urlFilters),
    [urlFilters],
  );

  const allCountries = useMemo(() => toCountryOptions(packages), [packages]);

  const filteredPackages = useMemo(
    () => packages.filter((pkg) => matchesDestinationFilters(pkg, filters)),
    [packages, filters],
  );

  const filteredCountries = useMemo(() => {
    const countries = toCountryOptions(filteredPackages);
    const q = normalizeDestinationValue(gridSearch);
    if (!q) return countries;
    return countries.filter((c) =>
      normalizeDestinationValue(`${c.country} ${c.countryCode}`).includes(q),
    );
  }, [filteredPackages, gridSearch]);

  const trendingPackages = useMemo(() => {
    const plans = filteredPackages.filter((pkg) => pkg.trending === true);
    return [...plans].sort((first, second) => {
      switch (trendingSort) {
        case "price-low":
          return first.priceNumeric - second.priceNumeric;
        case "price-high":
          return second.priceNumeric - first.priceNumeric;
        case "duration":
          return second.durationDays - first.durationDays;
        default:
          return getPlanValueScore(second) - getPlanValueScore(first);
      }
    });
  }, [filteredPackages, trendingSort]);

  const isGridSearching = gridSearch.trim().length > 0;
  const visibleCountries =
    isGridSearching || showAllDestinations
      ? filteredCountries
      : filteredCountries.slice(0, DESTINATIONS_COLLAPSED_COUNT);
  const hasMoreDestinations = !isGridSearching && filteredCountries.length > DESTINATIONS_COLLAPSED_COUNT;

  function handleWizardFinish(result: WizardResult) {
    setWizardOpen(false);

    if (result.kind === "country") {
      const params = wizardFiltersToQueryParams(result);
      params.set("country", result.countryCode);
      const esimPath = destinationBrowseHref(result.countryCode);
      if (esimPath.startsWith("/esim/")) {
        const filterQuery = wizardFiltersToQueryParams(result).toString();
        router.push(filterQuery ? `${esimPath}?${filterQuery}` : esimPath);
        return;
      }
      router.push(`/destinations?${params.toString()}`);
      return;
    }

    const params = wizardFiltersToQueryParams(result);
    const query = params.toString();
    router.push(query ? `/destinations?${query}` : "/destinations");
  }

  return (
    <section className="relative px-5 pb-20 pt-4 md:px-8" id="plans">
      <div className="relative mx-auto max-w-[1180px]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-display text-display-lg font-black text-brandInk md:text-[32px] md:leading-[38px]">
              Find your eSIM plan
            </h2>
          </div>

          {/* This section's one gradient primary (spec §3). Arrows, Show all and Try again are flat. */}
          <Button
            className="self-start sm:self-auto"
            disabled={loading}
            onClick={() => setWizardOpen(true)}
            type="button"
          >
            <Sparkles aria-hidden="true" size={16} />
            Help me choose
          </Button>
        </div>

        {loading ? (
          <BrowseSkeleton />
        ) : loadError ? (
          <div className="mt-8 flex flex-col items-center gap-3 rounded-[20px] border border-outline/70 bg-surfaceBright px-6 py-10 text-center">
            <span className="grid h-11 w-11 place-items-center rounded-full border border-outline bg-surface text-onSurfaceVariant">
              <WifiOff aria-hidden="true" size={20} />
            </span>
            <p className="text-sm font-black text-brandInk">
              Destinations couldn&apos;t be loaded
            </p>
            <p className="max-w-sm text-xs text-onSurfaceVariant">
              We couldn&apos;t reach the eSIM service just now. Check your connection and try
              again.
            </p>
            <Button className="mt-1" onClick={handleRetry} type="button" variant="tint">
              <RefreshCw aria-hidden="true" size={14} />
              Try again
            </Button>
          </div>
        ) : (
          <>
            {trendingPackages.length > 0 ? (
              <TileCarousel
                controls={
                  <label className="flex h-11 w-fit items-center gap-2 rounded-full border border-outline bg-surface px-4">
                    <ArrowDownUp aria-hidden="true" className="text-brandBlue" size={14} />
                    <span className="text-xs font-bold text-onSurfaceVariant">Sort</span>
                    <select
                      className="bg-surface text-xs font-black text-brandInk outline-none"
                      onChange={(event) => setTrendingSort(event.target.value as TrendingSortOption)}
                      value={trendingSort}
                    >
                      <option value="recommended">Recommended</option>
                      <option value="price-low">Price: low to high</option>
                      <option value="price-high">Price: high to low</option>
                      <option value="duration">Longest validity</option>
                    </select>
                  </label>
                }
                heading={<TrendingHeading count={trendingPackages.length} />}
                label="Trending now"
                resetKey={trendingSort}
              >
                {trendingPackages.map((pkg) => (
                  <li className="shrink-0 snap-start" key={pkg.id}>
                    <PhotoTile
                      country={pkg.country}
                      countryCode={pkg.countryCode}
                      detail={`${pkg.dataLabel} · ${pkg.durationLabel} · from ${pkg.price}`}
                      flagUri={pkg.flagUri}
                      href={destinationBrowseHref(pkg.countryCode)}
                      size="trending"
                    />
                  </li>
                ))}
              </TileCarousel>
            ) : null}

            {RAILS.map((rail) => {
              const items = groups[rail.id];
              if (items.length === 0) return null;

              return (
                <TileCarousel
                  heading={<h3 className="font-display text-title-sm text-brandInk">{rail.label}</h3>}
                  key={rail.id}
                  label={rail.label}
                >
                  {items.map((pkg) => (
                    <li className="shrink-0 snap-start" key={pkg.id}>
                      <PhotoTile
                        country={pkg.country}
                        countryCode={pkg.countryCode}
                        detail={`from ${pkg.price}`}
                        flagUri={pkg.flagUri}
                        href={destinationBrowseHref(pkg.countryCode)}
                        size="rail"
                      />
                    </li>
                  ))}
                </TileCarousel>
              );
            })}

            <div className="mt-10">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="font-display text-title-sm text-brandInk">
                  All destinations ({filteredCountries.length})
                </h3>
                <input
                  aria-label="Search all destinations"
                  className="h-11 w-full rounded-full border border-outline bg-surface px-4 text-sm font-semibold text-onSurface outline-none transition placeholder:text-onSurfaceVariant/70 focus:border-brandBlue sm:max-w-[280px]"
                  onChange={(e) => setGridSearch(e.target.value)}
                  placeholder="Search all destinations..."
                  type="text"
                  value={gridSearch}
                />
              </div>

              {filteredCountries.length === 0 ? (
                <p className="mt-6 text-sm text-onSurfaceVariant">
                  No destinations match these filters.
                </p>
              ) : (
                <>
                  <ul className="mt-4 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                    {visibleCountries.map((country) => (
                      <li className="min-w-0" key={country.countryCode}>
                        <CountryRow
                          country={country.country}
                          flagUri={country.flagUri}
                          fromPrice={country.fromPrice}
                          href={destinationBrowseHref(country.countryCode)}
                          planCount={country.planCount}
                        />
                      </li>
                    ))}
                  </ul>

                  {hasMoreDestinations || showAllDestinations ? (
                    <div className="mt-5 flex justify-center">
                      <Button
                        onClick={() => setShowAllDestinations((prev) => !prev)}
                        type="button"
                        variant="tint"
                      >
                        {showAllDestinations ? (
                          <>
                            Show less
                            <ChevronUp aria-hidden="true" size={16} />
                          </>
                        ) : (
                          <>
                            Show all {filteredCountries.length} destinations
                            <ChevronDown aria-hidden="true" size={16} />
                          </>
                        )}
                      </Button>
                    </div>
                  ) : null}
                </>
              )}
            </div>
          </>
        )}
      </div>

      {showWelcome ? (
        <WizardWelcomeIntro onDismiss={() => setShowWelcome(false)} />
      ) : null}

      {wizardOpen ? (
        <HelpMeChooseWizard
          countries={allCountries}
          onClose={() => setWizardOpen(false)}
          onFinish={handleWizardFinish}
        />
      ) : null}
    </section>
  );
}


/** Trending's carousel heading. Exactly h-9 tall, matching BrowseSkeleton's placeholder (no CLS). */
function TrendingHeading({ count }: { count: number }) {
  return (
    <div className="flex h-9 min-w-0 items-center gap-2">
      <h3 className="font-display text-title-sm text-brandInk">Trending now</h3>
      <span className="truncate text-sm text-onSurfaceVariant">
        {count} plan{count === 1 ? "" : "s"} picked by the team
      </span>
    </div>
  );
}
