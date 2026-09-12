import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("SEO content page template", () => {
  it("renders the shared site footer on guide, destination, and use-case pages", () => {
    const source = readFileSync("src/app/SeoContentPage.tsx", "utf8");

    expect(source).toContain('import { SiteFooter } from "./SiteFooter"');
    expect(source).toContain("<SiteFooter />");
  });

  it("renders destination pages with a keyword H1, breadcrumbs, and a live plan table", () => {
    const source = readFileSync("src/app/EsimDestinationPage.tsx", "utf8");

    expect(source).toContain("{h1}");
    expect(source).toContain('aria-label="Breadcrumb"');
    expect(source).toContain("<table");
    expect(source).toContain("Related destinations");
    expect(source).toContain("Plans from €");
    expect(source).toContain("Buy from €");
    expect(source).toContain("are the cheapest on the market");
  });
});
