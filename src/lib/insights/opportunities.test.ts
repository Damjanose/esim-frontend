import { describe, expect, it } from "vitest";
import { OPPORTUNITY_RULES, type OpportunityCard } from "./types";
import { belowSampleText, OPPORTUNITY_FOOTER, opportunityStyle, opportunityToneClass, sortOpportunityCards } from "./opportunities";

const card = (rule: OpportunityCard["rule"], key: string): OpportunityCard => ({
  rule,
  key,
  title: key,
  suggestion: "",
  numbers: []
});

describe("opportunityStyle", () => {
  it("gives every rule an icon and a tone", () => {
    for (const rule of OPPORTUNITY_RULES) {
      const style = opportunityStyle(rule);
      expect(style.icon).toMatch(/^[a-z-]+$/);
      expect(["money", "conversion", "risk", "timing"]).toContain(style.tone);
    }
  });

  it("uses the money tone for campaign and payment rules", () => {
    expect(opportunityStyle("campaign_unprofitable").tone).toBe("money");
    expect(opportunityStyle("payment_method_failing").tone).toBe("money");
  });
});

describe("sortOpportunityCards", () => {
  it("puts money rules first, then keeps the order of cards within a rule", () => {
    const sorted = sortOpportunityCards([
      card("best_hours", "h"),
      card("zero_result_search", "z"),
      card("destination_low_conversion", "d2"),
      card("campaign_unprofitable", "c"),
      card("destination_low_conversion", "d1"),
      card("payment_method_failing", "p")
    ]);
    expect(sorted.map((c) => c.key)).toEqual(["c", "p", "d2", "d1", "z", "h"]);
  });
});

describe("belowSampleText", () => {
  it("says how many visitors are needed", () => {
    expect(belowSampleText(100)).toBe("Not enough data yet (needs 100 visitors)");
  });
});

describe("OPPORTUNITY_FOOTER", () => {
  it("states that the cards are patterns, not proven causes, and nothing is changed", () => {
    expect(OPPORTUNITY_FOOTER).toBe(
      "Suggestions from fixed rules. They show a pattern, not a proven cause. Nothing is sent or changed automatically."
    );
  });
});

describe("opportunityToneClass", () => {
  it("gives every tone a text colour class from the shared tokens", () => {
    expect(opportunityToneClass("money")).toContain("text-");
    expect(opportunityToneClass("conversion")).not.toBe(opportunityToneClass("money"));
  });
});
