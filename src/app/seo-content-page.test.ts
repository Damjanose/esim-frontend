import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("SEO content page template", () => {
  it("renders the shared site footer on guide, destination, and use-case pages", () => {
    const source = readFileSync("src/app/SeoContentPage.tsx", "utf8");

    expect(source).toContain('import { SiteFooter } from "./SiteFooter"');
    expect(source).toContain("<SiteFooter />");
  });

  it("renders enabled App Store and Google Play links for content-page app CTAs", () => {
    const source = readFileSync("src/app/SeoContentPage.tsx", "utf8");

    expect(source).toContain("landingContent.appLinks.ios.href");
    expect(source).toContain("landingContent.appLinks.android.href");
    expect(source).toContain('aria-label="Download Velocity eSIM on the App Store"');
    expect(source).toContain('aria-label="Download Velocity eSIM on Google Play"');
    expect(source).toContain("cursor-pointer");
    expect(source).not.toContain('aria-disabled="true"');
    expect(source).not.toContain("cursor-not-allowed");
    expect(source).not.toContain('target="_blank"');
  });
});
