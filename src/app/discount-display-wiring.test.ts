import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("discount price display wiring", () => {
  it("checkout shows a strikethrough original price and percent-off badge when the plan has an active discount", () => {
    // The price summary (and its admin-discount display) was lifted out of the
    // server-rendered page.tsx into a client component so an applied partner
    // promo code can update the total — see CheckoutPriceSection.tsx.
    const source = readFileSync(
      join(process.cwd(), "src/app/checkout/CheckoutPriceSection.tsx"),
      "utf8",
    );

    expect(source).toContain("hasActiveDiscount(plan)");
    expect(source).toContain("formatOriginalPrice(plan)");
    expect(source).toContain("discountPercentOff(plan)");
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
