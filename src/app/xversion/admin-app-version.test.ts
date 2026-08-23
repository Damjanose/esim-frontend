import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("hidden admin app version page", () => {
  it("publishes a hidden /xversion route without adding public navigation links", () => {
    expect(existsSync("src/app/xversion/page.tsx")).toBe(true);

    const homeSource = readFileSync("src/app/page.tsx", "utf8");
    const pageSource = readFileSync("src/app/xversion/page.tsx", "utf8");

    expect(homeSource).not.toContain("/xversion");
    expect(pageSource).toContain('"use client"');
  });

  it("sets noindex metadata on the version layout, matching the other hidden admin pages", () => {
    expect(existsSync("src/app/xversion/layout.tsx")).toBe(true);

    const layoutSource = readFileSync("src/app/xversion/layout.tsx", "utf8");
    expect(layoutSource).toContain("indexable: false");
  });

  it("uses the shared admin session hook instead of duplicating login logic", () => {
    const pageSource = readFileSync("src/app/xversion/page.tsx", "utf8");
    const hookSource = readFileSync("src/app/useAdminSession.ts", "utf8");

    expect(pageSource).toContain("useAdminSession");
    expect(hookSource).toContain("velocity-admin-dashboard-token");
  });

  it("loads and saves the minimum version through the admin app-version proxy", () => {
    const pageSource = readFileSync("src/app/xversion/page.tsx", "utf8");

    expect(pageSource).toContain("/bff/admin/app-version");
    expect(pageSource).toContain("response.status === 401");
    expect(pageSource).toContain('method: "PUT"');
  });

  it("renders hidden admin navigation including app version", () => {
    const navSource = readFileSync("src/app/AdminNav.tsx", "utf8");

    expect(navSource).toContain("/xversion");
    expect(navSource).toContain("App version");
  });

  it("adds a local admin API proxy route that forwards to the backend admin endpoint", () => {
    expect(existsSync("src/app/bff/admin/app-version/route.ts")).toBe(true);

    const proxy = readFileSync("src/app/bff/admin/app-version/route.ts", "utf8");

    expect(proxy).toContain("/admin/app-version");
    expect(proxy).toContain("backendFetch");
    expect(proxy).toContain('method: "PUT"');
  });
});
