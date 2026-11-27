import type { Cents } from "./types";

/** The amount when exactly one currency is present. Null otherwise, so currencies are never added together. */
export function singleCurrencyValue(cents: Cents): number | null {
  const currencies = Object.keys(cents);
  return currencies.length === 1 ? cents[currencies[0]] : null;
}
