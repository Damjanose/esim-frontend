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
    const banner = readFileSync("src/app/components/CountryBanner.tsx", "utf8");

    // The H1 text is still "eSIM for <country>"; the country name is the teal accent.
    expect(source).toContain("name: h1,");
    expect(source).toContain("{h1Lead}");
    expect(source).toContain('{h1Accent ? <span className="text-brandTeal">{h1Accent}</span> : null}');
    expect(source).toContain("<CountryBanner");
    expect(banner).toContain('aria-label="Breadcrumb"');
    expect(source).toContain("<table");
    expect(source).toContain("Related destinations");
    expect(source).toContain("Plans from €");
    expect(source).toContain("Buy from €");
    expect(source).toContain("are the cheapest on the market");
  });

  it("uses the app country hero and plan-row cards for the destination hero and plan section", () => {
    const source = readFileSync("src/app/EsimDestinationPage.tsx", "utf8");

    expect(source).toContain('import Image from "next/image"');
    // The country's own photo, with the generic mountain photo as the fallback.
    expect(source).toContain('src={heroImage?.imageUrl ?? "/images/mountain.webp"}');
    expect(source).toContain("Image source: Wikimedia Commons");
    // The banner photo is the LCP element.
    expect(source).toContain("priority");
    expect(source).toContain('fetchPriority="high"');
    expect(source).toContain("rounded-[26px]");
    expect(source).toContain("Live plan pricing");
    expect(source).toContain("Ready before you land");
    expect(source).toContain("<CollapsedCountryBar");
    // Sticky sidebar at lg needs a non-scrolling main: overflow-x-clip, not hidden.
    expect(source).toContain('<main className="min-h-screen overflow-x-clip');
    expect(source).toContain("lg:sticky lg:top-6");
  });

  it("keeps the plan table's semantics while its rows render as plan-row cards", () => {
    const source = readFileSync("src/app/EsimDestinationPage.tsx", "utf8");

    expect(source).toContain('<caption className="sr-only">');
    expect(source).toContain('<span className="sr-only">Buy</span>');
    expect(source).toContain('scope="row"');
    // Phones switch rows to display:grid, so the roles are explicit (Safari drops them otherwise).
    expect(source).toContain('role="table"');
    expect(source).toContain('role="rowgroup"');
    expect(source).toContain('role="row"');
    expect(source).toContain('role="columnheader"');
    expect(source).toContain('role="rowheader"');
    expect(source).toContain('role="cell"');
    expect(source).toContain("sm:border-separate sm:border-spacing-y-2");
    // Same pieces and rules as PlanRow; the best-value row has the page's only gradient CTA.
    expect(source).toContain("planRowTags(plan, { position: index })");
    expect(source).toContain("<PlanDataDisc plan={plan} />");
    expect(source).toContain("<PlanPrice plan={plan} />");
    expect(source).toContain("primary={bestValue}");
    expect(source).toContain("href={`/checkout?package=${encodeURIComponent(plan.id)}`}");
    expect(source.match(/variant="flat"/g)).toHaveLength(2);
    expect(source).not.toContain("text-white");
    expect(source).not.toContain("bg-white");
    expect(source).not.toMatch(/#[0-9a-fA-F]{3,6}\b/);
  });
});
