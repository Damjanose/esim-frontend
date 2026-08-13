import { backendFetch } from "@/lib/backend";
import { mapPackagesPayload, type HeroPackageOption } from "./packages";

/**
 * Server-side catalog access. The browser helper in `packages.ts` goes through
 * the `/api/packages` proxy; Server Components talk to the backend directly.
 */
export async function getPackageOptions(): Promise<HeroPackageOption[]> {
  const result = await backendFetch<{ packages?: unknown[] }>("/packages");

  if (!result.ok) {
    return [];
  }

  return mapPackagesPayload(result.data as { packages?: [] });
}

export async function getPackageOption(id: string): Promise<HeroPackageOption | null> {
  const wanted = id.trim();
  if (!wanted) {
    return null;
  }

  const options = await getPackageOptions();
  return options.find((option) => option.id === wanted) ?? null;
}
