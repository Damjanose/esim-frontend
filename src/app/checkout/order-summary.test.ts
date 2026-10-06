import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const summary = readFileSync("src/app/checkout/OrderSummary.tsx", "utf8");

describe("checkout order summary", () => {
  it("is one panel: a phone disclosure bar over a panel that is always open at lg", () => {
    expect(summary).toContain("aria-controls={PANEL_ID}");
    expect(summary).toContain("aria-expanded={expanded}");
    expect(summary).toContain("id={PANEL_ID}");
    expect(summary).toContain("orderSummaryToggleLabel(expanded, total)");
    // The bar only exists below lg; the panel is display:none until opened, and always shown at lg.
    expect(summary).toMatch(/className="flex h-14 w-full[^"]*lg:hidden"/);
    expect(summary).toContain('${expanded ? "mt-3 block" : "hidden"}');
    expect(summary).toContain("lg:block");
    expect(summary).toContain("lg:sticky lg:top-6");
  });

  it("mounts PromoCodeField exactly once, so a stored code is checked once", () => {
    expect(summary.match(/<PromoCodeField\b/g)).toHaveLength(1);
    expect(summary).toContain("onPendingChange={onPromoPendingChange}");
  });

  it("reuses the plan-row pieces and the pure totals", () => {
    expect(summary).toContain("<PlanDataDisc plan={plan} />");
    expect(summary).toContain("planRowTags(plan, { position: null })");
    expect(summary).toContain("checkoutTotal(plan, promo, promoPending, streak, quotePending)");
    expect(summary).toContain("checkoutPriceLines(plan, promo, streak)");
    expect(summary).toContain("coverageCountries(plan.countries)");
  });

  it("uses tokens only, on the surfaceBright panel", () => {
    expect(summary).toContain("bg-surfaceBright");
    expect(summary).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(summary).not.toContain("bg-mist");
  });
});
