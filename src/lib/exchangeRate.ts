import { unstable_cache } from "next/cache";
import { backendFetch } from "./backend";

type CurrencyRate = {
  code: string;
  rateToEur: number;
  updatedAt: string;
};

type CurrenciesPayload = {
  base: string;
  currencies: CurrencyRate[];
};

async function loadGbpRate(): Promise<number | null> {
  const result = await backendFetch<CurrenciesPayload>("/currencies");
  if (!result.ok) {
    return null;
  }

  const gbp = result.data.currencies?.find((currency) => currency.code === "GBP");
  return gbp?.rateToEur ?? null;
}

// The backend's rates are indicative only and refresh once a day, so an hour
// of staleness here is fine for a "~£X" display estimate that never feeds
// checkout math (checkout always charges in EUR).
const getCachedGbpRate = unstable_cache(loadGbpRate, ["gbp-exchange-rate"], {
  revalidate: 3600
});

export async function getGbpRate(): Promise<number | null> {
  return getCachedGbpRate();
}

export function convertEurToGbp(eurAmount: number, rateToEur: number): number {
  return eurAmount * rateToEur;
}

export function formatGbp(amount: number): string {
  return `£${amount.toFixed(2)}`;
}
