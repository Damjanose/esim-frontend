import { describe, expect, it } from "vitest";
import type { HeroPackageOption } from "@/services/packages";
import { PLAN_FILTERS, PLAN_SORTS, planValueScore, visiblePlans } from "./planList";

function plan(id: string, overrides: Partial<HeroPackageOption> = {}): HeroPackageOption {
  return {
    kind: "standard",
    id,
    country: "Hungary",
    countryCode: "hungary",
    flagUri: "",
    dataLabel: "1GB",
    durationLabel: "7 Days Duration",
    title: "1 GB - 7 days",
    price: "€4.00",
    priceNumeric: 4,
    dataNumericGb: 1,
    durationDays: 7,
    filters: ["local"],
    query: "",
    ...overrides,
  };
}

const small = plan("small", { dataNumericGb: 1, priceNumeric: 4, durationDays: 7 });
const big = plan("big", { dataLabel: "20GB", dataNumericGb: 20, priceNumeric: 12.5, durationDays: 30 });
const unl = plan("unl", { dataLabel: "Unlimited", title: "Unlimited - 10 days", dataNumericGb: 999, priceNumeric: 16, durationDays: 10 });
const zero = plan("zero", { priceNumeric: 0, durationDays: 0 });
const all = [small, big, unl, zero];

describe("planList", () => {
  it("keeps the six chips and four sorts, in order", () => {
    expect(PLAN_FILTERS.map((item) => item.label)).toEqual([
      "All plans",
      "Unlimited",
      "Fixed data",
      "1–7 days",
      "8–15 days",
      "16+ days",
    ]);
    expect(PLAN_SORTS.map((item) => item.label)).toEqual([
      "Recommended",
      "Price: low to high",
      "Price: high to low",
      "Longest validity",
    ]);
  });

  it("scores GB per euro, or days per euro for unlimited plans, and 0 when unpriced", () => {
    expect(planValueScore(small)).toBe(0.25);
    expect(planValueScore(big)).toBe(1.6);
    expect(planValueScore(unl)).toBe(10 / 16);
    expect(planValueScore(zero)).toBe(0);
  });

  it("filters by data type and by validity bucket", () => {
    const ids = (filter: Parameters<typeof visiblePlans>[1]) =>
      visiblePlans(all, filter, "price-low").map((item) => item.id);

    expect(ids("all")).toEqual(["zero", "small", "big", "unl"]);
    expect(ids("unlimited")).toEqual(["unl"]);
    expect(ids("fixed")).toEqual(["zero", "small", "big"]);
    expect(ids("short")).toEqual(["small"]);
    expect(ids("medium")).toEqual(["unl"]);
    expect(ids("long")).toEqual(["big"]);
  });

  it("sorts without mutating the input; Recommended puts the best value score first", () => {
    const ids = (sort: Parameters<typeof visiblePlans>[2]) =>
      visiblePlans(all, "all", sort).map((item) => item.id);

    expect(ids("recommended")).toEqual(["big", "unl", "small", "zero"]);
    expect(ids("price-high")).toEqual(["unl", "big", "small", "zero"]);
    expect(ids("duration")).toEqual(["big", "unl", "small", "zero"]);
    expect(all.map((item) => item.id)).toEqual(["small", "big", "unl", "zero"]);
  });
});
