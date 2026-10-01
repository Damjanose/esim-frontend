import { describe, expect, it } from "vitest";
import {
  hasBestValueTag,
  planCoverageNote,
  isUnlimitedPlan,
  planDataDisc,
  planDurationText,
  planRowTags,
  planSubtitle,
  planVoiceSmsDetail,
  type PlanRowPlan,
} from "./planRow";

function plan(overrides: Partial<PlanRowPlan> = {}): PlanRowPlan {
  return {
    id: "change-in-7days-1gb",
    title: "1 GB - 7 days",
    dataLabel: "1GB",
    durationLabel: "7 Days Duration",
    price: "€4.00",
    priceNumeric: 4,
    dataNumericGb: 1,
    durationDays: 7,
    ...overrides,
  };
}

describe("planRowTags", () => {
  it("tags only the first row of the displayed list as Best value", () => {
    expect(planRowTags(plan(), { position: 0 })).toEqual([{ kind: "best-value", label: "Best value" }]);
    expect(planRowTags(plan(), { position: 1 })).toEqual([]);
    // Outside a list (/pkg) nothing is the best value.
    expect(planRowTags(plan(), { position: null })).toEqual([]);
  });

  it("adds the -N% badge through discountPercentOff, never for a markup", () => {
    expect(
      planRowTags(plan({ hasDiscount: true, priceNumeric: 8, retailPrice: 10, price: "€8.00" }), { position: 3 }),
    ).toEqual([{ kind: "discount", label: "-20%" }]);
    // discountDirection 'increase': still hasDiscount, but no badge (f078).
    expect(planRowTags(plan({ hasDiscount: true, priceNumeric: 12, retailPrice: 10 }), { position: 3 })).toEqual([]);
    // retailPrice alone is not a discount.
    expect(planRowTags(plan({ retailPrice: 3.52 }), { position: 3 })).toEqual([]);
  });

  it("adds Calls + SMS when the plan includes minutes or texts, in a fixed order", () => {
    expect(planRowTags(plan({ voiceMinutes: 10 }), { position: 2 })).toEqual([
      { kind: "calls-sms", label: "Calls + SMS" },
    ]);
    expect(planRowTags(plan({ smsCount: 10 }), { position: 2 })).toEqual([
      { kind: "calls-sms", label: "Calls + SMS" },
    ]);
    expect(
      planRowTags(plan({ voiceMinutes: 10, smsCount: 10, hasDiscount: true, priceNumeric: 7, retailPrice: 10 }), {
        position: 0,
      }).map((tag) => tag.kind),
    ).toEqual(["best-value", "discount", "calls-sms"]);
  });

  it("hasBestValueTag picks the list's single gradient Buy now", () => {
    expect(hasBestValueTag(planRowTags(plan(), { position: 0 }))).toBe(true);
    expect(hasBestValueTag(planRowTags(plan({ voiceMinutes: 5 }), { position: 1 }))).toBe(false);
  });
});

describe("planDataDisc", () => {
  it("splits the data label into the number and the unit", () => {
    expect(planDataDisc(plan())).toEqual({ unlimited: false, value: "1", unit: "GB" });
    expect(planDataDisc(plan({ dataLabel: "500MB", dataNumericGb: 0.49 }))).toEqual({
      unlimited: false,
      value: "500",
      unit: "MB",
    });
    expect(planDataDisc(plan({ dataLabel: "3 GB", dataNumericGb: 3 }))).toEqual({ unlimited: false, value: "3", unit: "GB" });
  });

  it("shows ∞ + UNL for unlimited plans (dataNumericGb >= 999 or an Unlimited label)", () => {
    const unl = { unlimited: true, value: "∞", unit: "UNL" };
    expect(planDataDisc(plan({ dataLabel: "Unlimited", dataNumericGb: 999 }))).toEqual(unl);
    expect(planDataDisc(plan({ dataLabel: "Unlimited", dataNumericGb: undefined }))).toEqual(unl);
    expect(planDataDisc(plan({ dataLabel: "1GB", title: "Unlimited - 3 days" }))).toEqual(unl);
  });

  it("falls back to dataNumericGb, then to the raw label", () => {
    expect(planDataDisc(plan({ dataLabel: "Data plan", dataNumericGb: 0.5 }))).toEqual({
      unlimited: false,
      value: "512",
      unit: "MB",
    });
    expect(planDataDisc(plan({ dataLabel: "Data plan", dataNumericGb: 1.5 }))).toEqual({
      unlimited: false,
      value: "1.5",
      unit: "GB",
    });
    expect(planDataDisc(plan({ dataLabel: "Data plan", dataNumericGb: 0 }))).toEqual({
      unlimited: false,
      value: "Data plan",
      unit: "",
    });
  });
});

describe("plan row text", () => {
  it("prints the duration from durationDays, else the label without 'Duration'", () => {
    expect(planDurationText(plan())).toBe("7 days");
    expect(planDurationText(plan({ durationDays: 1 }))).toBe("1 day");
    expect(planDurationText(plan({ durationDays: 0 }))).toBe("7 Days");
    expect(planDurationText(plan({ durationDays: undefined, durationLabel: "Flexible validity" }))).toBe(
      "Flexible validity",
    );
  });

  it("formats minutes and texts like the old plan cards", () => {
    expect(planVoiceSmsDetail(plan({ voiceMinutes: 75, smsCount: 30 }))).toBe("75 min + 30 SMS");
    expect(planVoiceSmsDetail(plan({ smsCount: 30 }))).toBe("30 SMS");
    expect(planVoiceSmsDetail(plan())).toBeNull();
  });

  it("subtitles a row with its minutes/texts, else the old CompactPlanCard line", () => {
    expect(planSubtitle(plan({ voiceMinutes: 10, smsCount: 10 }))).toBe("10 min + 10 SMS");
    expect(planSubtitle(plan({ dataLabel: "Unlimited", dataNumericGb: 999 }))).toBe("High-speed data without limits.");
    expect(planSubtitle(plan({ durationDays: 15 }))).toBe("Perfect for short trips.");
    expect(planSubtitle(plan({ durationDays: 30 }))).toBe("More data for longer adventures.");
  });

  it("isUnlimitedPlan matches the live view's old rule", () => {
    expect(isUnlimitedPlan(plan({ dataNumericGb: 999 }))).toBe(true);
    expect(isUnlimitedPlan(plan({ dataLabel: "UNLIMITED" }))).toBe(true);
    expect(isUnlimitedPlan(plan())).toBe(false);
  });
});

describe("planCoverageNote", () => {
  it("names the bundle's coverage for regional or global plans", () => {
    expect(planCoverageNote({ filters: ["global", "regional"], country: "European Union and United Kingdom" })).toBe(
      "European Union and United Kingdom",
    );
  });

  it("is null for local plans, plans without filters, and blank names", () => {
    expect(planCoverageNote({ filters: ["local"], country: "Hungary" })).toBeNull();
    expect(planCoverageNote({ country: "Hungary" })).toBeNull();
    expect(planCoverageNote({ filters: [], country: "Europe" })).toBeNull();
    expect(planCoverageNote({ filters: ["regional"], country: "  " })).toBeNull();
  });
});
