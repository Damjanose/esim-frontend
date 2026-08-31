"use client";

import { Globe2, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
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
];

const EMPTY_GROUPS: PackageGroupOptions = {
  popular: [],
  bestValue: [],
  unlimited: [],
  longStay: [],
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
};

export function DestinationBrowse({ urlFilters }: DestinationBrowseProps) {
  const router = useRouter();
  const [packages, setPackages] = useState<HeroPackageOption[]>([]);
  const [groups, setGroups] = useState<PackageGroupOptions>(EMPTY_GROUPS);
  const [loading, setLoading] = useState(true);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [gridSearch, setGridSearch] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        setLoading(true);
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
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, []);

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
      router.push(`/destinations?country=${encodeURIComponent(result.countryCode)}`);
      return;
    }

    const params = wizardFiltersToQueryParams(result);
    const query = params.toString();
    router.push(query ? `/destinations?${query}` : "/destinations");
  }

  return (
    <section className="relative px-5 pb-20 pt-4 md:px-8">
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
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brandBlue to-brandTeal px-5 py-3 text-xs font-black uppercase tracking-wide text-white shadow-brandCard transition hover:opacity-90"
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
