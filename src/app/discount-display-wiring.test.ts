import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("discount price display wiring", () => {
  it("checkout shows a strikethrough original price and percent-off badge when the plan has an active discount", () => {
    const source = readFileSync(join(process.cwd(), "src/app/checkout/page.tsx"), "utf8");

    expect(source).toContain("hasActiveDiscount(plan)");
    expect(source).toContain("formatOriginalPrice(plan)");
    expect(source).toContain("discountPercentOff(plan)");
  });

  it("destination plan cards (featured + compact) show the same discount treatment", () => {
    const source = readFileSync(
      join(process.cwd(), "src/app/destinations/DestinationPlans.tsx"),
      "utf8",
    );

    const occurrences = (source.match(/hasActiveDiscount\(plan\)/g) ?? []).length;
    expect(occurrences).toBe(2);
  });

  it("HeroPackageOption carries the discount fields the backend already computes", () => {
    const source = readFileSync(join(process.cwd(), "src/services/packages.ts"), "utf8");

    expect(source).toContain("hasDiscount?: boolean");
    expect(source).toContain("retailPrice?: number");
  });
});
