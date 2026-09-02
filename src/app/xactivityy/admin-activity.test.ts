import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("hidden admin activity page", () => {
  it("publishes a hidden /xactivityy route without adding public navigation links", () => {
    expect(existsSync("src/app/xactivityy/page.tsx")).toBe(true);

    const homeSource = readFileSync("src/app/page.tsx", "utf8");
    const pageSource = readFileSync("src/app/xactivityy/page.tsx", "utf8");

    expect(homeSource).not.toContain("/xactivityy");
    expect(pageSource).toContain('"use client"');
  });

  it("sets noindex metadata on the activity layout, matching the other hidden admin pages", () => {
    expect(existsSync("src/app/xactivityy/layout.tsx")).toBe(true);

    const layoutSource = readFileSync("src/app/xactivityy/layout.tsx", "utf8");
    expect(layoutSource).toContain("indexable: false");
  });

  it("uses the shared admin session hook instead of duplicating login logic", () => {
    const pageSource = readFileSync("src/app/xactivityy/page.tsx", "utf8");
    const hookSource = readFileSync("src/app/useAdminSession.ts", "utf8");

    expect(pageSource).toContain("useAdminSession");
    expect(hookSource).toContain("/bff/admin/login");
  });

  it("renders the interval setting, a global send-now action, and the activity list", () => {
    const pageSource = readFileSync("src/app/xactivityy/page.tsx", "utf8");

    expect(pageSource).toContain("/bff/admin/activity");
    expect(pageSource).toContain("/bff/admin/activity/settings");
    expect(pageSource).toContain("/bff/admin/activity/notify-now");
    expect(pageSource).toContain("Send now");
  });

  it("renders hidden admin navigation including user activity", () => {
    const pageSource = readFileSync("src/app/xactivityy/page.tsx", "utf8");
    const navSource = readFileSync("src/app/AdminNav.tsx", "utf8");

    expect(pageSource).toContain("AdminNav");
    expect(navSource).toContain("/xactivityy");
    expect(navSource).toContain("User activity");
  });

  it("adds local admin API proxy routes for list, settings, and notify-now", () => {
    expect(existsSync("src/app/bff/admin/activity/route.ts")).toBe(true);
    expect(existsSync("src/app/bff/admin/activity/settings/route.ts")).toBe(true);
    expect(existsSync("src/app/bff/admin/activity/notify-now/route.ts")).toBe(true);
  });
});
