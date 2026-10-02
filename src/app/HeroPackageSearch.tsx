'use client';

import { useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { useRouter } from "next/navigation";
import { ChevronDown, Search } from "lucide-react";
import {
  coveredDestinationsForOption,
  fetchPackageOptions,
  normalizeDestinationValue,
  type HeroPackageOption,
} from "@/services/packages";
import {
  HeroSearchDialog,
  rememberRecentDestination,
  type CountryOption,
} from "./HeroSearchDialog";

function getCountryOptions(
  packages: readonly HeroPackageOption[],
): CountryOption[] {
  const countries = new Map<string, CountryOption>();

  for (const pkg of packages) {
    const destinations = [
      {
        country: pkg.country,
        countryCode: pkg.countryCode,
        flagUri: pkg.flagUri,
      },
      ...(!pkg.filters.includes("local")
        ? coveredDestinationsForOption(pkg).map((destination) => ({
            country: destination.title,
            countryCode: destination.slug,
            flagUri: "",
          }))
        : []),
    ];

    for (const destination of destinations) {
      if (!destination.countryCode.trim() || !destination.country.trim()) continue;
      const key = normalizeDestinationValue(destination.countryCode);
      const existingCountry = countries.get(key);

      if (existingCountry) {
        existingCountry.planCount += 1;
        if (!existingCountry.flagUri && destination.flagUri) {
          existingCountry.flagUri = destination.flagUri;
        }
        continue;
      }

      countries.set(key, {
        country: destination.country,
        countryCode: destination.countryCode,
        flagUri: destination.flagUri,
        planCount: 1,
      });
    }
  }

  return Array.from(countries.values()).sort((first, second) =>
    first.country.localeCompare(second.country),
  );
}

/**
 * Hero search field. It is a button at every size: tapping/clicking it opens
 * HeroSearchDialog (full screen on phones, a centered panel from sm up), so
 * results never render inline and push the hero around.
 */
export function HeroPackageSearch() {
  const router = useRouter();
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [packages, setPackages] = useState<HeroPackageOption[]>([]);
  const [selectedCountry, setSelectedCountry] =
    useState<CountryOption | null>(null);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [navigating, setNavigating] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  function openDialog() {
    // Mount the dialog synchronously so focusing its input still counts as
    // part of the tap — iOS only raises the keyboard inside a user gesture.
    flushSync(() => setIsDialogOpen(true));
    inputRef.current?.focus();
  }

  function closeDialog() {
    setIsDialogOpen(false);
    triggerRef.current?.focus();
  }

  function handleCountrySelect(country: CountryOption) {
    rememberRecentDestination(country);
    setSelectedCountry(country);
    setNavigating(true);

    router.push(
      `/destinations?country=${encodeURIComponent(country.countryCode)}`,
    );
  }

  return (
    <div
    className="relative z-[100] w-full max-w-[620px]"
    >
      <div
        className={[
          "relative rounded-[20px] border p-2",
          "bg-surface",
          "shadow-brandCard",
          "transition-colors duration-200",
          isDialogOpen
            ? "border-brandBlue"
            : "border-outline hover:border-brandBlue/40",
        ].join(" ")}
      >
        <button
          aria-haspopup="dialog"
          className="flex min-h-[60px] w-full min-w-0 items-center gap-3 rounded-[15px] bg-outline/10 px-4 text-left"
          disabled={navigating}
          onClick={openDialog}
          ref={triggerRef}
          type="button"
        >
          {selectedCountry?.flagUri ? (
            <img
              alt=""
              className="h-9 w-9 shrink-0 rounded-full border border-outline object-cover"
              src={selectedCountry.flagUri}
            />
          ) : (
            <Search aria-hidden="true" className="shrink-0 text-brandBlue" size={21} />
          )}
          <span
            className={[
              "min-w-0 flex-1 truncate text-sm font-semibold",
              selectedCountry ? "text-onSurface" : "text-onSurfaceVariant/70",
            ].join(" ")}
          >
            {selectedCountry?.country ?? "Where are you traveling to?"}
          </span>
          {navigating ? (
            <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-brandBlue/25 border-t-brandBlue" />
          ) : (
            <ChevronDown aria-hidden="true" className="shrink-0 text-onSurfaceVariant" size={18} />
          )}
        </button>
      </div>

      {isDialogOpen ? (
        <HeroSearchDialog
          countries={countries}
          error={error}
          inputRef={inputRef}
          loading={loading}
          navigating={navigating}
          onClose={closeDialog}
          onSelect={handleCountrySelect}
        />
      ) : null}
    </div>
  );
}
