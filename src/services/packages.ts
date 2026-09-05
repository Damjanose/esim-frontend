export type HeroPackageOption = {
  kind: string;
  id: string;
  country: string;
  countryCode: string;
  flagUri: string;
  dataLabel: string;
  durationLabel: string;
  title: string;
  price: string;
  priceNumeric: number;
  dataNumericGb: number;
  durationDays: number;
  filters: string[];
  query: string;
  /** Minutes included. Undefined on data-only packages. */
  voiceMinutes?: number;
  /** SMS included. Undefined on data-only packages. */
  smsCount?: number;
  /** True when an admin discount is active; `price`/`priceNumeric` are already the discounted amount. */
  hasDiscount?: boolean;
  /** Pre-discount price, same currency/units as `priceNumeric`. Only meaningful when `hasDiscount` is true. */
  retailPrice?: number;
};

export type ApiPackage = {
  kind?: string;
  id?: string;
  country?: string;
  countryCode?: string;
  region?: string;
  flagUri?: string;
  title?: string;
  headline?: string;
  description?: string;
  dataLabel?: string;
  durationLabel?: string;
  price?: string;
  priceNumeric?: number;
  dataNumericGb?: number;
  durationDays?: number;
  filters?: string[];
  voiceMinutes?: number;
  smsCount?: number;
  hasDiscount?: boolean;
  retailPrice?: number;
};

type PackagesResponse = {
  status?: string;
  data?: {
    packages?: ApiPackage[];
  };
  packages?: ApiPackage[];
};

const PACKAGE_OPTION_LIMIT = 10;

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function formatDataLabel(pkg: ApiPackage) {
  if (pkg.dataLabel?.trim()) {
    return pkg.dataLabel.trim();
  }

  if (pkg.dataNumericGb == null) {
    return "Data plan";
  }

  if (pkg.dataNumericGb >= 999) {
    return "Unlimited";
  }

  if (pkg.dataNumericGb > 0 && pkg.dataNumericGb < 1) {
    return `${Math.round(pkg.dataNumericGb * 1024)} MB`;
  }

  return `${pkg.dataNumericGb} GB`;
}

function formatDurationLabel(pkg: ApiPackage) {
  if (pkg.durationLabel?.trim()) {
    return pkg.durationLabel.trim();
  }

  if (pkg.durationDays == null) {
    return "Flexible validity";
  }

  return `${pkg.durationDays} ${
    pkg.durationDays === 1 ? "day" : "days"
  }`;
}

function parsePriceNumeric(price?: string) {
  if (!price) {
    return 0;
  }

  const normalized = price
    .replace(/\s/g, "")
    .replace(",", ".")
    .replace(/[^\d.]/g, "");

  const parsed = Number.parseFloat(normalized);

  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeFilters(filters?: string[]) {
  if (!Array.isArray(filters)) {
    return [];
  }

  return filters
    .filter(
      (filter): filter is string =>
        typeof filter === "string" && filter.trim().length > 0,
    )
    .map((filter) => filter.trim());
}

function mapPackageToOption(
  pkg: ApiPackage,
  index: number,
): HeroPackageOption {
  const country =
    pkg.country?.trim() ||
    pkg.region?.trim() ||
    "International";

  const countryCode =
    pkg.countryCode?.trim() ||
    slugify(country);

  const dataLabel = formatDataLabel(pkg);
  const durationLabel = formatDurationLabel(pkg);

  const dataNumericGb =
    typeof pkg.dataNumericGb === "number"
      ? pkg.dataNumericGb
      : dataLabel.toLowerCase().includes("unlimited")
        ? 999
        : 0;

  const durationDays =
    typeof pkg.durationDays === "number"
      ? pkg.durationDays
      : 0;

  const price =
    pkg.price?.trim() ||
    "View plan";

  const priceNumeric =
    typeof pkg.priceNumeric === "number"
      ? pkg.priceNumeric
      : parsePriceNumeric(price);

  const title =
    pkg.title?.trim() ||
    `${dataLabel} - ${durationLabel}`;

  const filters = normalizeFilters(pkg.filters);

  const id =
    pkg.id?.trim() ||
    `${countryCode}-${slugify(title)}-${index}`;

  const query = [
    country,
    countryCode,
    title,
    dataLabel,
    durationLabel,
    pkg.kind,
    pkg.region,
    pkg.headline,
    pkg.description,
    pkg.voiceMinutes ? `${pkg.voiceMinutes} min` : null,
    pkg.smsCount ? `${pkg.smsCount} sms` : null,
    ...filters,
  ]
    .filter(
      (value): value is string =>
        typeof value === "string" && value.trim().length > 0,
    )
    .join(" ")
    .toLowerCase();

  return {
    kind: pkg.kind?.trim() || "standard",
    id,
    country,
    countryCode,
    flagUri: pkg.flagUri?.trim() || "",
    dataLabel,
    durationLabel,
    title,
    price,
    priceNumeric,
    dataNumericGb,
    durationDays,
    filters,
    query,
    voiceMinutes:
      typeof pkg.voiceMinutes === "number" && pkg.voiceMinutes > 0
        ? pkg.voiceMinutes
        : undefined,
    smsCount:
      typeof pkg.smsCount === "number" && pkg.smsCount > 0
        ? pkg.smsCount
        : undefined,
    // Matches the mobile app's formatRetailPriceLabel (src/currency/formatPrice.ts):
    // trust the backend's hasDiscount flag directly, no magnitude comparison
    // against priceNumeric — an admin discount can also mark a price *up*
    // (discountDirection: 'increase'), and requiring retailPrice > priceNumeric
    // here would silently drop that case (and any other where the two happen
    // to be equal/inverted) instead of just hiding the percent badge for it.
    ...(pkg.hasDiscount && typeof pkg.retailPrice === "number"
      ? { hasDiscount: true, retailPrice: pkg.retailPrice }
      : {}),
  };
}

function matchesOption(
  option: HeroPackageOption,
  query: string,
) {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return true;
  }

  return option.query.includes(normalizedQuery);
}

export type CountryOption = { code: string; name: string };

/**
 * Distinct real-country names sellable in the catalog, for pickers that store
 * a display name rather than an ISO code (e.g. the partner application form).
 * Regional/global bundles ("Europe", "Africa Safari") are excluded — they
 * aren't countries a partner can name as their own. `countryCode` here is
 * Airalo's country slug, not an ISO code, so `code` is left blank; only the
 * name is used.
 */
export function deriveCountryOptions(options: readonly HeroPackageOption[]): CountryOption[] {
  const names = new Set<string>();
  for (const option of options) {
    if (!option.filters.includes("local")) continue;
    if (option.country) names.add(option.country);
  }
  return Array.from(names)
    .sort((a, b) => a.localeCompare(b))
    .map((name) => ({ code: "", name }));
}

export function filterPackageOptions(
  options: readonly HeroPackageOption[],
  query: string,
  limit = PACKAGE_OPTION_LIMIT,
) {
  return options
    .filter((option) => matchesOption(option, query))
    .slice(0, limit);
}

/**
 * Shared by the browser fetch below and the server-side catalog lookup, so both
 * views of a plan are built from exactly the same mapping.
 */
export function mapPackagesPayload(
  payload: PackagesResponse | ApiPackage[] | { packages?: ApiPackage[] },
): HeroPackageOption[] {
  const packages = Array.isArray(payload)
    ? payload
    : payload.packages ??
      (payload as PackagesResponse).data?.packages ??
      [];

  return packages
    .map(mapPackageToOption)
    .filter(
      (option) =>
        option.id.length > 0 &&
        option.country.length > 0 &&
        option.countryCode.length > 0,
    );
}

export async function fetchPackageOptions(): Promise<
  HeroPackageOption[]
> {
  const response = await fetch("/bff/packages", {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      `Failed to load packages: ${response.status}`,
    );
  }

  const payload = (await response.json()) as
    | PackagesResponse
    | ApiPackage[];

  return mapPackagesPayload(payload);
}

export type PackageGroupsRailId =
  | "popular"
  | "bestValue"
  | "unlimited"
  | "longStay"
  | "regional";

export type PackageGroupOptions = Record<
  PackageGroupsRailId,
  HeroPackageOption[]
>;

type PackageGroupsResponse = {
  status?: string;
  data?: Partial<Record<PackageGroupsRailId, ApiPackage[]>>;
};

/**
 * Shared by the browser fetch below and any future server-side lookup, same
 * split as `mapPackagesPayload` / `fetchPackageOptions`.
 */
function hasEnvelope(
  payload: PackageGroupsResponse | Partial<Record<PackageGroupsRailId, ApiPackage[]>>,
): payload is PackageGroupsResponse {
  return "data" in payload || "status" in payload;
}

export function mapPackageGroupsPayload(
  payload: PackageGroupsResponse | Partial<Record<PackageGroupsRailId, ApiPackage[]>>,
): PackageGroupOptions {
  const data = hasEnvelope(payload) ? payload.data ?? {} : payload;

  return {
    popular: mapPackagesPayload({ packages: data.popular ?? [] }),
    bestValue: mapPackagesPayload({ packages: data.bestValue ?? [] }),
    unlimited: mapPackagesPayload({ packages: data.unlimited ?? [] }),
    longStay: mapPackagesPayload({ packages: data.longStay ?? [] }),
    regional: mapPackagesPayload({ packages: data.regional ?? [] }),
  };
}

export async function fetchPackageGroups(): Promise<PackageGroupOptions> {
  const response = await fetch("/bff/packages/groups", {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      `Failed to load package groups: ${response.status}`,
    );
  }

  const payload = (await response.json()) as PackageGroupsResponse;

  return mapPackageGroupsPayload(payload);
}
