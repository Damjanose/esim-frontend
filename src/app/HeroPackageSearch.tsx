'use client';

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  ChevronDown,
  Globe2,
  Search,
  X,
} from "lucide-react";
import {
  fetchPackageOptions,
  type HeroPackageOption,
} from "@/services/packages";

type CountryOption = {
  country: string;
  countryCode: string;
  flagUri: string;
  planCount: number;
};

const SEARCH_DEBOUNCE_MS = 300;
const RESULTS_LIMIT = 10;

function getCountryOptions(
  packages: readonly HeroPackageOption[],
): CountryOption[] {
  const countries = new Map<string, CountryOption>();

  for (const pkg of packages) {
    if (!pkg.countryCode.trim() || !pkg.country.trim()) {
      continue;
    }

    const existingCountry = countries.get(pkg.countryCode);

    if (existingCountry) {
      existingCountry.planCount += 1;

      if (!existingCountry.flagUri && pkg.flagUri) {
        existingCountry.flagUri = pkg.flagUri;
      }

      continue;
    }

    countries.set(pkg.countryCode, {
      country: pkg.country,
      countryCode: pkg.countryCode,
      flagUri: pkg.flagUri,
      planCount: 1,
    });
  }

  return Array.from(countries.values()).sort((first, second) =>
    first.country.localeCompare(second.country),
  );
}

function normalizeSearchValue(value: string) {
  return value.trim().toLowerCase();
}

export function HeroPackageSearch() {
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement | null>(null);

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [packages, setPackages] = useState<HeroPackageOption[]>([]);
  const [selectedCountry, setSelectedCountry] =
    useState<CountryOption | null>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [navigating, setNavigating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedQuery(query);
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [query]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadPackages() {
      try {
        setLoading(true);
        setError(null);

        const packageOptions = await fetchPackageOptions();

        if (active) {
          setPackages(packageOptions);
        }
      } catch (loadError) {
        console.error("Failed to load package destinations:", loadError);

        if (active) {
          setError(
            "Destinations are unavailable right now. Please try again soon.",
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

  const countries = useMemo(() => {
    return getCountryOptions(packages);
  }, [packages]);

  const filteredCountries = useMemo(() => {
    const normalizedQuery = normalizeSearchValue(debouncedQuery);

    if (!normalizedQuery) {
      return countries.slice(0, 8);
    }

    return countries
      .filter((country) => {
        const countryName = country.country.toLowerCase();
        const countryCode = country.countryCode.toLowerCase();

        return (
          countryName.includes(normalizedQuery) ||
          countryCode.includes(normalizedQuery)
        );
      })
      .slice(0, RESULTS_LIMIT);
  }, [countries, debouncedQuery]);

  const isDebouncing = query !== debouncedQuery;

  function handleInputChange(value: string) {
    setQuery(value);
    setSelectedCountry(null);
    setIsOpen(true);
  }

  function handleClear() {
    setQuery("");
    setDebouncedQuery("");
    setSelectedCountry(null);
    setIsOpen(true);
  }

  function navigateToCountry(country: CountryOption) {
    setNavigating(true);
    setIsOpen(false);

    router.push(
      `/destinations?country=${encodeURIComponent(country.countryCode)}`,
    );
  }

  function handleCountrySelect(country: CountryOption) {
    setSelectedCountry(country);
    setQuery(country.country);
    setDebouncedQuery(country.country);

    navigateToCountry(country);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      setIsOpen(false);
      return;
    }

    if (event.key !== "Enter") {
      return;
    }

    event.preventDefault();

    const normalizedQuery = normalizeSearchValue(query);

    const exactMatch = countries.find((country) => {
      return (
        country.country.toLowerCase() === normalizedQuery ||
        country.countryCode.toLowerCase() === normalizedQuery
      );
    });

    if (exactMatch) {
      navigateToCountry(exactMatch);
      return;
    }

    if (filteredCountries.length === 1) {
      navigateToCountry(filteredCountries[0]);
    }
  }

  return (
    <div
    className="relative z-[100] w-full max-w-[620px]"
    ref={rootRef}
    >
      <div
        className={[
          "relative rounded-[20px] border p-2",
          "bg-surface",
          "shadow-brandCard",
          "transition-colors duration-200",
          isOpen
            ? "border-brandBlue"
            : "border-outline hover:border-brandBlue/40",
        ].join(" ")}
      >
        <label className="flex min-h-[60px] min-w-0 items-center gap-3 rounded-[15px] bg-outline/10 px-4">
          {selectedCountry?.flagUri ? (
            <img
              alt={`${selectedCountry.country} flag`}
              className="h-9 w-9 shrink-0 rounded-full border border-outline object-cover"
              src={selectedCountry.flagUri}
            />
          ) : (
            <Search
              aria-hidden="true"
              className="shrink-0 text-brandBlue"
              size={21}
            />
          )}

          <span className="sr-only">Search travel destination</span>

          <input
            autoComplete="off"
            className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-onSurface outline-none placeholder:text-onSurfaceVariant/60"
            disabled={navigating}
            onChange={(event) => handleInputChange(event.target.value)}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder="Where are you traveling to?"
            type="text"
            value={query}
          />

          {isDebouncing ? (
            <span
              aria-label="Searching"
              className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-brandBlue/25 border-t-brandBlue"
            />
          ) : query ? (
            <button
              aria-label="Clear destination"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-onSurfaceVariant transition hover:bg-outline/10 hover:text-onSurface"
              onClick={handleClear}
              type="button"
            >
              <X aria-hidden="true" size={17} />
            </button>
          ) : (
            <ChevronDown
              aria-hidden="true"
              className="shrink-0 text-onSurfaceVariant"
              size={18}
            />
          )}
        </label>
      </div>

      {isOpen ? (
        <div className="relative z-[70] mt-3 overflow-hidden rounded-[20px] border border-outline bg-surface shadow-brandCard">          <div className="flex items-center justify-between gap-4 border-b border-outline px-4 py-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-onSurfaceVariant">
                {debouncedQuery.trim()
                  ? "Matching destinations"
                  : "Popular destinations"}
              </p>

              <p className="mt-1 text-xs font-semibold text-onSurfaceVariant">
                Select a country to view available plans
              </p>
            </div>

            {/* {!loading && !error ? (
              <span className="shrink-0 rounded-full border border-brandBlue/30 bg-brandBlue/10 px-2.5 py-1 text-[10px] font-black text-brandBlue">
                {countries.length} countries
              </span>
            ) : null} */}
          </div>

          {loading ? (
            <div className="flex items-center gap-3 px-4 py-5">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-brandBlue/30 border-t-brandBlue" />

              <p className="text-sm font-semibold text-onSurfaceVariant">
                Loading destinations...
              </p>
            </div>
          ) : error ? (
            <div className="px-4 py-5">
              <p className="text-sm font-semibold text-onSurface">
                Could not load destinations
              </p>

              <p className="mt-1 text-xs leading-5 text-onSurfaceVariant">
                {error}
              </p>
            </div>
          ) : isDebouncing ? (
            <div className="flex items-center gap-3 px-4 py-5">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-brandBlue/30 border-t-brandBlue" />

              <p className="text-sm font-semibold text-onSurfaceVariant">
                Searching destinations...
              </p>
            </div>
          ) : filteredCountries.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-full border border-brandBlue/30 bg-brandBlue/10 text-brandBlue">
                <Globe2 aria-hidden="true" size={22} />
              </span>

              <p className="mt-4 text-sm font-black text-onSurface">
                No destination found
              </p>

              <p className="mt-1 text-xs font-semibold text-onSurfaceVariant">
                Try searching for another country.
              </p>
            </div>
          ) : (
            <div className="max-h-[340px] overflow-y-auto p-2">
              {filteredCountries.map((country) => (
                <button
                  className="group flex w-full items-center justify-between gap-4 rounded-[15px] px-3 py-3 text-left transition-colors duration-150 hover:bg-brandBlue/5 disabled:cursor-wait disabled:opacity-60"
                  disabled={navigating}
                  key={country.countryCode}
                  onClick={() => handleCountrySelect(country)}
                  type="button"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    {country.flagUri ? (
                      <img
                        alt={`${country.country} flag`}
                        className="h-11 w-11 shrink-0 rounded-full border border-outline object-cover shadow-[0_8px_20px_rgba(0,0,0,0.12)]"
                        src={country.flagUri}
                      />
                    ) : (
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brandBlue/10 text-brandBlue">
                        <Globe2 aria-hidden="true" size={19} />
                      </span>
                    )}

                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-onSurface">
                        {country.country}
                      </p>

                      <p className="mt-1 text-xs font-semibold text-onSurfaceVariant">
                        {country.planCount}{" "}
                        {country.planCount === 1 ? "plan" : "plans"} available
                      </p>
                    </div>
                  </div>

                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-outline bg-surface text-onSurfaceVariant transition group-hover:border-brandBlue/60 group-hover:text-brandBlue">
                    {navigating ? (
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-brandBlue/30 border-t-brandBlue" />
                    ) : (
                      <ArrowRight
                        aria-hidden="true"
                        className="transition-transform group-hover:translate-x-0.5"
                        size={16}
                      />
                    )}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
