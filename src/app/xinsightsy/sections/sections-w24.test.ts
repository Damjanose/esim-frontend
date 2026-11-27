import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(`src/app/xinsightsy/sections/${path}`, "utf8");

describe("campaigns: return on ad spend", () => {
  it("keeps the first-source table and the link builder, and adds the campaign-return columns", () => {
    const text = read("CampaignsSection.tsx");
    expect(text).toContain('useInsightsReport<FirstSourceData>("first-source"');
    expect(text).toContain("<LinkBuilder");
    expect(text).toContain('useInsightsReport<CampaignReturnData>("campaign-return"');
    expect(text).toContain("formatCostPerBuyer(");
    expect(text).toContain("formatRevenuePerSpend(");
    expect(text).toContain("formatProfitAfterAds(");
    expect(text).toContain("formatCents(");
  });

  it("sorts the numeric columns by number, not by their formatted text", () => {
    const text = read("CampaignsSection.tsx");
    expect(text).toContain("singleCurrencyValue(row.spend)");
    expect(text).toContain("singleCurrencyValue(row.costPerBuyer)");
    expect(text).toContain("sortValue: (row) => row.revenuePerSpend");
    expect(text).toContain("singleCurrencyValue(row.profitAfterAds)");
  });

  it("keys unmatched spend by source and campaign", () => {
    expect(read("CampaignsSection.tsx")).toContain("key={`${item.source}|${item.campaign}`}");
  });

  it("lists unmatched spend", () => {
    const text = read("CampaignsSection.tsx");
    expect(text).toContain("Unmatched spend");
    expect(text).toContain("unmatchedSpend");
  });
});

describe("promotions", () => {
  it("reads the promotions report, groups by kind, and shows tap rate, 7-day buyers and promo-code sales", () => {
    const text = read("PromotionsSection.tsx");
    expect(text).toContain('useInsightsReport<PromotionsData>("promotions"');
    expect(text).toContain("groupPromotionsByKind(");
    expect(text).toContain("formatRate(");
    expect(text).toContain("buyersWithin7d");
    expect(text).toContain("sortValue: (row) => singleCurrencyValue(row.revenueWithin7d.byCurrency)");
    expect(text).toContain("Sales with code");
    expect(text).toContain("<DataTable");
  });
});

describe("customers", () => {
  it("reads the customers report with tiles, the median and a cohort table", () => {
    const text = read("CustomersSection.tsx");
    expect(text).toContain('useInsightsReport<CustomersData>("customers"');
    expect(text).toContain("<StatTile");
    expect(text).toContain("formatMedianDays(");
    expect(text).toContain("cohortRepeatRate(");
    expect(text).toContain("<DataTable");
    expect(text).toContain("cohorts");
  });
});
