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

describe("homepage marketing blocks (phase 7, bento)", () => {
  it("lays Benefits out as a bento: gradient tile, two tinted tiles, one ink strip", () => {
    const src = fn("Benefits");
    expect(page).toContain("from-brandBlue via-[#0E86C0] to-brandTeal text-white");
    expect(page.match(/bg-surfaceBright/g)!.length).toBeGreaterThanOrEqual(2);
    expect(page).toContain("bg-brandInk text-white");
    expect(src).toContain("lg:grid-cols-4");
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
  });

  it("keeps the FAQ as the native details accordion fed by landingContent.faqs", () => {
    const src = fn("TrustAndFaq");
    expect(src).toContain("<details");
    expect(src).toContain("landingContent.faqs.map");
    expect(src).toContain("min-h-11");
  });

  it("puts app download and partner promo on one row at lg, stacked on phones", () => {
    const src = fn("AppAndPartner");
    expect(src).toContain("lg:grid-cols-");
    expect(src).toContain("<AppDownload />");
    expect(src).toContain("<PartnerPromo />");
    expect(page).toContain('id="download-app"');
    expect(page).toContain('id="partner-with-us"');
  });

  it("gives each store badge an accessible name that contains its visible text", () => {
    expect(page).toContain('aria-label="Download on the App Store, eSim2you"');
    expect(page).toContain("Download on the");
    expect(page).toContain('aria-label="Get it on Google Play, eSim2you"');
    expect(page).toContain("Get it on");
    // No micro text below 12px in the store badges.
    expect(fn("AppDownload")).not.toContain("text-[10px]");
  });

  it("renders the closing CTA as a gradient card with a single primary button", () => {
    const src = fn("Cta");
    expect(src).toContain("bg-gradient-to-br");
    expect(src.match(/<LinkButton/g)).toHaveLength(1);
    expect(src).not.toContain('variant="flat"');
  });

  it("uses at most one primary (default variant) button in each of the touched sections", () => {
    for (const name of ["Benefits", "TrustAndFaq", "AppDownload", "PartnerPromo", "Cta"]) {
      expect((fn(name).match(/<LinkButton/g) ?? []).length).toBeLessThanOrEqual(1);
    }
  });

  it("stays off retired colour tokens in the homepage blocks", () => {
    expect(RETIRED_COLOR_CLASS.test(page)).toBe(false);
    expect(RETIRED_COLOR_CLASS.test(testimonials)).toBe(false);
  });
});
