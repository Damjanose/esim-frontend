import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import robots from "./robots";
import sitemap from "./sitemap";

describe("Next SEO routes", () => {
  it("serves robots.txt rules with the subdomain sitemap and private exclusions", () => {
    const rules = robots();

    expect(rules).toMatchObject({
      sitemap: "https://esim.uplisoft.com/sitemap.xml",
      host: "https://esim.uplisoft.com"
    });
    expect(rules.rules).toEqual({
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/admin/",
        "/account/",
        "/auth/",
        "/billing/",
        "/checkout/",
        "/dashboard/",
        "/profile/",
        "/signin/",
        "/xerrors/",
        "/xloginy/"
      ]
    });
  });

  it("serves a sitemap containing only public indexable pages", () => {
    const entries = sitemap();

    expect(entries.map((entry) => entry.url)).toEqual([
      "https://esim.uplisoft.com/",
      "https://esim.uplisoft.com/destinations",
      "https://esim.uplisoft.com/destinations/usa",
      "https://esim.uplisoft.com/destinations/europe",
      "https://esim.uplisoft.com/destinations/japan",
      "https://esim.uplisoft.com/destinations/turkey",
      "https://esim.uplisoft.com/destinations/france",
      "https://esim.uplisoft.com/destinations/uk",
      "https://esim.uplisoft.com/guides/what-is-an-esim",
      "https://esim.uplisoft.com/guides/esim-vs-roaming",
      "https://esim.uplisoft.com/guides/how-to-install-esim",
      "https://esim.uplisoft.com/guides/internet-abroad",
      "https://esim.uplisoft.com/use-cases/business-travel",
      "https://esim.uplisoft.com/use-cases/remote-work",
      "https://esim.uplisoft.com/support",
      "https://esim.uplisoft.com/policy",
      "https://esim.uplisoft.com/terms"
    ]);
    expect(entries.every((entry) => entry.url.startsWith("https://esim.uplisoft.com"))).toBe(true);
    expect(entries.some((entry) => entry.url.includes("/xloginy"))).toBe(false);
    expect(entries.some((entry) => entry.url.includes("/xerrors"))).toBe(false);
    expect(entries.some((entry) => entry.url.includes("/api/"))).toBe(false);
  });

  it("adds noindex metadata layouts to hidden admin pages", () => {
    expect(existsSync("src/app/xloginy/layout.tsx")).toBe(true);
    expect(existsSync("src/app/xerrors/layout.tsx")).toBe(true);

    const dashboardLayout = readFileSync("src/app/xloginy/layout.tsx", "utf8");
    const errorsLayout = readFileSync("src/app/xerrors/layout.tsx", "utf8");

    expect(dashboardLayout).toContain("indexable: false");
    expect(errorsLayout).toContain("indexable: false");
  });

  it("has canonical redirect middleware for host, protocol, and trailing slash duplicates", () => {
    expect(existsSync("src/middleware.ts")).toBe(true);

    const middlewareSource = readFileSync("src/middleware.ts", "utf8");

    expect(middlewareSource).toContain('const canonicalHost = "esim.uplisoft.com"');
    expect(middlewareSource).toContain('const wwwHost = `www.${canonicalHost}`');
    expect(middlewareSource).toContain('request.headers.get("x-forwarded-proto")');
    expect(middlewareSource).toContain('url.protocol = "https:"');
    expect(middlewareSource).toContain('url.pathname.replace(/\\/+$/, "")');
    expect(middlewareSource).toContain("NextResponse.redirect(url, 308)");
  });
});
