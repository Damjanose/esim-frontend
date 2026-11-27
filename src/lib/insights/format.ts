import type { Money, Profit, Rate } from "./types";

const SYMBOLS: Record<string, string> = { eur: "€", usd: "$", gbp: "£" };

function formatAmount(cents: number, currency: string): string {
  const amount = (cents / 100).toFixed(2);
  const symbol = SYMBOLS[currency];
  return symbol ? `${symbol}${amount}` : `${currency.toUpperCase()} ${amount}`;
}

/** Currencies are shown side by side, never added together. */
export function formatMoney(money: Money | null): string {
  if (!money) return "—";
  const parts = Object.keys(money.byCurrency)
    .sort()
    .map((currency) => formatAmount(money.byCurrency[currency], currency));
  if (parts.length === 0 && money.unknownCount === 0) return "—";
  if (parts.length === 0) return `${money.unknownCount} unknown`;
  const text = parts.join(" · ");
  return money.unknownCount > 0 ? `${text} + ${money.unknownCount} unknown` : text;
}

export function formatRate(rate: Rate): string {
  if (rate === null) return "—";
  return `${(rate * 100).toFixed(1)}%`;
}

/** Change from the previous period. "new" when the previous period had nothing. */
export function formatChange(current: number | null, previous: number | null): string {
  if (current === null || previous === null) return "—";
  if (previous === 0) return current > 0 ? "new" : "—";
  const change = ((current - previous) / previous) * 100;
  const arrow = change > 0 ? "▲" : change < 0 ? "▼" : "►";
  return `${arrow} ${Math.abs(change).toFixed(1)}%`;
}

/** Profit with the "estimated" label when some sales use an estimated cost. */
export function formatProfit(profit: Profit | null): string {
  const text = formatMoney(profit);
  if (!profit || profit.estimatedCount === 0) return text;
  return `${text} · estimated`;
}
