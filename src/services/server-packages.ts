import { backendFetch } from "@/lib/backend";
import { mapPackagesPayload, type HeroPackageOption } from "./packages";

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
