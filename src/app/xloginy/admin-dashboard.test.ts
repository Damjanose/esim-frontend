import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("hidden admin purchase dashboard", () => {
  it("publishes a hidden /xloginy route without adding public navigation links", () => {
    expect(existsSync("src/app/xloginy/page.tsx")).toBe(true);

    const homeSource = readFileSync("src/app/page.tsx", "utf8");
    const dashboardSource = readFileSync("src/app/xloginy/page.tsx", "utf8");

    expect(homeSource).not.toContain("/xloginy");
    expect(dashboardSource).toContain('"use client"');
    expect(dashboardSource).toContain("sessionStorage");
  });

  it("renders an admin login, purchase table, and SVG purchases-over-time chart", () => {
    const dashboardSource = readFileSync("src/app/xloginy/page.tsx", "utf8");

    expect(dashboardSource).toContain("/api/admin/login");
    expect(dashboardSource).toContain("/api/admin/dashboard");
    expect(dashboardSource).toContain("response.status === 401");
    expect(dashboardSource).toContain("sessionStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY)");
    expect(dashboardSource).toContain("Purchases over time");
    expect(dashboardSource).toContain("<svg");
    expect(dashboardSource).toContain("Email");
    expect(dashboardSource).toContain("Package");
    expect(dashboardSource).toContain("Price");
    expect(dashboardSource).toContain("Purchased At");
  });

  it("renders user tracking and recent OTP request sections", () => {
    const dashboardSource = readFileSync("src/app/xloginy/page.tsx", "utf8");

    expect(dashboardSource).toContain("Total users");
    expect(dashboardSource).toContain("Users");
    expect(dashboardSource).toContain("OTP requests");
    expect(dashboardSource).toContain("Latest OTP");
    expect(dashboardSource).toContain("Recent OTP requests");
    expect(dashboardSource).toContain("userCount");
    expect(dashboardSource).toContain("recentOtpRequests");
  });

  it("renders hidden admin navigation between dashboard and error inbox", () => {
    expect(existsSync("src/app/AdminNav.tsx")).toBe(true);

    const dashboardSource = readFileSync("src/app/xloginy/page.tsx", "utf8");
    const navSource = readFileSync("src/app/AdminNav.tsx", "utf8");

    expect(dashboardSource).toContain("AdminNav");
    expect(navSource).toContain("/xloginy");
    expect(navSource).toContain("/xerrors");
    expect(navSource).toContain("Purchase dashboard");
    expect(navSource).toContain("Error Inbox");
  });

  it("adds local admin API proxy routes for login and dashboard data", () => {
    expect(existsSync("src/app/api/admin/login/route.ts")).toBe(true);
    expect(existsSync("src/app/api/admin/dashboard/route.ts")).toBe(true);

    const loginProxy = readFileSync("src/app/api/admin/login/route.ts", "utf8");
    const dashboardProxy = readFileSync("src/app/api/admin/dashboard/route.ts", "utf8");
    // Backend URL resolution is shared by all proxy routes rather than copied per route.
    const backendSource = readFileSync("src/lib/backend.ts", "utf8");

    expect(loginProxy).toContain("/admin/login");
    expect(loginProxy).toContain("backendFetch");
    expect(dashboardProxy).toContain("/admin/dashboard");
    expect(dashboardProxy).toContain("Authorization");
    expect(dashboardProxy).toContain("backendFetch");
    expect(backendSource).toContain("BACKEND_API_URL");
    expect(backendSource).toContain("https://esim.uplisoft.com/api");
    // No environment-dependent fallback: the hosted backend is the default everywhere.
    expect(backendSource).not.toContain("NODE_ENV");
  });
});
