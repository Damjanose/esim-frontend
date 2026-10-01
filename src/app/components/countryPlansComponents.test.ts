import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function read(file: string) {
  return readFileSync(join(process.cwd(), "src/app/components", file), "utf8");
}

describe("PlanRow", () => {
  it("renders the app's plan row: disc, duration, tags, subtitle, price, Buy now", () => {
    const source = read("PlanRow.tsx");

    // Server-safe: no hooks and no client directive, so /esim and /pkg stay static HTML.
    expect(source).not.toContain('"use client"');
    expect(source).not.toMatch(/\buse(State|Effect|Ref)\(/);
    // The tag and the text rules live in lib/planRow.ts (tested there).
    expect(source).toContain("planDataDisc(plan)");
    expect(source).toContain("planDurationText(plan)");
    expect(source).toContain("planSubtitle(plan)");
    // Disc: number in brandBlue, unit in onSurfaceVariant (brandTeal on the light disc is
    // ~2.1:1, failing WCAG AA); the data label for screen readers,
    // inside a positioned disc so the sr-only text can't escape a scroller (f195).
    expect(source).toContain("text-brandBlue");
    expect(source).toContain("text-onSurfaceVariant sm:text-[10px]");
    expect(source).toContain('className="relative grid h-12 w-12 shrink-0 place-items-center rounded-full');
    expect(source).toContain('<span className="sr-only">{plan.dataLabel}</span>');
    // Discount: strike-through original price whenever a discount is active (f078).
    expect(source).toContain("hasActiveDiscount(plan)");
    expect(source).toContain("formatOriginalPrice(plan)");
    expect(source).toContain("line-through");
  });

  it("gives only the best-value row the gradient Buy now, at a 46px tap target", () => {
    const source = read("PlanRow.tsx");

    expect(source).toContain("const bestValue = hasBestValueTag(tags);");
    expect(source).toContain('variant={primary ? "primary" : "flat"}');
    expect(source).toContain("primary={bestValue}");
    expect(source).toContain('size="md"');
    expect(source).toContain("aria-label={`Buy now: ${planTitle}`}");
    // No CTA when the caller has its own actions (/pkg).
    expect(source).toContain("{buyHref ? <PlanBuyLink");
    // Tokens only.
    expect(source).not.toMatch(/#[0-9a-fA-F]{3,6}\b/);
    expect(source).not.toContain("text-white");
    expect(source).not.toContain("bg-white");
  });
});
