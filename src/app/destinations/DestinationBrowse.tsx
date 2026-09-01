"use client";

import { Globe2, RefreshCw, Sparkles, WifiOff } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  fetchPackageGroups,
  fetchPackageOptions,
  type HeroPackageOption,
  type PackageGroupOptions,
} from "@/services/packages";
import {
  matchesDestinationFilters,
  parseDestinationFiltersFromParams,
  wizardFiltersToQueryParams,
  type DestinationBrowseFilters,
} from "@/services/destinationFilters";
import { HelpMeChooseWizard, type WizardResult } from "./HelpMeChooseWizard";
import { WizardWelcomeIntro } from "./WizardWelcomeIntro";

/** Minimum time the welcome intro stays on screen before the wizard opens. */
const WELCOME_MIN_DELAY_MS = 2000;

type CountryOption = {
  country: string;
  countryCode: string;
  flagUri: string;
  planCount: number;
  fromPrice: string;
};

type RailDef = {
  id: keyof PackageGroupOptions;
  label: string;
};

const RAILS: RailDef[] = [
  { id: "popular", label: "Popular destinations" },
  { id: "bestValue", label: "Best value" },
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

function normalizeCountryCode(value: string) {
  return value.trim().toLowerCase().replace(/_/g, "-").replace(/\s+/g, "-");
}

function toCountryOptions(packages: readonly HeroPackageOption[]): CountryOption[] {
  const byCode = new Map<string, CountryOption>();

  for (const pkg of packages) {
    const code = normalizeCountryCode(pkg.countryCode);
    if (!code || !pkg.country.trim()) continue;

    const existing = byCode.get(code);
    if (existing) {
      existing.planCount += 1;
      if (!existing.flagUri && pkg.flagUri) existing.flagUri = pkg.flagUri;
      continue;
    }

    byCode.set(code, {
      country: pkg.country,
      countryCode: pkg.countryCode,
      flagUri: pkg.flagUri,
      planCount: 1,
      fromPrice: pkg.price,
    });
  }

  return Array.from(byCode.values()).sort((a, b) => a.country.localeCompare(b.country));
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
  const [packages, setPackages] = useState<HeroPackageOption[]>([]);
  const [groups, setGroups] = useState<PackageGroupOptions>(EMPTY_GROUPS);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
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
  /** Bumped to re-run the load effect when the user clicks "Try again". */
  const [retryCount, setRetryCount] = useState(0);

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
    const q = gridSearch.trim().toLowerCase();
    if (!q) return countries;
    return countries.filter((c) => c.country.toLowerCase().includes(q));
  }, [filteredPackages, gridSearch]);

  function handleWizardFinish(result: WizardResult) {
    setWizardOpen(false);

    if (result.kind === "country") {
      const params = wizardFiltersToQueryParams(result);
      params.set("country", result.countryCode);
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
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-brandBlue">
              Browse destinations
            </p>
            <h2 className="mt-2 font-display text-3xl font-black tracking-[-0.03em] text-brandInk">
              Find your eSIM plan
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <button
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brandBlue to-brandTeal px-5 py-3 text-xs font-black uppercase tracking-wide text-white shadow-brandCard transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={loading}
              onClick={() => setWizardOpen(true)}
              type="button"
            >
              <Sparkles aria-hidden="true" size={15} />
              Help me choose
            </button>
          </div>
        </div>

        {loading ? (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div className="h-24 animate-pulse rounded-[18px] border border-outline bg-mist" key={i} />
            ))}
          </div>
        ) : loadError ? (
          <div className="mt-8 flex flex-col items-center gap-3 rounded-[18px] border border-outline bg-mist px-6 py-10 text-center">
            <span className="grid h-11 w-11 place-items-center rounded-full border border-outline bg-white text-onSurfaceVariant">
              <WifiOff aria-hidden="true" size={20} />
            </span>
            <p className="text-sm font-black text-brandInk">
              Destinations couldn&apos;t be loaded
            </p>
            <p className="max-w-sm text-xs text-onSurfaceVariant">
              We couldn&apos;t reach the eSIM service just now. Check your connection and try
              again.
            </p>
            <button
              className="mt-1 inline-flex items-center gap-2 rounded-full border border-outline bg-white px-4 py-2 text-xs font-black text-brandInk transition hover:border-brandBlue/50"
              onClick={handleRetry}
              type="button"
            >
              <RefreshCw aria-hidden="true" size={14} />
              Try again
            </button>
          </div>
        ) : (
          <>
            {RAILS.map((rail) => {
              const items = groups[rail.id];
              if (items.length === 0) return null;

              return (
                <div className="mt-8" key={rail.id}>
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-onSurfaceVariant">
                    {rail.label}
                  </p>
                  <div className="mt-3 flex gap-3 overflow-x-auto pb-1">
                    {items.map((pkg) => (
                      <Link
                        className="group flex min-w-[160px] shrink-0 items-center gap-3 rounded-[16px] border border-outline bg-white px-4 py-3 shadow-brandCard transition hover:border-brandBlue/50"
                        href={`/destinations?country=${encodeURIComponent(pkg.countryCode)}`}
                        key={pkg.id}
                      >
                        {pkg.flagUri ? (
                          <img
                            alt=""
                            className="h-9 w-9 shrink-0 rounded-full border border-outline object-cover"
                            src={pkg.flagUri}
                          />
                        ) : (
                          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brandBlue/10 text-brandBlue">
                            <Globe2 aria-hidden="true" size={16} />
                          </span>
                        )}
                        <div className="min-w-0">
                          <p className="truncate text-sm font-black text-brandInk">{pkg.country}</p>
                          <p className="text-xs font-bold text-onSurfaceVariant">from {pkg.price}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}

            <div className="mt-10">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-onSurfaceVariant">
                  All destinations ({filteredCountries.length})
                </p>
                <input
                  className="w-full max-w-[260px] rounded-full border border-outline bg-white px-4 py-2 text-sm font-semibold text-onSurface outline-none focus:border-brandBlue"
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
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {filteredCountries.map((country) => (
                    <Link
                      className="flex items-center gap-3 rounded-[16px] border border-outline bg-white px-4 py-3 transition hover:border-brandBlue/50"
                      href={`/destinations?country=${encodeURIComponent(country.countryCode)}`}
                      key={country.countryCode}
                    >
                      {country.flagUri ? (
                        <img
                          alt=""
                          className="h-9 w-9 shrink-0 rounded-full border border-outline object-cover"
                          src={country.flagUri}
                        />
                      ) : (
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brandBlue/10 text-brandBlue">
                          <Globe2 aria-hidden="true" size={16} />
                        </span>
                      )}
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black text-brandInk">{country.country}</p>
                        <p className="text-xs font-bold text-onSurfaceVariant">
                          {country.planCount} {country.planCount === 1 ? "plan" : "plans"}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
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
