import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("hidden admin partners page", () => {
  it("publishes a hidden /xpartnersy route without adding public navigation links", () => {
    expect(existsSync("src/app/xpartnersy/page.tsx")).toBe(true);

    const homeSource = readFileSync("src/app/page.tsx", "utf8");
    const pageSource = readFileSync("src/app/xpartnersy/page.tsx", "utf8");

    expect(homeSource).not.toContain("/xpartnersy");
    expect(pageSource).toContain('"use client"');
  });

  it("sets noindex metadata on the partners layout, matching the other hidden admin pages", () => {
    expect(existsSync("src/app/xpartnersy/layout.tsx")).toBe(true);

    const layoutSource = readFileSync("src/app/xpartnersy/layout.tsx", "utf8");
    expect(layoutSource).toContain("indexable: false");
  });

  it("uses the shared admin session hook instead of duplicating login logic", () => {
    const pageSource = readFileSync("src/app/xpartnersy/page.tsx", "utf8");
    const hookSource = readFileSync("src/app/useAdminSession.ts", "utf8");

    expect(pageSource).toContain("useAdminSession");
    expect(hookSource).toContain("/bff/admin/login");
  });

  it("renders hidden admin navigation including partners", () => {
    const pageSource = readFileSync("src/app/xpartnersy/page.tsx", "utf8");
    const navSource = readFileSync("src/app/AdminNav.tsx", "utf8");

    expect(pageSource).toContain("AdminNav");
    expect(navSource).toContain("/xpartnersy");
    expect(navSource).toContain("Partners");
  });

  it("renders the partner list with a status filter and approve/suspend/cancel/verify actions", () => {
    const pageSource = readFileSync("src/app/xpartnersy/page.tsx", "utf8");

    expect(pageSource).toContain("/bff/admin/partners");
    expect(pageSource).toContain("/approve");
    expect(pageSource).toContain("/suspend");
    expect(pageSource).toContain("/cancel");
    expect(pageSource).toContain("/verify");
  });

  it("renders the per-package affiliate-config panel with the live margin preview fields", () => {
    const pageSource = readFileSync("src/app/xpartnersy/page.tsx", "utf8");

    expect(pageSource).toContain("/bff/admin/partners/packages/");
    expect(pageSource).toContain("affiliate-config");
    expect(pageSource).toContain("Normal Price");
    expect(pageSource).toContain("Supplier Cost");
    expect(pageSource).toContain("Customer Discount");
    expect(pageSource).toContain("Customer Pays");
    expect(pageSource).toContain("Affiliate Commission");
    expect(pageSource).toContain("Remaining Margin");
    expect(pageSource).toContain("configuration_not_allowed");
  });

  it("renders the hold-period input wired to the hold-period BFF route", () => {
    const pageSource = readFileSync("src/app/xpartnersy/page.tsx", "utf8");

    expect(pageSource).toContain("/bff/admin/partners/hold-period");
  });

  it("renders the review-queue table with clear/cancel actions", () => {
    const pageSource = readFileSync("src/app/xpartnersy/page.tsx", "utf8");

    expect(pageSource).toContain("/bff/admin/partners/review-queue");
    expect(pageSource).toContain("/order-credits/");
    expect(pageSource).toContain("/clear");
  });
});
