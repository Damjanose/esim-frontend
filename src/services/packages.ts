export type HeroPackageOption = {
  id: string;
  title: string;
  subtitle: string;
  details: string;
  price: string;
  query: string;
};

type ApiPackage = {
  id?: string;
  country?: string;
  region?: string;
  title?: string;
  headline?: string;
  description?: string;
  dataLabel?: string;
  durationLabel?: string;
  price?: string;
  dataNumericGb?: number;
  durationDays?: number;
};

type PackagesResponse = {
  status?: string;
  data?: {
    packages?: ApiPackage[];
  };
  packages?: ApiPackage[];
};

const PACKAGE_OPTION_LIMIT = 5;

function formatDataLabel(pkg: ApiPackage) {
  if (pkg.dataLabel) return pkg.dataLabel;
  if (pkg.dataNumericGb == null) return "Data plan";
  if (pkg.dataNumericGb >= 999) return "Unlimited";
  if (pkg.dataNumericGb > 0 && pkg.dataNumericGb < 1) return `${Math.round(pkg.dataNumericGb * 1024)}MB`;
  return `${Math.round(pkg.dataNumericGb)}GB`;
}

function formatDurationLabel(pkg: ApiPackage) {
  if (pkg.durationLabel) return pkg.durationLabel;
  if (pkg.durationDays == null) return "Flexible validity";
  return `${pkg.durationDays} days`;
}

function mapPackageToOption(pkg: ApiPackage, index: number): HeroPackageOption {
  const title = pkg.country ?? pkg.title ?? "Travel data package";
  const subtitle = pkg.region ?? pkg.description ?? pkg.headline ?? "Provider-backed eSIM package";
  const details = `${formatDataLabel(pkg)} - ${formatDurationLabel(pkg)}`;

  return {
    id: pkg.id ?? `${title}-${index}`,
    title,
    subtitle,
    details,
    price: pkg.price ?? "View",
    query: title,
  };
}

function matchesOption(option: HeroPackageOption, query: string) {
  if (!query.trim()) return true;
  const normalizedQuery = query.trim().toLowerCase();

  return [option.title, option.subtitle, option.details, option.price]
    .join(" ")
    .toLowerCase()
    .includes(normalizedQuery);
}

export function filterPackageOptions(
  options: readonly HeroPackageOption[],
  query: string,
  limit = PACKAGE_OPTION_LIMIT,
) {
  return options.filter((option) => matchesOption(option, query)).slice(0, limit);
}

export async function fetchPackageOptions(): Promise<HeroPackageOption[]> {
  const response = await fetch("/api/packages");

  if (!response.ok) {
    throw new Error("Failed to load packages");
  }

  const payload = (await response.json()) as PackagesResponse;
  const packages = payload.data?.packages ?? payload.packages ?? [];

  return packages.map(mapPackageToOption).filter((option) => option.title.trim().length > 0);
}
