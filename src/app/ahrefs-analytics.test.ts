import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { AHREFS_ANALYTICS_KEY } from "@/lib/analytics";

describe("Ahrefs Web Analytics install", () => {
  const component = readFileSync("src/app/AhrefsAnalytics.tsx", "utf8");
  const layout = readFileSync("src/app/layout.tsx", "utf8");

  it("renders the async Ahrefs script with the site key", () => {
    expect(AHREFS_ANALYTICS_KEY).toBe("eur+MFq7wVUJdv9eHCGVYg");
    expect(component).toContain('src="https://analytics.ahrefs.com/analytics.js"');
    expect(component).toContain("data-key={AHREFS_ANALYTICS_KEY}");
    expect(component).toMatch(/<script async /);
  });

  it("never renders on admin x* paths", () => {
    expect(component).toContain("isAdminPath(pathname)) return null");
  });

  it("is mounted in the root layout outside the consent gate", () => {
    expect(layout.indexOf("<AhrefsAnalytics />")).toBeGreaterThan(-1);
    expect(layout.indexOf("<AhrefsAnalytics />")).toBeLessThan(layout.indexOf("<ConsentProvider>"));
    expect(component).not.toContain("useConsent");
  });

  it("is disclosed in the privacy policy", () => {
    expect(readFileSync("src/content/legal.ts", "utf8")).toContain("Ahrefs Web Analytics");
  });
});
