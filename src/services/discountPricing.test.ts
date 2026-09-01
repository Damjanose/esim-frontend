import { describe, expect, it } from "vitest";
import {
  discountPercentOff,
  formatOriginalPrice,
  hasActiveDiscount,
} from "./discountPricing";
import type { HeroPackageOption } from "./packages";

function plan(overrides: Partial<HeroPackageOption> = {}): HeroPackageOption {
  return {
    kind: "standard",
    id: "pkg-1",
    country: "Spain",
    countryCode: "spain",
    flagUri: "",
    dataLabel: "10 GB",
    durationLabel: "15 Days Duration",
    title: "10 GB - 15 days",
    price: "€8.00",
    priceNumeric: 8,
    dataNumericGb: 10,
    durationDays: 15,
    filters: ["local"],
    query: "",
    ...overrides,
  };
}

describe("hasActiveDiscount", () => {
  it("is false when hasDiscount is unset", () => {
    expect(hasActiveDiscount(plan())).toBe(false);
  });

  it("is false when hasDiscount is true but retailPrice is missing", () => {
    expect(hasActiveDiscount(plan({ hasDiscount: true }))).toBe(false);
  });

  it("is true when both hasDiscount and retailPrice are set", () => {
    expect(hasActiveDiscount(plan({ hasDiscount: true, retailPrice: 10 }))).toBe(true);
  });
});

describe("formatOriginalPrice", () => {
  it("reuses the same currency prefix the current price string carries", () => {
    const p = plan({ price: "€8.00", retailPrice: 12.5 });
    expect(formatOriginalPrice(p)).toBe("€12.50");
  });

  it("reuses a $ prefix just as well", () => {
    const p = plan({ price: "$8.00", retailPrice: 12 });
    expect(formatOriginalPrice(p)).toBe("$12.00");
  });
});

describe("discountPercentOff", () => {
  it("computes the percent savings from the actual before/after amounts", () => {
    const p = plan({ hasDiscount: true, priceNumeric: 8, retailPrice: 10 });
    expect(discountPercentOff(p)).toBe(20);
  });

  it("rounds to the nearest whole percent", () => {
    const p = plan({ hasDiscount: true, priceNumeric: 7, retailPrice: 10 });
    expect(discountPercentOff(p)).toBe(30);
  });

  it("is null when there's no active discount at all", () => {
    const p = plan({ priceNumeric: 8, retailPrice: 10 });
    expect(discountPercentOff(p)).toBeNull();
  });

  it("is null (not a negative percent) for a discount that raised the price (discountDirection: 'increase')", () => {
    // hasDiscount can be true even when retailPrice ends up lower than the
    // final priceNumeric — an admin markup, not a markdown. The strikethrough
    // original price still shows (via hasActiveDiscount), but a "-N%" badge
    // wouldn't make sense here, matching the mobile app's formatDiscountBadge.
    const p = plan({ hasDiscount: true, priceNumeric: 12, retailPrice: 10 });
    expect(discountPercentOff(p)).toBeNull();
  });
});
