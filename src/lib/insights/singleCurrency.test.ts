import { describe, expect, it } from "vitest";
import { singleCurrencyValue } from "./singleCurrency";

describe("singleCurrencyValue", () => {
  it("returns the amount when exactly one currency is present", () => {
    expect(singleCurrencyValue({ usd: 1250 })).toBe(1250);
  });

  it("returns null when there are several currencies, so they never get added", () => {
    expect(singleCurrencyValue({ usd: 1250, eur: 300 })).toBeNull();
  });

  it("returns null when there is no amount", () => {
    expect(singleCurrencyValue({})).toBeNull();
  });
});
