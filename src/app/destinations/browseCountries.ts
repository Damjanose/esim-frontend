import { coveredDestinationsForOption, type HeroPackageOption } from "@/services/packages";

export type BrowseCountryOption = {
  country: string;
  countryCode: string;
  flagUri: string;
  planCount: number;
  /** Display price of the cheapest plan: local, or a regional/global bundle that covers it. */
  fromPrice: string;
};

function normalizeCountryCode(value: string) {
  return value.trim().toLowerCase().replace(/_/g, "-").replace(/\s+/g, "-");
}

/**
 * One option per destination, sorted by name: every local plan's country,
 * plus every country a regional or global bundle covers (f115). Feeds the
 * All destinations grid and the Help Me Choose wizard.
 */
export function toCountryOptions(packages: readonly HeroPackageOption[]): BrowseCountryOption[] {
  const byCode = new Map<string, BrowseCountryOption>();
  const lowestPrice = new Map<string, number>();

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
      const code = normalizeCountryCode(destination.countryCode);
      if (!code || !destination.country.trim()) continue;

      let option = byCode.get(code);
      if (option) {
        option.planCount += 1;
        if (!option.flagUri && destination.flagUri) option.flagUri = destination.flagUri;
      } else {
        option = {
          country: destination.country,
          countryCode: destination.countryCode,
          flagUri: destination.flagUri,
          planCount: 1,
          fromPrice: pkg.price,
        };
        byCode.set(code, option);
      }

      // "from €X" is the cheapest plan, not whichever came first in the
      // catalog. priceNumeric 0 means the price couldn't be parsed ("View plan").
      if (pkg.priceNumeric > 0 && pkg.priceNumeric < (lowestPrice.get(code) ?? Number.POSITIVE_INFINITY)) {
        lowestPrice.set(code, pkg.priceNumeric);
        option.fromPrice = pkg.price;
      }
    }
  }

  return Array.from(byCode.values()).sort((a, b) => a.country.localeCompare(b.country));
}
