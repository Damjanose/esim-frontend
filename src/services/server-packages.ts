import { backendFetch } from "@/lib/backend";
import { mapPackagesPayload, planIsoCountryCode, type HeroPackageOption } from "./packages";

const CATALOG_CACHE_TTL_MS = 60_000;

let packageOptionsCache: {
  expiresAt: number;
  value: HeroPackageOption[];
} | null = null;
let packageOptionsRequest: Promise<HeroPackageOption[]> | null = null;

/**
 * Server-side catalog access. The browser helper in `packages.ts` goes through
 * the `/bff/packages` proxy; Server Components talk to the backend directly.
 *
 * This is the public catalog only. Authenticated/private backend requests must
 * continue to use uncached paths and are not routed through this helper.
 */
export async function getPackageOptions(): Promise<HeroPackageOption[]> {
  if (packageOptionsCache && packageOptionsCache.expiresAt > Date.now()) {
    return packageOptionsCache.value;
  }

  if (packageOptionsRequest) {
    return packageOptionsRequest;
  }

  const staleValue = packageOptionsCache?.value ?? [];
  packageOptionsRequest = (async () => {
    try {
      const result = await backendFetch<{ packages?: unknown[] }>("/packages");

      if (!result.ok) {
        return staleValue;
      }

      const value = mapPackagesPayload(result.data as { packages?: [] });
      packageOptionsCache = {
        expiresAt: Date.now() + CATALOG_CACHE_TTL_MS,
        value
      };
      return value;
    } catch {
      return staleValue;
    }
  })();

  try {
    return await packageOptionsRequest;
  } finally {
    packageOptionsRequest = null;
  }
}

export async function getPackageOption(id: string): Promise<HeroPackageOption | null> {
  const wanted = id.trim();
  if (!wanted) {
    return null;
  }

  const options = await getPackageOptions();
  return options.find((option) => option.id === wanted) ?? null;
}

/**
 * The plan plus its provider details (activation, networks, fair usage). The public
 * catalog omits them, so for a local plan this also reads the country-filtered list
 * server-side. Any failure just returns the plain plan, so pages show neutral copy.
 */
export async function getPackageOptionWithDetails(id: string): Promise<HeroPackageOption | null> {
  const option = await getPackageOption(id);
  if (!option) return null;

  const iso = planIsoCountryCode(option);
  if (!iso) return option;

  try {
    const result = await backendFetch<{ packages?: unknown[] }>(`/packages?country_code=${iso}`);
    if (!result.ok) return option;
    const detailed = mapPackagesPayload(result.data as { packages?: [] }).find((item) => item.id === option.id);
    return detailed?.planDetails ? { ...option, planDetails: detailed.planDetails } : option;
  } catch {
    return option;
  }
}
