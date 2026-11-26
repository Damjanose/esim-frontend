import { describe, expect, it } from "vitest";
import { buildCampaignLink, CAMPAIGN_MEDIUMS, sanitizeUtmValue } from "./linkBuilder";

const BASE = "https://esim.uplisoft.com/esim/usa";

describe("sanitizeUtmValue", () => {
  it("lower-cases, turns spaces into dashes and strips other characters", () => {
    expect(sanitizeUtmValue("  Summer SALE!  ")).toBe("summer-sale");
    expect(sanitizeUtmValue("Paid/Social & Co")).toBe("paidsocial--co");
    expect(sanitizeUtmValue("keep_this-1")).toBe("keep_this-1");
  });
});

describe("buildCampaignLink", () => {
  it("builds the utm parameters with sanitised values", () => {
    const result = buildCampaignLink({ base: BASE, source: "Facebook", medium: "paid_social", campaign: "Black Friday" });
    expect(result).toEqual({ url: "https://esim.uplisoft.com/esim/usa?utm_source=facebook&utm_medium=paid_social&utm_campaign=black-friday" });
  });

  it("adds content when given", () => {
    const result = buildCampaignLink({ base: BASE, source: "x", medium: "email", campaign: "y", content: "Hero Button" });
    expect("url" in result && result.url).toContain("utm_content=hero-button");
  });

  it("requires source, medium and campaign", () => {
    expect(buildCampaignLink({ base: BASE, source: "", medium: "email", campaign: "y" })).toEqual({ error: "source_required" });
    expect(buildCampaignLink({ base: BASE, source: "x", medium: " ", campaign: "y" })).toEqual({ error: "medium_required" });
    expect(buildCampaignLink({ base: BASE, source: "x", medium: "email", campaign: "!!!" })).toEqual({ error: "campaign_required" });
  });

  it("keeps the base path and its own query", () => {
    const result = buildCampaignLink({ base: "https://esim.uplisoft.com/destinations?sort=price", source: "x", medium: "email", campaign: "y" });
    const url = new URL("url" in result ? result.url : "https://bad");
    expect(url.pathname).toBe("/destinations");
    expect(url.searchParams.get("sort")).toBe("price");
    expect(url.searchParams.get("utm_source")).toBe("x");
  });

  it("refuses a base that is not on esim.uplisoft.com", () => {
    expect(buildCampaignLink({ base: "https://evil.example/esim/usa", source: "x", medium: "email", campaign: "y" })).toEqual({ error: "base_not_allowed" });
    expect(buildCampaignLink({ base: "not a url", source: "x", medium: "email", campaign: "y" })).toEqual({ error: "base_not_allowed" });
  });

  it("keeps utm_source on an app link, which the app reads from the link", () => {
    const result = buildCampaignLink({ base: "https://esim.uplisoft.com/pkg/abc123", source: "tiktok", medium: "influencer", campaign: "spring" });
    expect("url" in result && result.url).toContain("utm_source=tiktok");
  });

  it("offers the medium presets", () => {
    expect(CAMPAIGN_MEDIUMS).toEqual(["cpc", "paid_social", "email", "influencer", "qr", "referral"]);
  });
});
