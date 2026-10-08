'use client';

import { useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import {
  coveredDestinationsForOption,
  fetchPackageOptions,
  normalizeDestinationValue,
  type HeroPackageOption,
} from "@/services/packages";
import { destinationBrowseHref } from "@/lib/esim-routes";
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

    router.push(destinationBrowseHref(country.countryCode));
  }

  return (
    <div
    className="relative z-[100] w-full max-w-[620px]"
    >
      {/* One flat white field on the dark hero (the design's search), 56px to
          match HeroTuneButton; the blue ring marks the open dialog. */}
      <button
        aria-haspopup="dialog"
        className={[
          "flex h-14 w-full min-w-0 items-center gap-3 rounded-[16px] bg-surface px-4 text-left",
          "transition-shadow duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white",
          isDialogOpen ? "ring-2 ring-brandBlue" : "hover:ring-2 hover:ring-white/40",
        ].join(" ")}
        disabled={navigating}
        onClick={openDialog}
        ref={triggerRef}
        type="button"
      >
        {selectedCountry?.flagUri ? (
          <img
            alt=""
            className="h-7 w-7 shrink-0 rounded-full border border-outline object-cover"
            src={selectedCountry.flagUri}
          />
        ) : (
          <Search aria-hidden="true" className="shrink-0 text-brandBlue" size={20} />
        )}
        <span
          className={[
            "min-w-0 flex-1 truncate text-[15px]",
            selectedCountry ? "font-semibold text-onSurface" : "text-onSurfaceVariant",
          ].join(" ")}
        >
          {selectedCountry?.country ?? "Where are you going?"}
        </span>
        {navigating ? (
          <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-brandBlue/25 border-t-brandBlue" />
        ) : null}
      </button>

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
