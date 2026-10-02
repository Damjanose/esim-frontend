import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { RETIRED_COLOR_CLASS } from "./components/retiredTokens";

const read = (file: string) => readFileSync(join(process.cwd(), file), "utf8");
const page = read("src/app/page.tsx");
const testimonials = read("src/app/Testimonials.tsx");

/** Source of one top-level function in page.tsx, up to the next top-level declaration. */
function fn(name: string): string {
  const start = page.indexOf(`function ${name}(`);
  expect(start).toBeGreaterThan(-1);
  const rest = page.slice(start + 1);
  const next = rest.search(/\n(?:\/\*\*|function |const |export )/);
  return page.slice(start, next === -1 ? undefined : start + 1 + next);
}

describe("homepage marketing blocks", () => {
  it("drops the gradient Benefits bento (the hero perk line already covers it)", () => {
    expect(page).not.toContain("function Benefits(");
    expect(page).not.toContain("<Benefits />");
    expect(page).not.toContain("BENEFIT_TILES");
  });

  it("uses plain section headings: no tracked-caps eyebrows, gradient text or Title Case slogans", () => {
    const top = read("src/app/TopDestinationLinks.tsx");
    for (const source of [page, testimonials, top]) {
      expect(source).not.toContain("text-label-caps uppercase text-brandBlue");
      expect(source).not.toMatch(/uppercase tracking-\[0\.2\d?em\] text-brandBlue/);
      expect(source).not.toContain("bg-clip-text");
    }
    expect(page).not.toContain("Stay Connected Anywhere");
  });

  it("makes the testimonials a scroll-snap carousel on phones and a grid at lg", () => {
    expect(testimonials).toContain("snap-x snap-mandatory");
    expect(testimonials).toContain("[contain:inline-size]");
    expect(testimonials).toContain("min-w-0");
    expect(testimonials).toMatch(/relative[^"`]*overflow-x-auto/);
    expect(testimonials).toContain("lg:grid");
    expect(testimonials).toContain("snap-start");
    // Testimonials are not review schema (f191).
    expect(testimonials).not.toContain("Review");
    expect(testimonials).not.toContain("ld+json");
    // No "5.0 from 3 travelers" average badge or decorative quote glyphs.
    expect(testimonials).not.toContain("Average from");
    expect(testimonials).not.toContain("QuoteMark");
  });

  it("keeps the FAQ as the native details accordion fed by landingContent.faqs", () => {
    const src = fn("TrustAndFaq");
    expect(src).toContain("<details");
    expect(src).toContain("landingContent.faqs.map");
    expect(src).toContain("min-h-11");
  });

  it("puts the store buttons in the hero under the search, and the partner promo on its own row", () => {
    const hero = fn("Hero");
    expect(hero).toContain("<HeroAppBadges />");
    expect(hero.indexOf("<HeroAppBadges />")).toBeGreaterThan(hero.indexOf("<HeroTuneButton />"));
    expect(fn("HeroAppBadges")).toContain('id="download-app"');
    // No separate Get the app card further down the page.
    expect(page).not.toContain("function AppDownload(");
    expect(fn("PartnerBand")).toContain("<PartnerPromo />");
    expect(page).toContain('id="partner-with-us"');
  });

  it("gives each store badge an accessible name that contains its visible text", () => {
    expect(page).toContain('aria-label="Download on the App Store, eSim2you"');
    expect(page).toContain("Download on the");
    expect(page).toContain('aria-label="Get it on Google Play, eSim2you"');
    expect(page).toContain("Get it on");
    // No micro text below 12px in the store badges.
    expect(fn("HeroAppBadges")).not.toContain("text-[10px]");
  });

  it("renders the closing CTA as a plain row with a single primary button to destinations", () => {
    const src = fn("Cta");
    expect(src).not.toContain("bg-gradient");
    expect(src.match(/<LinkButton/g)).toHaveLength(1);
    expect(src).toContain('href="/destinations"');
  });

  it("uses at most one primary (default variant) button in each of the touched sections", () => {
    for (const name of ["TrustAndFaq", "PartnerPromo", "Cta"]) {
      expect((fn(name).match(/<LinkButton/g) ?? []).length).toBeLessThanOrEqual(1);
    }
  });

  it("stays off retired colour tokens in the homepage blocks", () => {
    expect(RETIRED_COLOR_CLASS.test(page)).toBe(false);
    expect(RETIRED_COLOR_CLASS.test(testimonials)).toBe(false);
  });
});
