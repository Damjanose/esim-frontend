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
};

type ApiPackage = {
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

export function filterPackageOptions(
  options: readonly HeroPackageOption[],
  query: string,
  limit = PACKAGE_OPTION_LIMIT,
) {
  return options
    .filter((option) => matchesOption(option, query))
    .slice(0, limit);
}

export async function fetchPackageOptions(): Promise<
  HeroPackageOption[]
> {
  const response = await fetch("/api/packages", {
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

  const packages = Array.isArray(payload)
    ? payload
    : payload.data?.packages ?? payload.packages ?? [];

  return packages
    .map(mapPackageToOption)
    .filter(
      (option) =>
        option.id.length > 0 &&
        option.country.length > 0 &&
        option.countryCode.length > 0,
    );
}
