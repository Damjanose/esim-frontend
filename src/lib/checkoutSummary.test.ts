import { describe, expect, it } from "vitest";
import {
  checkoutPriceLines,
  checkoutTotal,
  coverageCountries,
  orderSummaryToggleLabel,
  type CheckoutPromo,
} from "./checkoutSummary";

type Plan = Parameters<typeof checkoutTotal>[0];

function plan(overrides: Partial<Plan> = {}): Plan {
  return { price: "€4.00", priceNumeric: 4, ...overrides };
}

const promo: CheckoutPromo = { promoCode: "FRIEND10", discountPct: 10, finalCustomerPriceCents: 360 };

describe("checkoutTotal", () => {
  it("is the catalog price, the backend's promo total once a code applies, and null while a code is checked", () => {
    expect(checkoutTotal(plan(), null, false)).toBe("€4.00");
    expect(checkoutTotal(plan(), promo, false)).toBe("€3.60");
    // A pending check never flashes the full price (f094).
    expect(checkoutTotal(plan(), null, true)).toBeNull();
    expect(checkoutTotal(plan(), promo, true)).toBeNull();
  });
});

describe("checkoutPriceLines", () => {
  it("shows just the plan price when nothing is discounted", () => {
    expect(checkoutPriceLines(plan(), null)).toEqual([{ kind: "plan", label: "Plan price", value: "€4.00" }]);
  });

  it("starts from the original price and subtracts an admin discount (f078)", () => {
    expect(
      checkoutPriceLines(plan({ price: "€14.50", priceNumeric: 14.5, hasDiscount: true, retailPrice: 17.64 }), null),
    ).toEqual([
      { kind: "plan", label: "Plan price", value: "€17.64" },
      { kind: "discount", label: "Discount -18%", value: "-€3.14" },
    ]);
  });

  it("treats a markup (hasDiscount with a higher price) as no discount", () => {
    expect(checkoutPriceLines(plan({ price: "€12.00", priceNumeric: 12, hasDiscount: true, retailPrice: 10 }), null)).toEqual([
      { kind: "plan", label: "Plan price", value: "€12.00" },
    ]);
  });

  it("adds the partner code as the backend total's saving against the price before it", () => {
    expect(checkoutPriceLines(plan(), promo)).toEqual([
      { kind: "plan", label: "Plan price", value: "€4.00" },
      { kind: "partner", label: "Partner code -10%", value: "-€0.40" },
    ]);
    // Admin discount and partner code together: each line is its own step down to the total.
    expect(
      checkoutPriceLines(plan({ price: "€8.00", priceNumeric: 8, hasDiscount: true, retailPrice: 10 }), {
        ...promo,
        finalCustomerPriceCents: 720,
      }).map((line) => line.value),
    ).toEqual(["€10.00", "-€2.00", "-€0.80"]);
  });

  it("falls back to the percentage when the backend total isn't below the price", () => {
    expect(checkoutPriceLines(plan(), { ...promo, finalCustomerPriceCents: 400 })[1]).toEqual({
      kind: "partner",
      label: "Partner code -10%",
      value: "-10%",
    });
  });
});

describe("orderSummaryToggleLabel", () => {
  it("names the action and the total, and drops the total while it's unknown", () => {
    expect(orderSummaryToggleLabel(false, "€4.00")).toBe("Show order summary · €4.00");
    expect(orderSummaryToggleLabel(true, "€4.00")).toBe("Hide order summary · €4.00");
    expect(orderSummaryToggleLabel(false, null)).toBe("Show order summary");
  });
});

describe("coverageCountries", () => {
  it("lists countries only for multi-country bundles (local plans now carry a one-country list)", () => {
    const us = [{ countryCode: "US", title: "United States" }];
    const eu = [...us, { countryCode: "FR", title: "France" }];
    expect(coverageCountries(undefined)).toEqual([]);
    expect(coverageCountries(us)).toEqual([]);
    expect(coverageCountries(eu)).toEqual(eu);
  });
});

describe("games streak reward", () => {
  const streak = { discountPct: 5, finalCustomerPriceCents: 380 };

  it("uses the quote's total, and holds it while the quote loads", () => {
    expect(checkoutTotal(plan(), null, false, streak)).toBe("€3.80");
    expect(checkoutTotal(plan(), null, false, null, true)).toBeNull();
  });

  it("adds a streak line under the plan price", () => {
    expect(checkoutPriceLines(plan(), null, streak)).toEqual([
      { kind: "plan", label: "Plan price", value: "€4.00" },
      { kind: "streak", label: "Games streak reward -5%", value: "-€0.20" },
    ]);
  });

  it("stacks under a partner code, each line its own step down to the total", () => {
    const stacked = { ...promo, partnerFinalCents: 360, finalCustomerPriceCents: 342 };
    const lines = checkoutPriceLines(plan(), stacked, { discountPct: 5, finalCustomerPriceCents: 342 });
    expect(lines.map((line) => [line.kind, line.value])).toEqual([
      ["plan", "€4.00"],
      ["partner", "-€0.40"],
      ["streak", "-€0.18"],
    ]);
    expect(checkoutTotal(plan(), stacked, false, { discountPct: 5, finalCustomerPriceCents: 342 })).toBe("€3.42");
  });
});
