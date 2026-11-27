import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("failed checkout carries the payment method", () => {
  it("the card return route sends method=card", () => {
    expect(readFileSync("src/app/checkout/return/route.ts", "utf8")).toContain('target.searchParams.set("method", "card")');
  });

  it("the PayPal return route sends method=paypal", () => {
    expect(readFileSync("src/app/checkout/paypal/return/route.ts", "utf8")).toContain('target.searchParams.set("method", "paypal")');
  });

  it("the failed page reads method and kind and passes them to FailureEvent", () => {
    const page = readFileSync("src/app/checkout/failed/page.tsx", "utf8");
    expect(page).toContain("method?: string");
    expect(page).toContain("<FailureEvent");
    expect(page).toContain("method={method}");
    expect(page).toContain("kind={kind}");
  });
});
