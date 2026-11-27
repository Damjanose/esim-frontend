import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(`src/app/xinsightsy/sections/${path}`, "utf8");

describe("opportunities", () => {
  it("reads the opportunities report, sorts the cards, and shows each card's numbers", () => {
    const text = read("OpportunitiesSection.tsx");
    expect(text).toContain('useInsightsReport<OpportunitiesData>("opportunities"');
    expect(text).toContain("sortOpportunityCards(");
    expect(text).toContain("opportunityStyle(");
    expect(text).toContain("numbers");
    expect(text).toContain("<DataTable");
  });

  it("shows the sample message when there is not enough data, and the fixed footer line", () => {
    const text = read("OpportunitiesSection.tsx");
    expect(text).toContain("belowSample");
    expect(text).toContain("belowSampleText(");
    expect(text).toContain("OPPORTUNITY_FOOTER");
  });
});
