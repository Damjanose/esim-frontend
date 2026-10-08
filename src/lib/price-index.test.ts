import { describe, expect, it } from "vitest";
import type { PriceIndexRow } from "./destinationPricing";
import { formatEur, priceIndexCsv, summarizePriceIndex } from "./price-index";

function row(name: string, pricePerGb: number | null): PriceIndexRow {
  const slug = name.toLowerCase();
  return {
    slug,
    name,
    path: `/esim/${slug}`,
    fromPrice: 4,
    planCount: 3,
    bestPerGb:
      pricePerGb === null
        ? null
        : { pricePerGb, priceNumeric: pricePerGb * 10, dataLabel: "10 GB", durationLabel: "30 days" }
  };
}

describe("summarizePriceIndex", () => {
  it("finds the cheapest and priciest per-GB destinations and the median, ignoring unsized rows", () => {
    const summary = summarizePriceIndex([row("Italy", 2), row("Japan", 1), row("Peru", null), row("USA", 4)]);

    expect(summary.destinationCount).toBe(4);
    expect(summary.cheapestPerGb?.name).toBe("Japan");
    expect(summary.priciestPerGb?.name).toBe("USA");
    expect(summary.medianPerGb).toBe(2);
  });

  it("has no headline numbers without live rows", () => {
    expect(summarizePriceIndex([])).toEqual({
      destinationCount: 0,
      cheapestPerGb: null,
      priciestPerGb: null,
      medianPerGb: null
    });
  });
});

describe("priceIndexCsv", () => {
  it("writes one row per destination with absolute URLs and quotes commas", () => {
    const csv = priceIndexCsv([row("Italy", 2), { ...row("Bonaire, Sint Eustatius", null) }], "https://example.test", "2026-10-08T00:00:00.000Z");
    const lines = csv.trim().split("\n");

    expect(lines[0]).toBe(
      "destination,from_price_eur,best_price_per_gb_eur,best_value_plan_data,best_value_plan_validity,best_value_plan_price_eur,plans_available,url,updated_at"
    );
    expect(lines[1]).toBe("Italy,4.00,2.00,10 GB,30 days,20.00,3,https://example.test/esim/italy,2026-10-08T00:00:00.000Z");
    expect(lines[2].startsWith('"Bonaire, Sint Eustatius",4.00,,,,,3,')).toBe(true);
  });
});

describe("formatEur", () => {
  it("formats euros with two decimals", () => {
    expect(formatEur(1.5)).toBe("€1.50");
  });
});
