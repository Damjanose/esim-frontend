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

/** EUR -> USD/GBP multipliers for display estimates; null when unknown. */
export type DisplayRates = {
  usd: number | null;
  gbp: number | null;
};

function positiveRate(currencies: CurrencyRate[] | undefined, code: string): number | null {
  const rate = currencies?.find((currency) => currency.code === code)?.rateToEur;
  return typeof rate === "number" && rate > 0 ? rate : null;
}

async function loadDisplayRates(): Promise<DisplayRates> {
  const result = await backendFetch<CurrenciesPayload>("/currencies");
  if (!result.ok) {
    return { usd: null, gbp: null };
  }

  return {
    usd: positiveRate(result.data.currencies, "USD"),
    gbp: positiveRate(result.data.currencies, "GBP")
  };
}

// The backend's rates are indicative only and refresh once a day, so an hour
// of staleness here is fine for a "~$X / ~£X" display estimate that never
// feeds checkout math (checkout always charges in EUR).
const getCachedDisplayRates = unstable_cache(loadDisplayRates, ["display-exchange-rates"], {
  revalidate: 3600
});

/** USD and GBP rates for the US and UK markets, from one /currencies call. */
export async function getDisplayRates(): Promise<DisplayRates> {
  return getCachedDisplayRates();
}

export async function getGbpRate(): Promise<number | null> {
  return (await getCachedDisplayRates()).gbp;
}

export function convertEurToGbp(eurAmount: number, rateToEur: number): number {
  return eurAmount * rateToEur;
}

// Round first so float noise (17.5 * 0.86 = 15.049999…) can't flip the cent.
function money(amount: number): string {
  return (Math.round(amount * 100) / 100).toFixed(2);
}

export function formatGbp(amount: number): string {
  return `£${money(amount)}`;
}

export function formatUsd(amount: number): string {
  return `$${money(amount)}`;
}

/**
 * "~$4.32–$18.90 · ~£3.44–£15.05" for a EUR price range, USD first (US is the
 * first market). Only currencies with a rate appear; null when there are none.
 */
export function formatEstimateRange(lowEur: number, highEur: number, rates: DisplayRates): string | null {
  const parts: string[] = [];
  const range = (rate: number, format: (amount: number) => string) => {
    const low = format(lowEur * rate);
    const high = format(highEur * rate);
    return low === high ? `~${low}` : `~${low}–${high}`;
  };

  if (rates.usd) parts.push(range(rates.usd, formatUsd));
  if (rates.gbp) parts.push(range(rates.gbp, formatGbp));
  return parts.length > 0 ? parts.join(" · ") : null;
}
