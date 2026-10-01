import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("discount price display wiring", () => {
  it("checkout breaks an active discount out as plan price, then the discount, in the order summary", () => {
    // The checkout summary's price lines are pure rules (lib/checkoutSummary.ts),
    // rendered by OrderSummary.tsx; CheckoutPriceSection only owns the promo state.
    const rules = readFileSync(join(process.cwd(), "src/lib/checkoutSummary.ts"), "utf8");
    const summary = readFileSync(join(process.cwd(), "src/app/checkout/OrderSummary.tsx"), "utf8");

    expect(rules).toContain("hasActiveDiscount(plan)");
    expect(rules).toContain("formatOriginalPrice(plan)");
    expect(rules).toContain("discountPercentOff(plan)");
    expect(summary).toContain("checkoutPriceLines(plan, promo)");
  });

  it("destination plan rows (live view, /esim table, /pkg) show the same discount treatment", () => {
    const planRow = readFileSync(join(process.cwd(), "src/app/components/PlanRow.tsx"), "utf8");
    const tags = readFileSync(join(process.cwd(), "src/lib/planRow.ts"), "utf8");
    const destinationPlans = readFileSync(
      join(process.cwd(), "src/app/destinations/DestinationPlans.tsx"),
      "utf8",
    );

    // One implementation: PlanPrice strikes through the original price, planRowTags adds -N%.
    expect(planRow).toContain("hasActiveDiscount(plan)");
    expect(planRow).toContain("formatOriginalPrice(plan)");
    expect(tags).toContain("discountPercentOff(plan)");
    expect(destinationPlans).toContain("<PlanRow");
    expect(destinationPlans).not.toContain("hasActiveDiscount(plan)");
  });

  it("HeroPackageOption carries the discount fields the backend already computes", () => {
    const source = readFileSync(join(process.cwd(), "src/services/packages.ts"), "utf8");

    expect(source).toContain("hasDiscount?: boolean");
    expect(source).toContain("retailPrice?: number");
  });
});
