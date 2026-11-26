import { describe, expect, it } from "vitest";
import { cohortRepeatRate, formatMedianDays } from "./customers";

describe("formatMedianDays", () => {
  it("shows unknown when there is no median, and days otherwise", () => {
    expect(formatMedianDays(null)).toBe("unknown");
    expect(formatMedianDays(0)).toBe("0 days");
    expect(formatMedianDays(1)).toBe("1 day");
    expect(formatMedianDays(42)).toBe("42 days");
  });
});

describe("cohortRepeatRate", () => {
  it("is repeat buyers over buyers, and null for an empty cohort", () => {
    expect(cohortRepeatRate({ buyers: 4, repeatBuyers: 1 })).toBe(0.25);
    expect(cohortRepeatRate({ buyers: 0, repeatBuyers: 0 })).toBeNull();
  });
});
