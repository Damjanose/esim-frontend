import { backendFetch } from "@/lib/backend";

type EsimCountry = { code: string; name: string; geography: string };

/**
 * Single-country destinations (no regional/global packs), alphabetical. Used as
 * the trip destination suggestions and as BillingStep's country list.
 */
export async function loadLocalCountries(): Promise<Array<{ code: string; name: string }>> {
  const result = await backendFetch<{ countries: EsimCountry[] }>("/esim/countries", {
    next: { revalidate: 3600 }
  });
  if (!result.ok) return [];
  return result.data.countries
    .filter((country) => country.geography === "local")
    .map((country) => ({ code: country.code, name: country.name }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
