import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("web client error reporting wiring", () => {
  it("has route and global error boundaries that report and offer retry + support", () => {
    for (const path of ["src/app/error.tsx", "src/app/global-error.tsx"]) {
      expect(existsSync(path)).toBe(true);
      const source = readFileSync(path, "utf8");
      expect(source).toContain('"use client"');
      expect(source).toContain("reportClientError");
      expect(source).toContain("reset");
      expect(source).toContain("/support");
      expect(source).toContain("Error reference");
    }
    expect(readFileSync("src/app/global-error.tsx", "utf8")).toContain("<html");
  });

  it("reports card failures without card data and checkout return failures with the payment", () => {
    const card = readFileSync("src/app/checkout/steps/CardStep.tsx", "utf8");
    expect(card).toContain('scenario: "purchase_plan_web"');
    expect(card).toContain('stage: "card"');
    expect(card).toContain("paymentReference: paymentId");
    const reportCall = card.slice(card.indexOf("reportClientError({"), card.indexOf("[paymentId]"));
    expect(reportCall).not.toMatch(/cardNumber|securityCode|card\.expiration/);

    const ret = readFileSync("src/app/checkout/return/route.ts", "utf8");
    expect(ret).toContain('scenario: "checkout_return"');
    expect(ret).toContain("reportServerError");
    expect(ret).toContain('searchParams.set("ref"');

    expect(readFileSync("src/app/checkout/failed/page.tsx", "utf8")).toContain("Error reference");
  });
});
