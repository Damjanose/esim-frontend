"use client";

import {
  ArrowDownUp,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  CalendarDays,
  Check,
  ChevronDown,
  Database,
  Globe2,
  Headphones,
  Infinity as InfinityIcon,
  Menu,
  Plane,
  Radio,
  Search,
  ShieldCheck,
  Signal,
  Star,
  Wifi,
  X,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type RefObject,
} from "react";

import {
  fetchPackageOptions,
  type HeroPackageOption,
} from "@/services/packages";

type DestinationPlansProps = {
  countryCode: string;
};

type CountryOption = {
  country: string;
  countryCode: string;
  flagUri: string;
  planCount: number;
};

type PlanFilter =
  | "all"
  | "unlimited"
  | "fixed"
  | "short"
  | "medium"
  | "long";

type SortOption =
  | "recommended"
  | "price-low"
  | "price-high"
  | "duration";

type IconComponent = ComponentType<{
  className?: string;
  size?: number;
  strokeWidth?: number;
  "aria-hidden"?: boolean;
}>;

const SEARCH_DEBOUNCE_MS = 250;

const planFilters: Array<{
  value: PlanFilter;
  label: string;
}> = [
  {
    value: "all",
    label: "All plans",
  },
  {
    value: "unlimited",
    label: "Unlimited",
  },
  {
    value: "fixed",
    label: "Fixed data",
  },
  {
    value: "short",
    label: "1–7 days",
  },
  {
    value: "medium",
    label: "8–15 days",
  },
  {
    value: "long",
    label: "16+ days",
  },
];

function normalizeValue(value: string) {
  return value.trim().toLowerCase();
}

function normalizeCountryCode(value: string) {
  return normalizeValue(value)
    .replace(/_/g, "-")
    .replace(/\s+/g, "-");
}

function getDynamicCountryImage(
  countryName: string,
  countryCode: string,
) {
  const normalizedCountry = countryName
    .trim()
    .replace(/\s+/g, ",");

  const normalizedCode = normalizeCountryCode(countryCode);

  /*
   * The lock value keeps the selected image stable instead
   * of returning a different photo after each render.
   */
  const lock = Array.from(normalizedCode).reduce(
    (total, character) =>
      total + character.charCodeAt(0),
    0,
  );

  const searchTerms = encodeURIComponent(
    `${normalizedCountry},travel,landmark,city`,
  );

  return `https://loremflickr.com/1800/850/${searchTerms}?lock=${lock}`;
}

function getFallbackCountryImage(countryCode: string) {
  const lock = Array.from(
    normalizeCountryCode(countryCode),
  ).reduce(
    (total, character) =>
      total + character.charCodeAt(0),
    100,
  );

  return `https://loremflickr.com/1800/850/travel,city,landmark?lock=${lock}`;
}

function isUnlimitedPlan(plan: HeroPackageOption) {
  return (
    plan.dataNumericGb >= 999 ||
    plan.dataLabel.toLowerCase().includes("unlimited")
  );
}

function getPlanValueScore(plan: HeroPackageOption) {
  if (plan.priceNumeric <= 0) {
    return 0;
  }

  if (isUnlimitedPlan(plan)) {
    return plan.durationDays / plan.priceNumeric;
  }

  return plan.dataNumericGb / plan.priceNumeric;
}

function getPlanIcon(
  plan: HeroPackageOption,
): IconComponent {
  if (isUnlimitedPlan(plan)) {
    return InfinityIcon;
  }

  if (plan.dataNumericGb >= 20) {
    return Plane;
  }

  if (plan.dataNumericGb >= 10) {
    return Database;
  }

  return BarChart3;
}

function getDurationText(plan: HeroPackageOption) {
  if (plan.durationDays > 0) {
    return `${plan.durationDays} ${
      plan.durationDays === 1 ? "day" : "days"
    }`;
  }

  return plan.durationLabel;
}

function getCountryOptions(
  packages: readonly HeroPackageOption[],
): CountryOption[] {
  const countryMap = new Map<string, CountryOption>();

  for (const plan of packages) {
    if (!plan.country.trim() || !plan.countryCode.trim()) {
      continue;
    }

    const existingCountry = countryMap.get(
      plan.countryCode,
    );

    if (existingCountry) {
      existingCountry.planCount += 1;

      if (!existingCountry.flagUri && plan.flagUri) {
        existingCountry.flagUri = plan.flagUri;
      }

      continue;
    }

    countryMap.set(plan.countryCode, {
      country: plan.country,
      countryCode: plan.countryCode,
      flagUri: plan.flagUri,
      planCount: 1,
    });
  }

  return Array.from(countryMap.values()).sort(
    (first, second) =>
      first.country.localeCompare(second.country),
  );
}

export function DestinationPlans({
  countryCode,
}: DestinationPlansProps) {
  const router = useRouter();
  const searchRef = useRef<HTMLDivElement | null>(null);

  const [packages, setPackages] = useState<
    HeroPackageOption[]
  >([]);

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] =
    useState("");
  const [isSearchOpen, setIsSearchOpen] =
    useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] =
    useState(false);

  const [filter, setFilter] =
    useState<PlanFilter>("all");
  const [sort, setSort] =
    useState<SortOption>("recommended");

  const [loading, setLoading] = useState(true);
  const [error, setError] =
    useState<string | null>(null);

  const [heroImageFailed, setHeroImageFailed] =
    useState(false);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedQuery(query);
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [query]);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (
        !searchRef.current?.contains(
          event.target as Node,
        )
      ) {
        setIsSearchOpen(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handleOutsideClick,
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick,
      );
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadPackages() {
      try {
        setLoading(true);
        setError(null);

        const response =
          await fetchPackageOptions();

        if (active) {
          setPackages(response);
        }
      } catch (loadError) {
        console.error(
          "Failed to load destination plans:",
          loadError,
        );

        if (active) {
          setError(
            "Available eSIM plans could not be loaded. Please try again shortly.",
          );
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
    setHeroImageFailed(false);
  }, [countryCode]);

  const countries = useMemo(
    () => getCountryOptions(packages),
    [packages],
  );

  const selectedCountry = useMemo(
    () =>
      countries.find(
        (country) =>
          country.countryCode === countryCode,
      ),
    [countries, countryCode],
  );

  const selectedCountryPlans = useMemo(
    () =>
      packages.filter(
        (plan) =>
          plan.countryCode === countryCode,
      ),
    [packages, countryCode],
  );

  const matchingCountries = useMemo(() => {
    const normalizedQuery =
      normalizeValue(debouncedQuery);

    if (!normalizedQuery) {
      return countries.slice(0, 10);
    }

    return countries
      .filter(
        (country) =>
          country.country
            .toLowerCase()
            .includes(normalizedQuery) ||
          country.countryCode
            .toLowerCase()
            .includes(normalizedQuery),
      )
      .slice(0, 12);
  }, [countries, debouncedQuery]);

  const visiblePlans = useMemo(() => {
    const matchingPlans =
      selectedCountryPlans.filter((plan) => {
        switch (filter) {
          case "unlimited":
            return isUnlimitedPlan(plan);

          case "fixed":
            return !isUnlimitedPlan(plan);

          case "short":
            return (
              plan.durationDays > 0 &&
              plan.durationDays <= 7
            );

          case "medium":
            return (
              plan.durationDays > 7 &&
              plan.durationDays <= 15
            );

          case "long":
            return plan.durationDays > 15;

          default:
            return true;
        }
      });

    return [...matchingPlans].sort(
      (first, second) => {
        switch (sort) {
          case "price-low":
            return (
              first.priceNumeric -
              second.priceNumeric
            );

          case "price-high":
            return (
              second.priceNumeric -
              first.priceNumeric
            );

          case "duration":
            return (
              second.durationDays -
              first.durationDays
            );

          default:
            return (
              getPlanValueScore(second) -
              getPlanValueScore(first)
            );
        }
      },
    );
  }, [filter, selectedCountryPlans, sort]);

  const featuredPlan = visiblePlans[0];
  const remainingPlans = visiblePlans.slice(1);

  const isSearching =
    query !== debouncedQuery;

  const heroImage = useMemo(() => {
    if (!selectedCountry) {
      return getFallbackCountryImage(countryCode);
    }

    if (heroImageFailed) {
      return getFallbackCountryImage(countryCode);
    }

    return getDynamicCountryImage(
      selectedCountry.country,
      selectedCountry.countryCode,
    );
  }, [
    selectedCountry,
    countryCode,
    heroImageFailed,
  ]);

  function selectCountry(
    country: CountryOption,
  ) {
    setQuery("");
    setDebouncedQuery("");
    setIsSearchOpen(false);
    setFilter("all");
    setSort("recommended");
    setHeroImageFailed(false);

    router.push(
      `/destinations?country=${encodeURIComponent(
        country.countryCode,
      )}`,
    );
  }

  function clearSearch() {
    setQuery("");
    setDebouncedQuery("");
    setIsSearchOpen(true);
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#020916] text-white">
      <DestinationNav
        mobileMenuOpen={mobileMenuOpen}
        onMobileMenuToggle={() =>
          setMobileMenuOpen(
            (current) => !current,
          )
        }
      />

      <section className="relative isolate pb-20 pt-20">
        <div className="pointer-events-none absolute inset-0 -z-30 bg-[radial-gradient(circle_at_72%_20%,rgba(0,112,255,0.16),transparent_34%),radial-gradient(circle_at_18%_32%,rgba(13,72,155,0.1),transparent_30%),linear-gradient(180deg,#020814_0%,#020916_62%,#020916_100%)]" />

        <div className="hero-grid pointer-events-none absolute inset-0 -z-20 opacity-[0.07]" />

        <div className="mx-auto max-w-[1360px] px-5 md:px-8 xl:px-12">
          <div className="relative mt-6 min-h-[410px] overflow-hidden rounded-[28px] border border-[#173d61]/65 bg-[#020916] shadow-[0_32px_90px_rgba(0,0,0,0.36)]">
            <div className="pointer-events-none absolute inset-y-0 right-0 w-full overflow-hidden lg:w-[74%]">
              <img
                alt={
                  selectedCountry
                    ? `${selectedCountry.country} travel destination`
                    : "International travel destination"
                }
                className="h-full w-full object-cover object-center"
                key={heroImage}
                onError={() => {
                  if (!heroImageFailed) {
                    setHeroImageFailed(true);
                  }
                }}
                referrerPolicy="no-referrer"
                src={heroImage}
              />

              <div className="absolute inset-0 bg-[linear-gradient(90deg,#020916_0%,rgba(2,9,22,0.98)_20%,rgba(2,9,22,0.73)_48%,rgba(2,9,22,0.18)_78%,rgba(2,9,22,0.4)_100%)]" />

              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,9,22,0.12)_0%,transparent_45%,#020916_100%)]" />

              <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_45%,rgba(23,142,255,0.12),transparent_42%)]" />
            </div>

            <div className="relative z-10 grid min-h-[410px] items-end gap-10 px-6 py-9 sm:px-9 lg:grid-cols-[0.88fr_1.12fr] lg:px-11 lg:py-11">
              <div className="max-w-[610px]">
                {selectedCountry ? (
                  <div className="inline-flex items-center gap-3 rounded-[12px] border border-[#1d6db3]/75 bg-[#06182c]/80 px-4 py-2.5 shadow-[0_12px_32px_rgba(0,0,0,0.3)] backdrop-blur-xl">
                    {selectedCountry.flagUri ? (
                      <img
                        alt={`${selectedCountry.country} flag`}
                        className="h-7 w-7 rounded-full border border-white/10 object-cover"
                        src={
                          selectedCountry.flagUri
                        }
                      />
                    ) : (
                      <Globe2
                        aria-hidden="true"
                        className="text-[#46afff]"
                        size={18}
                      />
                    )}

                    <span className="text-[11px] font-black uppercase tracking-[0.2em]">
                      {selectedCountry.country}
                    </span>
                  </div>
                ) : null}

                <h1 className="mt-5 font-display text-[46px] font-black leading-[0.98] tracking-[-0.045em] sm:text-[58px] lg:text-[68px]">
                  eSIM plans for
                  <br />

                  <span className="bg-gradient-to-r from-[#2874ff] via-[#279fff] to-[#2bd2ff] bg-clip-text text-transparent">
                    {loading
                      ? "your destination"
                      : selectedCountry?.country ??
                        "your destination"}
                  </span>
                </h1>

                <p className="mt-5 max-w-[470px] text-sm leading-7 text-[#acbbcd] sm:text-base">
                  Fast, reliable data wherever
                  you go.
                  <br />
                  Choose the plan that fits your
                  journey.
                </p>
              </div>

              <CountrySearch
                countryCode={countryCode}
                isOpen={isSearchOpen}
                isSearching={isSearching}
                matchingCountries={
                  matchingCountries
                }
                onClear={clearSearch}
                onOpenChange={setIsSearchOpen}
                onQueryChange={setQuery}
                onSelect={selectCountry}
                query={query}
                rootRef={searchRef}
              />
            </div>
          </div>

          {loading ? (
            <PlansLoading />
          ) : error ? (
            <ErrorState message={error} />
          ) : selectedCountry &&
            selectedCountryPlans.length > 0 ? (
            <>
              <DestinationStats
                plansCount={
                  selectedCountryPlans.length
                }
              />

              <PlanToolbar
                filter={filter}
                onFilterChange={setFilter}
                onSortChange={setSort}
                sort={sort}
              />

              {featuredPlan ? (
                <FeaturedPlan
                  plan={featuredPlan}
                />
              ) : null}

              {remainingPlans.length ? (
                <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {remainingPlans.map((plan) => (
                    <CompactPlanCard
                      key={plan.id}
                      plan={plan}
                    />
                  ))}
                </div>
              ) : null}

              {!featuredPlan ? (
                <EmptyFilterState
                  onReset={() =>
                    setFilter("all")
                  }
                />
              ) : null}

              <PlansSupportBar />
            </>
          ) : (
            <MissingDestinationState />
          )}
        </div>
      </section>
    </main>
  );
}

type CountrySearchProps = {
  countryCode: string;
  query: string;
  isOpen: boolean;
  isSearching: boolean;
  matchingCountries: CountryOption[];
  rootRef: RefObject<HTMLDivElement | null>;
  onQueryChange: (value: string) => void;
  onOpenChange: (value: boolean) => void;
  onClear: () => void;
  onSelect: (country: CountryOption) => void;
};

function CountrySearch({
  countryCode,
  query,
  isOpen,
  isSearching,
  matchingCountries,
  rootRef,
  onQueryChange,
  onOpenChange,
  onClear,
  onSelect,
}: CountrySearchProps) {
  return (
    <div
      className="relative z-50 w-full lg:mb-3"
      ref={rootRef}
    >
      <div
        className={[
          "rounded-full border bg-[#07162a]/84 p-2",
          "shadow-[0_24px_65px_rgba(0,0,0,0.48)] backdrop-blur-2xl",
          isOpen
            ? "border-[#168cff] shadow-[0_0_32px_rgba(22,140,255,0.2)]"
            : "border-[#315a80]/90",
        ].join(" ")}
      >
        <label className="flex min-h-[62px] items-center gap-4 rounded-full bg-[#091a2e]/88 px-5">
          <Search
            aria-hidden="true"
            className="shrink-0 text-[#46afff]"
            size={22}
          />

          <span className="sr-only">
            Search destinations
          </span>

          <input
            autoComplete="off"
            className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-white outline-none placeholder:text-[#8195ac]"
            onChange={(event) => {
              onQueryChange(event.target.value);
              onOpenChange(true);
            }}
            onFocus={() => onOpenChange(true)}
            placeholder="Search destinations"
            type="text"
            value={query}
          />

          {isSearching ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#168cff]/25 border-t-[#35a5ff]" />
          ) : query ? (
            <button
              aria-label="Clear destination search"
              className="grid h-9 w-9 place-items-center rounded-full text-[#7d92a9] transition hover:bg-white/5 hover:text-white"
              onClick={onClear}
              type="button"
            >
              <X aria-hidden="true" size={17} />
            </button>
          ) : (
            <ChevronDown
              aria-hidden="true"
              className="text-[#8297ae]"
              size={19}
            />
          )}
        </label>
      </div>

      {isOpen ? (
        <div className="absolute left-0 right-0 top-[calc(100%+0.75rem)] z-[80] overflow-hidden rounded-[20px] border border-[#234c70] bg-[#061427]/98 shadow-[0_32px_90px_rgba(0,0,0,0.68)] backdrop-blur-2xl">
          <div className="border-b border-[#193854] px-4 py-3">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#7d91a8]">
              {query.trim()
                ? "Matching destinations"
                : "Available destinations"}
            </p>
          </div>

          <div className="max-h-[320px] overflow-y-auto p-2">
            {isSearching ? (
              <div className="flex items-center gap-3 px-4 py-5">
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#168cff]/30 border-t-[#168cff]" />

                <p className="text-sm font-semibold text-[#8da3ba]">
                  Searching destinations...
                </p>
              </div>
            ) : matchingCountries.length ? (
              matchingCountries.map(
                (country) => {
                  const active =
                    country.countryCode ===
                    countryCode;

                  return (
                    <button
                      className={[
                        "group flex w-full items-center justify-between gap-4 rounded-[14px] px-3 py-3 text-left transition",
                        active
                          ? "bg-[#0b2d4f]"
                          : "hover:bg-[#0a213b]",
                      ].join(" ")}
                      key={country.countryCode}
                      onClick={() =>
                        onSelect(country)
                      }
                      type="button"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        {country.flagUri ? (
                          <img
                            alt={`${country.country} flag`}
                            className="h-10 w-10 shrink-0 rounded-full border border-white/10 object-cover"
                            src={country.flagUri}
                          />
                        ) : (
                          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#0b2b4b] text-[#35a5ff]">
                            <Globe2
                              aria-hidden="true"
                              size={18}
                            />
                          </span>
                        )}

                        <div className="min-w-0">
                          <p className="truncate text-sm font-black">
                            {country.country}
                          </p>

                          <p className="mt-1 text-xs text-[#7890aa]">
                            {country.planCount}{" "}
                            {country.planCount === 1
                              ? "plan"
                              : "plans"}{" "}
                            available
                          </p>
                        </div>
                      </div>

                      {active ? (
                        <Check
                          aria-hidden="true"
                          className="text-[#54b5ff]"
                          size={17}
                        />
                      ) : (
                        <ArrowRight
                          aria-hidden="true"
                          className="text-[#52708e] transition group-hover:translate-x-1 group-hover:text-[#54b5ff]"
                          size={17}
                        />
                      )}
                    </button>
                  );
                },
              )
            ) : (
              <div className="px-4 py-8 text-center">
                <Globe2
                  aria-hidden="true"
                  className="mx-auto text-[#49647f]"
                  size={28}
                />

                <p className="mt-3 text-sm font-black">
                  No destination found
                </p>

                <p className="mt-1 text-xs text-[#7890aa]">
                  Try searching for another
                  country.
                </p>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

type PlanToolbarProps = {
  filter: PlanFilter;
  sort: SortOption;
  onFilterChange: (filter: PlanFilter) => void;
  onSortChange: (sort: SortOption) => void;
};

function PlanToolbar({
  filter,
  sort,
  onFilterChange,
  onSortChange,
}: PlanToolbarProps) {
  return (
    <div className="mt-5 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
      <div className="flex flex-wrap gap-2">
        {planFilters.map((item) => (
          <button
            className={[
              "rounded-full border px-5 py-2.5 text-xs font-black transition",
              filter === item.value
                ? "border-[#27baff] bg-[#0a3153] text-white shadow-[0_0_24px_rgba(34,166,255,0.27)]"
                : "border-[#1b4266] bg-[#061427] text-[#8ca1b8] hover:border-[#347daf] hover:text-white",
            ].join(" ")}
            key={item.value}
            onClick={() =>
              onFilterChange(item.value)
            }
            type="button"
          >
            {item.label}
          </button>
        ))}
      </div>

      <label className="flex h-11 w-fit items-center gap-3 rounded-full border border-[#173959] bg-[#061427] px-4">
        <ArrowDownUp
          aria-hidden="true"
          className="text-[#46afff]"
          size={15}
        />

        <span className="text-[11px] font-bold text-[#70869f]">
          Sort by
        </span>

        <select
          className="bg-[#061427] text-xs font-black text-white outline-none"
          onChange={(event) =>
            onSortChange(
              event.target.value as SortOption,
            )
          }
          value={sort}
        >
          <option value="recommended">
            Recommended
          </option>

          <option value="price-low">
            Price: low to high
          </option>

          <option value="price-high">
            Price: high to low
          </option>

          <option value="duration">
            Longest validity
          </option>
        </select>
      </label>
    </div>
  );
}

type DestinationNavProps = {
  mobileMenuOpen: boolean;
  onMobileMenuToggle: () => void;
};

function DestinationNav({
  mobileMenuOpen,
  onMobileMenuToggle,
}: DestinationNavProps) {
  return (
    <header className="fixed inset-x-0 top-0 z-[100] border-b border-white/[0.04] bg-[#020916]/82 backdrop-blur-2xl">
      <nav className="mx-auto flex h-20 max-w-[1360px] items-center justify-between px-5 md:px-8 xl:px-12">
        <Link
          className="flex shrink-0 items-center gap-3"
          href="/"
        >
          <img
            alt=""
            aria-hidden="true"
            className="h-10 w-10 object-contain"
            src="/app-logo.png"
          />

          <span>
            <span className="block font-display text-lg font-black tracking-[0.16em]">
              VELOCITY
            </span>

            <span className="block text-[9px] font-bold tracking-[0.28em] text-[#7f94aa]">
              eSIM
            </span>
          </span>
        </Link>

        <div className="hidden items-center gap-3 lg:flex">
          <Link
            className="rounded-[12px] border border-[#234c70] bg-[#09182a] px-5 py-3 text-sm font-bold"
            href="/destinations"
          >
            Destinations
          </Link>

          <Link
            className="px-4 py-3 text-sm font-semibold text-white/70 transition hover:text-white"
            href="/#how-it-works"
          >
            How it works
          </Link>

          <Link
            className="px-4 py-3 text-sm font-semibold text-white/70 transition hover:text-white"
            href="/about"
          >
            About eSIM
          </Link>

          <Link
            className="px-4 py-3 text-sm font-semibold text-white/70 transition hover:text-white"
            href="/support"
          >
            Help
          </Link>
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <button
            className="inline-flex h-11 items-center gap-2 px-3 text-sm font-bold text-white/75"
            type="button"
          >
            <Globe2
              aria-hidden="true"
              size={17}
            />

            EN

            <ChevronDown
              aria-hidden="true"
              size={14}
            />
          </button>

          <Link
            className="inline-flex h-11 items-center justify-center rounded-full border border-[#3c638a] px-6 text-sm font-bold"
            href="/login"
          >
            Log in
          </Link>

          <Link
            className="inline-flex h-11 items-center justify-center gap-3 rounded-full bg-gradient-to-r from-[#1857ff] to-[#29c9ff] px-6 text-sm font-black"
            href="/#download"
          >
            Get eSIM Now

            <ArrowRight
              aria-hidden="true"
              size={17}
            />
          </Link>
        </div>

        <button
          aria-label="Toggle navigation"
          className="grid h-11 w-11 place-items-center rounded-xl border border-[#244969] bg-[#07182b] md:hidden"
          onClick={onMobileMenuToggle}
          type="button"
        >
          {mobileMenuOpen ? (
            <X aria-hidden="true" size={20} />
          ) : (
            <Menu
              aria-hidden="true"
              size={20}
            />
          )}
        </button>
      </nav>
    </header>
  );
}

function DestinationStats({
  plansCount,
}: {
  plansCount: number;
}) {
  const stats: Array<{
    icon: IconComponent;
    title: string;
    description: string;
  }> = [
    {
      icon: CalendarDays,
      title: String(plansCount),
      description:
        plansCount === 1
          ? "plan available"
          : "plans available",
    },
    {
      icon: Zap,
      title: "Instant activation",
      description: "Start using in minutes",
    },
    {
      icon: Signal,
      title: "Fast data",
      description: "Premium local networks",
    },
    {
      icon: ShieldCheck,
      title: "Secure checkout",
      description: "Encrypted and trusted",
    },
  ];

  return (
    <div className="mt-5 grid overflow-hidden rounded-[18px] border border-[#1d4366] bg-[#061427]/92 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon;

        return (
          <div
            className={[
              "flex items-center gap-4 px-5 py-5",
              index > 0
                ? "border-t border-[#163650] sm:border-t-0 sm:[&:nth-child(2n)]:border-l xl:border-l"
                : "",
            ].join(" ")}
            key={stat.title}
          >
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[13px] border border-[#1d527c] bg-[#09213a] text-[#42b0ff]">
              <Icon
                aria-hidden="true"
                size={20}
              />
            </span>

            <div>
              <p className="text-sm font-black">
                {stat.title}
              </p>

              <p className="mt-1 text-xs text-[#778da5]">
                {stat.description}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function FeaturedPlan({
  plan,
}: {
  plan: HeroPackageOption;
}) {
  const unlimited = isUnlimitedPlan(plan);

  const features = [
    {
      icon: unlimited
        ? InfinityIcon
        : Database,
      label: `${plan.dataLabel} data`,
    },
    {
      icon: CalendarDays,
      label: `${getDurationText(
        plan,
      )} validity`,
    },
    {
      icon: Radio,
      label: "5G/4G LTE network",
    },
    {
      icon: Wifi,
      label: "Hotspot enabled",
    },
  ];

  return (
    <article className="group relative mt-5 overflow-hidden rounded-[20px] border border-[#168cff]/85 bg-[linear-gradient(105deg,#07172b_0%,#08213c_46%,#061326_100%)] px-5 py-6 sm:px-7">
      <Star
        aria-hidden="true"
        className="absolute right-4 top-4 fill-[#45b8ff] text-[#45b8ff]"
        size={15}
      />

      <div className="relative grid items-center gap-7 lg:grid-cols-[220px_1fr_220px]">
        <div>
          <span className="inline-flex rounded-full bg-gradient-to-r from-[#1476ff] to-[#28bfff] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em]">
            Best value
          </span>

          <div className="relative mx-auto mt-4 grid h-32 w-32 place-items-center">
            <div className="absolute inset-0 rounded-full border border-[#20c9ff]/25 shadow-[0_0_50px_rgba(20,173,255,0.24)]" />

            <div className="absolute inset-4 rounded-full border border-[#33c6ff]/75" />

            <span className="relative grid h-20 w-20 place-items-center rounded-full bg-[#061326] text-[#32a9ff]">
              {unlimited ? (
                <InfinityIcon
                  size={45}
                  strokeWidth={2.3}
                />
              ) : (
                <Database size={36} />
              )}
            </span>
          </div>
        </div>

        <div>
          <h2 className="font-display text-2xl font-black sm:text-3xl">
            {plan.title}
          </h2>

          <p className="mt-2 text-sm text-[#8ea3ba]">
            {unlimited
              ? "High-speed data, no limits."
              : "Reliable data for your entire journey."}
          </p>

          <div className="mt-6 grid gap-x-8 gap-y-3 sm:grid-cols-2">
            {features.map((feature) => {
              const Icon = feature.icon;

              return (
                <div
                  className="flex items-center gap-3 text-xs font-semibold text-[#9eb0c3]"
                  key={feature.label}
                >
                  <Icon
                    aria-hidden="true"
                    className="text-[#58baff]"
                    size={15}
                  />

                  {feature.label}
                </div>
              );
            })}
          </div>
        </div>

        <div className="lg:text-center">
          <p className="font-display text-4xl font-black">
            {plan.price}
          </p>

          <p className="mt-1 text-xs text-[#748aa2]">
            Total price
          </p>

          <Link
            className="mt-5 inline-flex h-11 w-full items-center justify-center gap-3 rounded-[12px] bg-gradient-to-r from-[#1857ff] to-[#29c9ff] px-5 text-sm font-black"
            href={`/checkout?package=${encodeURIComponent(
              plan.id,
            )}`}
          >
            Choose plan

            <ArrowRight
              aria-hidden="true"
              size={17}
            />
          </Link>
        </div>
      </div>
    </article>
  );
}

function CompactPlanCard({
  plan,
}: {
  plan: HeroPackageOption;
}) {
  const Icon = getPlanIcon(plan);

  return (
    <article className="group relative flex min-h-[220px] flex-col overflow-hidden rounded-[18px] border border-[#214867]/85 bg-[linear-gradient(145deg,#07182c,#051224)] p-5 transition hover:-translate-y-1 hover:border-[#168cff]/75">
      <Star
        aria-hidden="true"
        className="absolute right-5 top-5 text-[#668099]"
        size={19}
      />

      <div className="relative flex items-start gap-4 pr-8">
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-[15px] border border-[#1c8dc5] bg-[#07213a] text-[#3db7ff]">
          <Icon
            aria-hidden="true"
            size={26}
          />
        </span>

        <div className="min-w-0">
          <h3 className="truncate font-display text-xl font-black">
            {plan.title}
          </h3>

          <p className="mt-1 text-xs leading-5 text-[#8196ad]">
            {isUnlimitedPlan(plan)
              ? "High-speed data without limits."
              : plan.durationDays <= 15
                ? "Perfect for short trips."
                : "More data for longer adventures."}
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <span className="rounded-md bg-[#0a2038] px-2.5 py-1.5 text-[10px] font-bold text-[#91a7bd]">
          {plan.dataLabel} data
        </span>

        <span className="rounded-md bg-[#0a2038] px-2.5 py-1.5 text-[10px] font-bold text-[#91a7bd]">
          {getDurationText(plan)} validity
        </span>
      </div>

      <div className="mt-auto flex items-end justify-between gap-4 pt-6">
        <p className="font-display text-2xl font-black">
          {plan.price}
        </p>

        <Link
          className="inline-flex h-10 items-center gap-2 rounded-[11px] border border-[#168cff]/75 px-4 text-xs font-black text-[#42b1ff]"
          href={`/checkout?package=${encodeURIComponent(
            plan.id,
          )}`}
        >
          Choose plan

          <ArrowRight
            aria-hidden="true"
            size={15}
          />
        </Link>
      </div>
    </article>
  );
}

function PlansSupportBar() {
  return (
    <div className="mt-6 flex flex-col gap-4 rounded-[16px] border border-[#163958] bg-[#061427]/85 px-5 py-4 text-sm text-[#8ca0b7] sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <ShieldCheck
          aria-hidden="true"
          className="text-[#4eb5ff]"
          size={21}
        />

        <span>
          All plans include premium network
          access and 24/7 customer support.
        </span>
      </div>

      <Link
        className="inline-flex items-center gap-2 font-black text-[#4eb5ff]"
        href="/support"
      >
        Visit Help Center

        <ArrowRight
          aria-hidden="true"
          size={16}
        />
      </Link>
    </div>
  );
}

function PlansLoading() {
  return (
    <>
      <div className="mt-5 h-[100px] animate-pulse rounded-[18px] border border-[#173a5b] bg-[#07172a]" />

      <div className="mt-5 h-[260px] animate-pulse rounded-[20px] border border-[#173a5b] bg-[#07172a]" />

      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map(
          (_, index) => (
            <div
              className="h-[220px] animate-pulse rounded-[18px] border border-[#173a5b] bg-[#07172a]"
              key={index}
            />
          ),
        )}
      </div>
    </>
  );
}

function ErrorState({
  message,
}: {
  message: string;
}) {
  return (
    <div className="mx-auto mt-12 max-w-2xl rounded-[22px] border border-[#63323d] bg-[#25151e] p-8 text-center">
      <Headphones
        aria-hidden="true"
        className="mx-auto text-[#ff829b]"
        size={32}
      />

      <h2 className="mt-4 font-display text-2xl font-black">
        Plans are temporarily unavailable
      </h2>

      <p className="mt-2 text-sm text-[#c8aab1]">
        {message}
      </p>
    </div>
  );
}

function EmptyFilterState({
  onReset,
}: {
  onReset: () => void;
}) {
  return (
    <div className="mt-8 rounded-[22px] border border-[#1d4265] bg-[#061528] p-10 text-center">
      <Wifi
        aria-hidden="true"
        className="mx-auto text-[#3daaff]"
        size={30}
      />

      <h3 className="mt-4 font-display text-xl font-black">
        No plans match this filter
      </h3>

      <button
        className="mt-5 rounded-full bg-[#168cff] px-5 py-2.5 text-xs font-black"
        onClick={onReset}
        type="button"
      >
        Show all plans
      </button>
    </div>
  );
}

function MissingDestinationState() {
  return (
    <div className="mx-auto mt-12 max-w-2xl rounded-[24px] border border-[#1d4265] bg-[#061528] p-9 text-center">
      <Globe2
        aria-hidden="true"
        className="mx-auto text-[#3daaff]"
        size={34}
      />

      <h2 className="mt-5 font-display text-2xl font-black">
        No plans found
      </h2>

      <Link
        className="mt-6 inline-flex h-11 items-center rounded-full bg-[#168cff] px-6 text-sm font-black"
        href="/destinations"
      >
        View all destinations
      </Link>
    </div>
  );
}
