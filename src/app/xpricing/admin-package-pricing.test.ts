import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("hidden admin package pricing page", () => {
  it("publishes a hidden /xpricing route without adding public navigation links", () => {
    expect(existsSync("src/app/xpricing/page.tsx")).toBe(true);

    const homeSource = readFileSync("src/app/page.tsx", "utf8");
    const pageSource = readFileSync("src/app/xpricing/page.tsx", "utf8");

    expect(homeSource).not.toContain("/xpricing");
    expect(pageSource).toContain('"use client"');
  });

  it("sets noindex metadata on the pricing layout, matching the other hidden admin pages", () => {
    expect(existsSync("src/app/xpricing/layout.tsx")).toBe(true);

    const layoutSource = readFileSync("src/app/xpricing/layout.tsx", "utf8");
    expect(layoutSource).toContain("indexable: false");
  });

  it("uses the shared admin session hook instead of duplicating login logic a third time", () => {
    expect(existsSync("src/app/useAdminSession.ts")).toBe(true);

    const pageSource = readFileSync("src/app/xpricing/page.tsx", "utf8");
    const hookSource = readFileSync("src/app/useAdminSession.ts", "utf8");

    expect(pageSource).toContain("useAdminSession");
    expect(hookSource).toContain("velocity-admin-dashboard-token");
    expect(hookSource).toContain("/bff/admin/login");
  });

  it("renders a retail price / discount table with per-row editing and a bulk discount panel", () => {
    const pageSource = readFileSync("src/app/xpricing/page.tsx", "utf8");

    expect(pageSource).toContain("/bff/admin/packages/pricing");
    expect(pageSource).toContain("response.status === 401");
    expect(pageSource).toContain("Coverage");
    expect(pageSource).toContain("Network");
    expect(pageSource).toContain("Validity");
    expect(pageSource).toContain("Buy price");
    expect(pageSource).toContain("Sell price");
    expect(pageSource).toContain("Adjustment");
    expect(pageSource).toContain("Bulk discount");
    expect(pageSource).toContain("bulk-discount");
    expect(pageSource).toContain("Apply to selected");
    expect(pageSource).toContain("Apply to ALL packages");
  });

  it("renders a reset-to-default panel and per-row reset action", () => {
    const pageSource = readFileSync("src/app/xpricing/page.tsx", "utf8");

    expect(pageSource).toContain("/bff/admin/packages/pricing/reset");
    expect(pageSource).toContain("Reset to default");
    expect(pageSource).toContain("Reset ALL to default");
    expect(pageSource).toContain("Reset selected");
  });

  it("renders hidden admin navigation including price management", () => {
    expect(existsSync("src/app/AdminNav.tsx")).toBe(true);

    const pageSource = readFileSync("src/app/xpricing/page.tsx", "utf8");
    const navSource = readFileSync("src/app/AdminNav.tsx", "utf8");

    expect(pageSource).toContain("AdminNav");
    expect(navSource).toContain("/xpricing");
    expect(navSource).toContain("Price management");
  });

  it("adds local admin API proxy routes for the pricing table, single edits, and bulk discount", () => {
    expect(existsSync("src/app/bff/admin/packages/pricing/route.ts")).toBe(true);
    expect(existsSync("src/app/bff/admin/packages/pricing/[packageId]/route.ts")).toBe(true);
    expect(existsSync("src/app/bff/admin/packages/pricing/bulk-discount/route.ts")).toBe(true);
    expect(existsSync("src/app/bff/admin/packages/pricing/reset/route.ts")).toBe(true);

    const listProxy = readFileSync("src/app/bff/admin/packages/pricing/route.ts", "utf8");
    const editProxy = readFileSync("src/app/bff/admin/packages/pricing/[packageId]/route.ts", "utf8");
    const bulkProxy = readFileSync("src/app/bff/admin/packages/pricing/bulk-discount/route.ts", "utf8");
    const resetProxy = readFileSync("src/app/bff/admin/packages/pricing/reset/route.ts", "utf8");

    expect(listProxy).toContain("/admin/packages/pricing");
    expect(listProxy).toContain("backendFetch");
    expect(editProxy).toContain("/admin/packages/pricing/");
    expect(editProxy).toContain("backendFetch");
    expect(editProxy).toContain('method: "PUT"');
    expect(bulkProxy).toContain("/admin/packages/pricing/bulk-discount");
    expect(bulkProxy).toContain("backendFetch");
    expect(bulkProxy).toContain('method: "POST"');
    expect(resetProxy).toContain("/admin/packages/pricing/reset");
    expect(resetProxy).toContain("backendFetch");
    expect(resetProxy).toContain('method: "POST"');
  });
});
