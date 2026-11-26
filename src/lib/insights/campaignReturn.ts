import { formatMoney } from "./format";
import type { Cents } from "./types";

/** Each currency on its own. Empty means no data, so the screen shows "unknown", never 0. */
function formatPerCurrency(cents: Cents): string {
  const parts = Object.keys(cents)
    .sort()
    .map((currency) => {
      const value = cents[currency];
      const sign = value < 0 ? "−" : "";
      return `${sign}${formatMoney({ byCurrency: { [currency]: Math.abs(value) }, unknownCount: 0 })}`;
    });
  return parts.length > 0 ? parts.join(" · ") : "unknown";
}

export function formatCostPerBuyer(costPerBuyer: Cents): string {
  return formatPerCurrency(costPerBuyer);
}

export function formatProfitAfterAds(profitAfterAds: Cents): string {
  return formatPerCurrency(profitAfterAds);
}

export function formatRevenuePerSpend(revenuePerSpend: number | null): string {
  if (revenuePerSpend === null) return "unknown";
  return `${revenuePerSpend.toFixed(2)}×`;
}
