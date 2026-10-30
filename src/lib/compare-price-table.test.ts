import { describe, expect, it } from "vitest";
import type { DestinationPlanRow } from "./destinationPricing";
import { comparePriceRow, formatValidityRange } from "./compare-price-table";

function plan(dataNumericGb: number, durationDays: number, priceNumeric: number): DestinationPlanRow {
  const dataLabel = dataNumericGb >= 999 ? "Unlimited" : `${dataNumericGb} GB`;
  return {
    id: `${dataNumericGb}-${durationDays}`,
    title: dataLabel,
    dataLabel,
    durationLabel: `${durationDays} Days Duration`,
    network: "4G/5G",
    price: `€${priceNumeric.toFixed(2)}`,
    priceNumeric,
    dataNumericGb,
    durationDays
  };
}

describe("comparePriceRow", () => {
  it("finds the cheapest plan, best fixed-data price per GB, cheapest unlimited and validity range", () => {
    const row = comparePriceRow([plan(20, 30, 8), plan(1, 7, 4), plan(999, 5, 15), plan(999, 1, 6), plan(3, 15, 6)]);

    expect(row?.cheapest).toEqual({ dataLabel: "1 GB", durationLabel: "7 days", priceNumeric: 4 });
    expect(row?.bestPerGb).toMatchObject({ dataLabel: "20 GB", pricePerGb: 0.4 });
    expect(row?.cheapestUnlimited).toMatchObject({ durationLabel: "1 day", priceNumeric: 6 });
    expect(row?.validityDays).toEqual([1, 30]);
  });

  it("leaves price per GB empty when only unlimited plans exist", () => {
    const row = comparePriceRow([plan(999, 7, 10)]);

    expect(row?.bestPerGb).toBeNull();
    expect(row?.cheapestUnlimited?.priceNumeric).toBe(10);
  });

  it("returns null without live plans", () => {
    expect(comparePriceRow([])).toBeNull();
  });
});

describe("formatValidityRange", () => {
  it("collapses a single value and uses an en dash for a range", () => {
    expect(formatValidityRange([1, 1])).toBe("1 day");
    expect(formatValidityRange([7, 7])).toBe("7 days");
    expect(formatValidityRange([1, 30])).toBe("1–30 days");
  });
});
