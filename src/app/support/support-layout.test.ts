import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { RETIRED_COLOR_CLASS } from "../components/retiredTokens";

describe("support page restyle (spec 8B)", () => {
  const source = readFileSync("src/app/support/SupportPageClient.tsx", "utf8");

  it("keeps search, topics, FAQ, quick links and contact in the same order", () => {
    const order = ["<SupportHero", "<SupportCategories", "<FaqSection", "<NoResults", "<QuickHelp />", "<ContactSupport />"];
    const positions = order.map((marker) => source.indexOf(marker));
    expect(positions.every((position) => position > 0)).toBe(true);
    expect([...positions].sort((a, b) => a - b)).toEqual(positions);
    expect(source).toContain('id="contact-support"');
    expect(source).toContain('href="#contact-support"');
    expect(source).toContain("href={`mailto:${supportEmail}`}");
  });

  it("lets the FAQ sidebar stick at lg: overflow-x-clip on main, not overflow-hidden (f215)", () => {
    expect(source).toContain('<main className="min-h-screen overflow-x-clip bg-surface text-onSurface">');
    expect(source).not.toContain("min-h-screen overflow-hidden");
    expect(source).toContain("lg:sticky lg:top-6");
  });

  it("has one gradient CTA (Email support); the no-results reset is flat", () => {
    expect(source.match(/<LinkButton/g)).toHaveLength(1);
    expect(source).toContain('<Button className="mt-6" onClick={onClear} size="md" variant="tint">');
  });

  it("gives the search clear button and text links 44px targets", () => {
    expect(source).toContain('aria-label="Clear search"');
    expect(source).toContain("grid h-11 w-11 shrink-0 place-items-center rounded-full");
    expect(source).toContain("min-h-[60px]");
    expect(source).toContain('className="h-11 min-w-0 flex-1 bg-transparent');
    expect(source.match(/CONTENT_TEXT_LINK/g)?.length).toBeGreaterThanOrEqual(3);
    expect(source).toContain("min-h-14");
  });

  it("is on the current tokens only", () => {
    expect(source).not.toMatch(RETIRED_COLOR_CLASS);
    expect(source).not.toContain("bg-white");
    expect(source).not.toContain("text-white");
    expect(source).not.toContain("hero-grid");
    expect(source).not.toMatch(/rgba\(/);
    expect(source).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  });
});
