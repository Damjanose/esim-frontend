import { describe, expect, it } from "vitest";
import { allSitemapEntries } from "@/lib/sitemaps";
import { destinationBuyingChecks } from "./destination-buying";

describe("destinationBuyingChecks", () => {
  const checks = destinationBuyingChecks("Italy");
  const text = checks.map((check) => `${check.question} ${check.answer}`).join(" ").toLowerCase();

  it("covers the terms travelers compare plans on", () => {
    for (const term of ["unlocked", "dual-sim", "whatsapp", "hotspot", "tethering", "top-up", "refund"]) {
      expect(text).toContain(term);
    }
  });

  it("names the destination", () => {
    expect(text).toContain("italy");
  });

  it("never claims hotspot support the catalog cannot back", () => {
    expect(text).toContain("hotspot and tethering support depends on the plan");
    expect(text).not.toMatch(/hotspot (is )?(included|allowed|supported) on (all|every)/);
  });

  it("matches the terms: prepaid and non-refundable once activated or delivered", () => {
    expect(text).toContain("non-refundable once activated or delivered");
  });

  it("links only to pages in the sitemap", () => {
    const paths = new Set(allSitemapEntries().map((entry) => new URL(entry.url).pathname));
    for (const check of checks) {
      if (check.link) expect(paths).toContain(check.link.href);
    }
  });
});
