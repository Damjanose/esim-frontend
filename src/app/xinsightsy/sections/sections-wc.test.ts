import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(`src/app/xinsightsy/sections/${path}`, "utf8");

describe("screens", () => {
  it("reads the screens report, with an app / web switch and a table", () => {
    const text = read("ScreensSection.tsx");
    expect(text).toContain('useInsightsReport<ScreensData>("screens"');
    expect(text).toContain("<DataTable");
    expect(text).toContain('"app"');
    expect(text).toContain('"web"');
    expect(text).toContain("<SectionState");
  });
});

describe("destinations", () => {
  it("reads the destinations report with a table and the interest badge", () => {
    const text = read("DestinationsSection.tsx");
    expect(text).toContain('useInsightsReport<DestinationsData>("destinations"');
    expect(text).toContain("<DataTable");
    expect(text).toContain("High interest, few sales");
    expect(text).toContain("highInterestFewSales(");
    expect(text).toContain("a pattern, not a cause");
    expect(text).toContain("destinationLabel(");
  });
});

describe("searches", () => {
  it("shows the three lists and the 3-person note", () => {
    const text = read("SearchesSection.tsx");
    expect(text).toContain('useInsightsReport<SearchesData>("searches"');
    expect(text).toContain("data.top");
    expect(text).toContain("data.zeroResults");
    expect(text).toContain("data.flightAirports");
    expect(text).toContain("Only terms searched by 3 or more people are shown");
  });
});

describe("funnel", () => {
  it("shows steps with rates, a platform switch, a failures table and the counting label", () => {
    const text = read("FunnelSection.tsx");
    expect(text).toContain('useInsightsReport<FunnelData>("funnel"');
    expect(text).toContain("stepRates(");
    expect(text).toContain("byPlatform");
    expect(text).toContain("failures");
    expect(text).toContain("Each step counts visitors who reached it");
  });
});

describe("campaigns", () => {
  it("shows the first-source table and the link builder", () => {
    const text = read("CampaignsSection.tsx");
    expect(text).toContain('useInsightsReport<FirstSourceData>("first-source"');
    expect(text).toContain("<LinkBuilder");
    expect(text).toContain("<DataTable");
  });

  it("the link builder copies to the clipboard", () => {
    const text = read("LinkBuilder.tsx");
    expect(text).toContain("buildCampaignLink(");
    expect(text).toContain("navigator.clipboard");
    expect(text).toContain("CAMPAIGN_MEDIUMS");
  });
});
