import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("hidden admin insights page", () => {
  it("publishes a hidden /xinsightsy route without adding public navigation links", () => {
    expect(existsSync("src/app/xinsightsy/page.tsx")).toBe(true);
    const homeSource = readFileSync("src/app/page.tsx", "utf8");
    const pageSource = readFileSync("src/app/xinsightsy/page.tsx", "utf8");
    expect(homeSource).not.toContain("/xinsightsy");
    expect(pageSource).toContain('"use client"');
  });

  it("sets noindex metadata on the insights layout", () => {
    const layoutSource = readFileSync("src/app/xinsightsy/layout.tsx", "utf8");
    expect(layoutSource).toContain("indexable: false");
  });

  it("uses the shared admin session hook and the admin nav", () => {
    const pageSource = readFileSync("src/app/xinsightsy/page.tsx", "utf8");
    expect(pageSource).toContain("useAdminSession");
    expect(pageSource).toContain("AdminNav");
    expect(pageSource).toContain("AdminLoginCard");
  });

  it("renders all Wave 1, 2 and 3 sections in order", () => {
    const pageSource = readFileSync("src/app/xinsightsy/page.tsx", "utf8");
    const names = [
      "OpportunitiesSection",
      "OverviewSection",
      "TrendSection",
      "LocationsSection",
      "AudienceSection",
      "ScreensSection",
      "DestinationsSection",
      "SearchesSection",
      "PeakTimesSection",
      "FunnelSection",
      "CampaignsSection",
      "PromotionsSection",
      "CustomersSection",
      "SeasonsSection",
      "AcquisitionSection",
      "DataHealthSection",
      "MarketingToolsSection"
    ];
    let last = -1;
    for (const name of names) {
      expect(existsSync(`src/app/xinsightsy/sections/${name}.tsx`)).toBe(true);
      const index = pageSource.indexOf(`<${name} `);
      expect(index).toBeGreaterThan(last);
      last = index;
    }
  });

  it("passes the refresh counter to every section that shows saved data", () => {
    const pageSource = readFileSync("src/app/xinsightsy/page.tsx", "utf8");
    for (const name of ["TrendSection", "CampaignsSection", "OpportunitiesSection", "SeasonsSection"]) {
      expect(pageSource).toMatch(new RegExp(`<${name} [^>]*refreshKey=\\{refreshKey\\}`));
    }
  });

  it("is listed in the admin navigation under Growth", () => {
    const navSource = readFileSync("src/app/AdminNav.tsx", "utf8");
    expect(navSource).toContain('{ href: "/xinsightsy"');
    expect(navSource).toContain('{ title: "Growth", hrefs: ["/xinsightsy"] }');
  });
});
