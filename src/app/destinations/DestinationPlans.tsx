"use client";

import {
  ArrowDownUp,
  ArrowRight,
  BarChart3,
  CalendarDays,
  Database,
  Globe2,
  Headphones,
  Infinity as InfinityIcon,
  Plane,
  Radio,
  ShieldCheck,
  Signal,
  Star,
  Wifi,
  Zap,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
} from "react";

import {
  fetchPackageOptions,
  type HeroPackageOption,
} from "@/services/packages";
import { discountPercentOff, formatOriginalPrice, hasActiveDiscount } from "@/services/discountPricing";
import {
  isDestinationFiltersActive,
  matchesDestinationFilters,
  parseDestinationFiltersFromParams,
} from "@/services/destinationFilters";
import { Navbar } from "../components/Navbar";
import { Button, LinkButton } from "../components/Button";
import { SiteFooter } from "../SiteFooter";
import { JsonLd } from "../JsonLd";
import { absoluteUrl, createOfferProductJsonLd } from "@/lib/seo";

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

type CountryHeroImage = {
  imageUrl: string;
  alt: string;
  sourceUrl: string;
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

function countryCodesMatch(
  firstCode: string,
  secondCode: string,
) {
  return (
    normalizeCountryCode(firstCode) ===
    normalizeCountryCode(secondCode)
  );
}

function isUnlimitedPlan(plan: HeroPackageOption) {
  return (
    plan.dataNumericGb >= 999 ||
    plan.dataLabel.toLowerCase().includes("unlimited") ||
    plan.title.toLowerCase().includes("unlimited")
  );
}

function getPlanValueScore(plan: HeroPackageOption) {
  if (plan.priceNumeric <= 0) {
    return 0;
  }

  if (isUnlimitedPlan(plan)) {
    return (
      Math.max(plan.durationDays, 1) /
      plan.priceNumeric
    );
  }

  return (
    Math.max(plan.dataNumericGb, 0.1) /
    plan.priceNumeric
  );
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
    const normalizedCode =
      normalizeCountryCode(plan.countryCode);

    if (!plan.country.trim() || !normalizedCode) {
      continue;
    }

    const existingCountry =
      countryMap.get(normalizedCode);

    if (existingCountry) {
      existingCountry.planCount += 1;

      if (
        !existingCountry.flagUri &&
        plan.flagUri
      ) {
        existingCountry.flagUri =
          plan.flagUri;
      }

      continue;
    }

    countryMap.set(normalizedCode, {
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

function useCountryHeroImage(country?: string) {
  const [image, setImage] =
    useState<CountryHeroImage | null>(null);

  const [loading, setLoading] =
    useState(false);

  useEffect(() => {
    const normalizedCountry = country?.trim();

    if (!normalizedCountry) {
      setImage(null);
      setLoading(false);
      return;
    }

    const countryName = normalizedCountry;
    const controller = new AbortController();

    async function loadCountryImage() {
      try {
        setLoading(true);

        const response = await fetch(
          `/bff/country-image?country=${encodeURIComponent(
            countryName,
          )}`,
          {
            signal: controller.signal,
            cache: "force-cache",
          },
        );

        if (!response.ok) {
          throw new Error(
            `Country image request failed: ${response.status}`,
          );
        }

        const payload =
          (await response.json()) as CountryHeroImage;

        if (!payload.imageUrl) {
          throw new Error(
            "Country image URL is missing",
          );
        }

        setImage(payload);
      } catch (error) {
        if (
          error instanceof DOMException &&
          error.name === "AbortError"
        ) {
          return;
        }

        console.error(
          "Failed to load country hero image:",
          error,
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadCountryImage();

    return () => {
      controller.abort();
    };
  }, [country]);

  return {
    image,
    loading,
  };
}

export function DestinationPlans({
  countryCode,
  searchFilters,
}: DestinationPlansProps) {
  const router = useRouter();

  const searchRef =
    useRef<HTMLDivElement | null>(null);

  const [packages, setPackages] =
    useState<HeroPackageOption[]>([]);

  const [query, setQuery] = useState("");

  const [
    debouncedQuery,
    setDebouncedQuery,
  ] = useState("");

  const [
    isSearchOpen,
    setIsSearchOpen,
  ] = useState(false);

  const [
    mobileMenuOpen,
    setMobileMenuOpen,
  ] = useState(false);

  const [filter, setFilter] =
    useState<PlanFilter>("all");

  const [sort, setSort] =
    useState<SortOption>("recommended");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

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
    setFilter("all");
    setSort("recommended");
    setQuery("");
    setDebouncedQuery("");
    setIsSearchOpen(false);
  }, [countryCode]);

  const countries = useMemo(
    () => getCountryOptions(packages),
    [packages],
  );

  const selectedCountry = useMemo(() => {
    return countries.find((country) =>
      countryCodesMatch(
        country.countryCode,
        countryCode,
      ),
    );
  }, [countries, countryCode]);

  const wizardFilters = useMemo(
    () => parseDestinationFiltersFromParams(searchFilters ?? {}),
    [searchFilters],
  );

  const selectedCountryPlans = useMemo(() => {
    return packages.filter(
      (plan) =>
        countryCodesMatch(plan.countryCode, countryCode) &&
        matchesDestinationFilters(plan, wizardFilters),
    );
  }, [packages, countryCode, wizardFilters]);

  const selectedCountryOffer = useMemo(() => {
    const prices = selectedCountryPlans
      .map((plan) => plan.priceNumeric)
      .filter((price) => price > 0);

    if (prices.length === 0) {
      return null;
    }

    return {
      lowPrice: Math.min(...prices),
      currency: "EUR",
      offerCount: prices.length,
    };
  }, [selectedCountryPlans]);

  const matchingCountries = useMemo(() => {
    const normalizedQuery =
      normalizeValue(debouncedQuery);

    if (!normalizedQuery) {
      return countries.slice(0, 10);
    }

    return countries
      .filter((country) => {
        return (
          country.country
            .toLowerCase()
            .includes(normalizedQuery) ||
          normalizeCountryCode(
            country.countryCode,
          ).includes(
            normalizeCountryCode(
              normalizedQuery,
            ),
          )
        );
      })
      .slice(0, 12);
  }, [countries, debouncedQuery]);

  const visiblePlans = useMemo(() => {
    const filteredPlans =
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

    return [...filteredPlans].sort(
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
  }, [
    filter,
    selectedCountryPlans,
    sort,
  ]);

  const featuredPlan = visiblePlans[0];

  const remainingPlans =
    visiblePlans.slice(1);

  const isSearching =
    query !== debouncedQuery;

  const {
    image: heroImage,
    loading: heroImageLoading,
  } = useCountryHeroImage(
    selectedCountry?.country,
  );

  function selectCountry(
    country: CountryOption,
  ) {
    setQuery("");
    setDebouncedQuery("");
    setIsSearchOpen(false);
    setFilter("all");
    setSort("recommended");

    router.push(
      `/destinations?country=${encodeURIComponent(
        country.countryCode,
      )}`,
    );
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-surface text-onSurface">
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

      <section className="relative isolate pb-20 pt-20">
        <div className="pointer-events-none absolute inset-0 -z-30 bg-[radial-gradient(circle_at_72%_20%,rgba(11,73,183,0.09),transparent_34%),radial-gradient(circle_at_18%_32%,rgba(11,73,183,0.045),transparent_30%)]" />

        <div className="hero-grid pointer-events-none absolute inset-0 -z-20 opacity-[0.05]" />

        <div className="mx-auto max-w-[1360px] px-5 md:px-8 xl:px-12">
          {/* This card stays dark/photo-backed on purpose (matches CountryHero.tsx on mobile) — it's a
              destination photo with white overlay text, not a plain section background. */}
          <div className="relative mt-6 min-h-[430px] overflow-hidden rounded-[30px] border border-outline bg-midnight shadow-brandCard">
            <HeroCountryImage
              country={
                selectedCountry?.country
              }
              heroImage={heroImage}
              loading={heroImageLoading}
            />

            <div className="relative z-10 grid min-h-[430px] items-end gap-10 px-6 py-9 sm:px-9 lg:grid-cols-[0.88fr_1.12fr] lg:px-11 lg:py-11">
              <div className="max-w-[610px]">
                {selectedCountry ? (
                  <div className="inline-flex items-center gap-3 rounded-[12px] border border-brandTeal/40 bg-midnight/80 px-4 py-2.5 shadow-brandCard backdrop-blur-xl">
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
                        className="text-brandTeal"
                        size={18}
                      />
                    )}

                    <span className="text-[11px] font-black uppercase tracking-[0.2em] text-white">
                      {selectedCountry.country}
                    </span>
                  </div>
                ) : null}

                <h1 className="mt-5 font-display text-[46px] font-black leading-[0.98] tracking-[-0.045em] text-white sm:text-[58px] lg:text-[68px]">
                  eSIM plans for
                  <br />

                  <span className="bg-gradient-to-r from-brandBlue via-[#0E86C0] to-brandTeal bg-clip-text text-transparent">
                    {loading
                      ? "your destination"
                      : selectedCountry?.country ??
                        "your destination"}
                  </span>
                </h1>

                <p className="mt-5 max-w-[470px] text-sm leading-7 text-white/[72%] sm:text-base">
                  Fast, reliable data wherever
                  you go.
                  <br />
                  Choose the plan that fits your
                  journey.
                </p>

                {heroImage?.sourceUrl ? (
                  <a
                    className="mt-4 inline-flex text-[10px] text-white/35 transition hover:text-white/60"
                    href={heroImage.sourceUrl}
                    rel="noreferrer"
                    target="_blank"
                  >
                    Image source: Wikimedia
                    Commons
                  </a>
                ) : null}
              </div>
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

              {!isDestinationFiltersActive(wizardFilters) ? (
                <PlanToolbar
                  filter={filter}
                  onFilterChange={setFilter}
                  onSortChange={setSort}
                  sort={sort}
                />
              ) : null}

              {featuredPlan ? (
                <FeaturedPlan
                  plan={featuredPlan}
                />
              ) : null}

              {remainingPlans.length > 0 ? (
                <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {remainingPlans.map(
                    (plan) => (
                      <CompactPlanCard
                        key={plan.id}
                        plan={plan}
                      />
                    ),
                  )}
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

      <SiteFooter />
    </main>
  );
}

type HeroCountryImageProps = {
  country?: string;
  heroImage: CountryHeroImage | null;
  loading: boolean;
};

function HeroCountryImage({
  country,
  heroImage,
  loading,
}: HeroCountryImageProps) {
  return (
    <div className="pointer-events-none absolute inset-y-0 right-0 w-full overflow-hidden lg:w-[76%]">
      {heroImage?.imageUrl ? (
        <Image
          alt={
            heroImage.alt ||
            `${country ?? "International"} travel destination`
          }
          className={[
            "object-cover object-bottom transition duration-500",
            loading
              ? "scale-[1.02] opacity-70"
              : "scale-100 opacity-100",
          ].join(" ")}
          fill
          key={heroImage.imageUrl}
          priority
          sizes="(max-width: 1024px) 100vw, 76vw"
          src={heroImage.imageUrl}
        />
      ) : (
        <DestinationHeroImageLoader country={country} />
      )}

      {loading && heroImage?.imageUrl ? (
        <DestinationHeroImageLoader
          compact
          country={country}
        />
      ) : null}

      <div className="absolute inset-0 bg-[linear-gradient(90deg,#020916_0%,rgba(2,9,22,0.98)_18%,rgba(2,9,22,0.78)_44%,rgba(2,9,22,0.2)_76%,rgba(2,9,22,0.38)_100%)]" />

      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,9,22,0.12)_0%,transparent_42%,#020916_100%)]" />

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_73%_45%,rgba(23,142,255,0.11),transparent_42%)]" />
    </div>
  );
}

function DestinationHeroImageLoader({
  compact = false,
  country,
}: {
  compact?: boolean;
  country?: string;
}) {
  return (
    <div
      aria-label="Loading destination image"
      className={[
        "absolute inset-0 overflow-hidden bg-[linear-gradient(135deg,#061427_0%,#082648_48%,#031021_100%)]",
        compact ? "opacity-75" : "",
      ].join(" ")}
      role="status"
    >
      <div className="absolute inset-0 opacity-[0.16] [background-image:linear-gradient(rgba(72,178,255,0.9)_1px,transparent_1px),linear-gradient(90deg,rgba(72,178,255,0.9)_1px,transparent_1px)] [background-size:54px_54px]" />

      <div className="absolute inset-0 bg-[linear-gradient(110deg,transparent_0%,rgba(53,186,255,0.07)_34%,rgba(255,255,255,0.18)_50%,rgba(53,186,255,0.07)_66%,transparent_100%)] animate-[destination-loader-scan_2.8s_ease-in-out_infinite]" />

      <div className="absolute right-[10%] top-[18%] h-28 w-48 rounded-[24px] border border-[#2e7fb7]/35 bg-[#07182c]/70 shadow-[0_22px_60px_rgba(0,0,0,0.24)] backdrop-blur-md">
        <div className="absolute left-5 top-5 h-2 w-28 rounded-full bg-[#2a76ac]/70" />
        <div className="absolute left-5 top-11 h-2 w-36 rounded-full bg-[#154364]" />
        <div className="absolute bottom-5 left-5 h-8 w-8 rounded-full border border-[#43b8ff]/55 bg-[#0b2f51]" />
      </div>

      <div className="absolute bottom-[18%] right-[14%] h-24 w-60 rounded-[26px] border border-[#1e5d8d]/45 bg-[#061528]/80 shadow-[0_20px_55px_rgba(0,0,0,0.28)] backdrop-blur-lg">
        <div className="absolute left-5 top-5 h-3 w-32 rounded-full bg-[#23699c]" />
        <div className="absolute left-5 top-11 h-2 w-44 rounded-full bg-[#123957]" />
        <div className="absolute bottom-5 left-5 h-2 w-28 rounded-full bg-[#164f77]" />
      </div>

      <div className="absolute left-[58%] top-[48%] h-3 w-3 rounded-full bg-[#35caff] shadow-[0_0_0_8px_rgba(53,202,255,0.12),0_0_26px_rgba(53,202,255,0.75)]" />
      <div className="absolute left-[78%] top-[36%] h-2.5 w-2.5 rounded-full bg-[#1b7cff] shadow-[0_0_0_7px_rgba(27,124,255,0.13),0_0_22px_rgba(27,124,255,0.65)]" />
      <div className="absolute left-[70%] top-[67%] h-2 w-2 rounded-full bg-[#7fdfff] shadow-[0_0_0_6px_rgba(127,223,255,0.11),0_0_18px_rgba(127,223,255,0.55)]" />

      <div className="absolute bottom-8 right-8 hidden max-w-[310px] rounded-[18px] border border-[#2a6f9f]/55 bg-[#06162a]/85 px-5 py-4 shadow-[0_18px_50px_rgba(0,0,0,0.32)] backdrop-blur-xl sm:block">
        <div className="flex items-center gap-3">
          <span className="relative grid h-10 w-10 place-items-center rounded-[13px] border border-[#2b8fd0]/60 bg-[#082945]">
            <span className="h-4 w-4 rounded-full border-2 border-[#4bc4ff] border-t-transparent animate-spin" />
          </span>

          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#49b9ff]">
              Loading destination image
            </p>

            <p className="mt-1 text-xs font-semibold text-[#91a8bf]">
              {country
                ? `Preparing ${country} from Wikimedia`
                : "Preparing travel imagery"}
            </p>
          </div>
        </div>
      </div>
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
                ? "border-brandBlue bg-gradient-to-r from-brandBlue to-brandTeal text-white shadow-[0_0_24px_rgba(11,73,183,0.27)]"
                : "border-outline bg-white text-onSurfaceVariant hover:border-brandBlue/50 hover:text-brandInk",
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

      <label className="flex h-11 w-fit items-center gap-3 rounded-full border border-outline bg-white px-4">
        <ArrowDownUp
          aria-hidden="true"
          className="text-brandBlue"
          size={15}
        />

        <span className="text-[11px] font-bold text-onSurfaceVariant">
          Sort by
        </span>

        <select
          className="bg-white text-xs font-black text-brandInk outline-none"
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
      description:
        "Start using in minutes",
    },
    {
      icon: Signal,
      title: "Fast data",
      description:
        "Premium local networks",
    },
    {
      icon: ShieldCheck,
      title: "Secure checkout",
      description:
        "Encrypted and trusted",
    },
  ];

  return (
    <div className="mt-5 grid overflow-hidden rounded-[18px] border border-outline bg-white shadow-brandCard sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon;

        return (
          <div
            className={[
              "flex items-center gap-4 px-5 py-5",
              index > 0
                ? "border-t border-outline sm:border-t-0 sm:[&:nth-child(2n)]:border-l xl:border-l"
                : "",
            ].join(" ")}
            key={stat.title}
          >
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[13px] border border-brandBlue/20 bg-brandBlue/8 text-brandBlue">
              <Icon
                aria-hidden={true}
                size={20}
              />
            </span>

            <div>
              <p className="text-sm font-black text-brandInk">
                {stat.title}
              </p>

              <p className="mt-1 text-xs text-onSurfaceVariant">
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
  const unlimited =
    isUnlimitedPlan(plan);

  const features: Array<{
    icon: IconComponent;
    label: string;
  }> = [
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

  if (plan.voiceMinutes || plan.smsCount) {
    features.push({
      icon: Headphones,
      label: [
        plan.voiceMinutes ? `${plan.voiceMinutes} min` : null,
        plan.smsCount ? `${plan.smsCount} SMS` : null,
      ]
        .filter(Boolean)
        .join(" + "),
    });
  }

  return (
    <article className="group relative mt-5 overflow-hidden rounded-[20px] border border-brandBlue/40 bg-white px-5 py-6 shadow-brandGlow sm:px-7">
      <div className="pointer-events-none absolute inset-x-16 top-0 h-px bg-gradient-to-r from-transparent via-brandBlue to-transparent" />

      <div className="pointer-events-none absolute -left-16 top-1/2 h-64 w-64 -translate-y-1/2 rounded-full bg-brandBlue/8 blur-[70px]" />

      <div className="pointer-events-none absolute right-0 top-0 h-20 w-20 border-b border-l border-brandBlue/25 bg-brandBlue/6 [clip-path:polygon(100%_0,100%_100%,0_0)]" />

      <Star
        aria-hidden="true"
        className="absolute right-4 top-4 fill-brandTeal text-brandTeal"
        size={15}
      />

      <div className="relative grid items-center gap-7 lg:grid-cols-[220px_1fr_220px]">
        <div>
          <span className="inline-flex rounded-full bg-gradient-to-r from-brandBlue to-brandTeal px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-white">
            Best value
          </span>

          <div className="relative mx-auto mt-4 grid h-32 w-32 place-items-center">
            <div className="absolute inset-0 rounded-full border border-brandBlue/20 bg-brandBlue/4 shadow-[0_0_50px_rgba(11,73,183,0.14)]" />

            <div className="absolute inset-4 rounded-full border border-brandTeal/60 shadow-[inset_0_0_24px_rgba(9,195,190,0.18),0_0_30px_rgba(9,195,190,0.2)]" />

            <span className="relative grid h-20 w-20 place-items-center rounded-full bg-brandBlue/8 text-brandBlue">
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
          <h2 className="font-display text-2xl font-black tracking-[-0.025em] text-brandInk sm:text-3xl">
            {plan.title}
          </h2>

          <p className="mt-2 text-sm text-onSurfaceVariant">
            {unlimited
              ? "High-speed data, no limits."
              : "Reliable data for your entire journey."}
          </p>

          <div className="mt-6 grid gap-x-8 gap-y-3 sm:grid-cols-2">
            {features.map((feature) => {
              const Icon = feature.icon;

              return (
                <div
                  className="flex items-center gap-3 text-xs font-semibold text-onSurfaceVariant"
                  key={feature.label}
                >
                  <Icon
                    aria-hidden={true}
                    className="text-brandBlue"
                    size={15}
                  />

                  {feature.label}
                </div>
              );
            })}
          </div>
        </div>

        <div className="lg:text-center">
          {hasActiveDiscount(plan) ? (
            <div className="flex items-center gap-2 lg:justify-center">
              {discountPercentOff(plan) != null ? (
                <span className="rounded-full bg-error/10 px-2 py-1 text-[10px] font-black text-error">
                  -{discountPercentOff(plan)}%
                </span>
              ) : null}
              <span className="text-sm font-semibold text-onSurfaceVariant line-through">
                {formatOriginalPrice(plan)}
              </span>
            </div>
          ) : null}

          <p className="font-display text-4xl font-black tracking-[-0.04em] text-brandInk">
            {plan.price}
          </p>

          <p className="mt-1 text-xs text-onSurfaceVariant">
            Total price
          </p>

          <LinkButton
            className="group mt-5 w-full"
            href={`/checkout?package=${encodeURIComponent(
              plan.id,
            )}`}
            size="md"
          >
            Choose plan

            <ArrowRight
              aria-hidden="true"
              className="transition-transform group-hover:translate-x-1"
              size={17}
            />
          </LinkButton>
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
    <article className="group relative flex min-h-[220px] flex-col overflow-hidden rounded-[18px] border border-outline bg-white p-5 shadow-brandCard transition duration-300 hover:-translate-y-1 hover:border-brandBlue/50">
      <div className="pointer-events-none absolute -right-16 -top-16 h-36 w-36 rounded-full bg-brandBlue/6 blur-[50px]" />

      <Star
        aria-hidden="true"
        className="absolute right-5 top-5 text-outline transition group-hover:text-brandBlue"
        size={19}
      />

      <div className="relative flex items-start gap-4 pr-8">
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-[15px] border border-brandBlue/20 bg-brandBlue/8 text-brandBlue">
          <Icon
            aria-hidden={true}
            size={26}
          />
        </span>

        <div className="min-w-0">
          <h3 className="truncate font-display text-xl font-black text-brandInk">
            {plan.title}
          </h3>

          <p className="mt-1 text-xs leading-5 text-onSurfaceVariant">
            {isUnlimitedPlan(plan)
              ? "High-speed data without limits."
              : plan.durationDays <= 15
                ? "Perfect for short trips."
                : "More data for longer adventures."}
          </p>
        </div>
      </div>

      <div className="relative mt-5 flex flex-wrap gap-2">
        <span className="rounded-md bg-mist px-2.5 py-1.5 text-[10px] font-bold text-onSurfaceVariant">
          {plan.dataLabel} data
        </span>

        <span className="rounded-md bg-mist px-2.5 py-1.5 text-[10px] font-bold text-onSurfaceVariant">
          {getDurationText(plan)} validity
        </span>

        {plan.voiceMinutes || plan.smsCount ? (
          <span className="rounded-md bg-brandBlue/8 px-2.5 py-1.5 text-[10px] font-bold text-brandBlue">
            {[
              plan.voiceMinutes
                ? `${plan.voiceMinutes} min`
                : null,
              plan.smsCount
                ? `${plan.smsCount} SMS`
                : null,
            ]
              .filter(Boolean)
              .join(" + ")}
          </span>
        ) : null}
      </div>

      <div className="relative mt-auto flex items-end justify-between gap-4 pt-6">
        <div>
          {hasActiveDiscount(plan) ? (
            <div className="mb-1 flex items-center gap-1.5">
              {discountPercentOff(plan) != null ? (
                <span className="rounded-full bg-error/10 px-1.5 py-0.5 text-[9px] font-black text-error">
                  -{discountPercentOff(plan)}%
                </span>
              ) : null}
              <span className="text-xs font-semibold text-onSurfaceVariant line-through">
                {formatOriginalPrice(plan)}
              </span>
            </div>
          ) : null}

          <p className="font-display text-2xl font-black text-brandInk">
            {plan.price}
          </p>

          <p className="mt-1 text-[10px] text-onSurfaceVariant">
            Total price
          </p>
        </div>

        <LinkButton
          href={`/checkout?package=${encodeURIComponent(
            plan.id,
          )}`}
          size="sm"
          tone="brand"
          variant="flat"
        >
          Choose plan

          <ArrowRight
            aria-hidden="true"
            size={15}
          />
        </LinkButton>
      </div>
    </article>
  );
}

function PlansSupportBar() {
  return (
    <div className="mt-6 flex flex-col gap-4 rounded-[16px] border border-outline bg-white px-5 py-4 text-sm text-onSurfaceVariant shadow-brandCard sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <ShieldCheck
          aria-hidden="true"
          className="text-brandBlue"
          size={21}
        />

        <span>
          All plans include premium network
          access and 24/7 customer support.
        </span>
      </div>

      <Link
        className="inline-flex shrink-0 items-center gap-2 font-black text-brandBlue"
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
      <div className="mt-5 h-[100px] animate-pulse rounded-[18px] border border-outline bg-mist" />

      <div className="mt-5 h-[260px] animate-pulse rounded-[20px] border border-outline bg-mist" />

      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({
          length: 3,
        }).map((_, index) => (
          <div
            className="h-[220px] animate-pulse rounded-[18px] border border-outline bg-mist"
            key={index}
          />
        ))}
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
    <div className="mx-auto mt-12 max-w-2xl rounded-[22px] border border-error/30 bg-error/5 p-8 text-center">
      <Headphones
        aria-hidden="true"
        className="mx-auto text-error"
        size={32}
      />

      <h2 className="mt-4 font-display text-2xl font-black text-brandInk">
        Plans are temporarily unavailable
      </h2>

      <p className="mt-2 text-sm leading-6 text-onSurfaceVariant">
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
    <div className="mt-8 rounded-[22px] border border-outline bg-mist p-10 text-center">
      <Wifi
        aria-hidden="true"
        className="mx-auto text-brandBlue"
        size={30}
      />

      <h3 className="mt-4 font-display text-xl font-black text-brandInk">
        No plans match this filter
      </h3>

      <p className="mt-2 text-sm text-onSurfaceVariant">
        Choose another data or validity option.
      </p>

      <Button className="mt-5" onClick={onReset} size="sm">
        Show all plans
      </Button>
    </div>
  );
}

function MissingDestinationState() {
  return (
    <div className="mx-auto mt-12 max-w-2xl rounded-[24px] border border-outline bg-mist p-9 text-center">
      <Globe2
        aria-hidden="true"
        className="mx-auto text-brandBlue"
        size={34}
      />

      <h2 className="mt-5 font-display text-2xl font-black text-brandInk">
        No plans found for this destination
      </h2>

      <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-onSurfaceVariant">
        Search for another destination or return
        to the destination directory.
      </p>

      <LinkButton className="mt-6" href="/destinations" size="md">
        View all destinations
      </LinkButton>
    </div>
  );
}
