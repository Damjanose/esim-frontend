import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { privateRoutePrefixes } from "@/lib/seo";
import { allSitemapEntries, sitemapEntriesFor, sitemapSegmentIds } from "@/lib/sitemaps";
import robots from "./robots";
import { GET as sitemapIndex } from "./sitemap.xml/route";

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
      disallow: privateRoutePrefixes.map((prefix) => `${prefix}/`)
    });
    expect(privateRoutePrefixes).toEqual(
      expect.arrayContaining(["/xpricing", "/xversion", "/xactivityy", "/xpartnersy", "/xnotificationy"])
    );
  });

  it("splits the sitemap into named public segments with real lastModified dates", async () => {
    const index = await sitemapIndex();
    const indexXml = await index.text();

    expect(index.headers.get("content-type")).toContain("application/xml");
    for (const id of sitemapSegmentIds) {
      expect(indexXml).toContain(`https://esim.uplisoft.com/sitemaps/${id}.xml`);
    }

    const esim = sitemapEntriesFor("esim");
    const travel = sitemapEntriesFor("travel");
    const compare = sitemapEntriesFor("compare");
    const all = allSitemapEntries();

    expect(esim.map((entry) => entry.url)).toEqual(
      expect.arrayContaining([
        "https://esim.uplisoft.com/esim/usa",
        "https://esim.uplisoft.com/esim/albania",
        "https://esim.uplisoft.com/esim/europe"
      ])
    );
    expect(travel.map((entry) => entry.url)).toEqual(
      expect.arrayContaining([
        "https://esim.uplisoft.com/travel",
        "https://esim.uplisoft.com/travel/how-to-install-esim"
      ])
    );
    expect(compare.map((entry) => entry.url)).toEqual(
      expect.arrayContaining([
        "https://esim.uplisoft.com/compare",
        "https://esim.uplisoft.com/compare/airalo-vs-esim2you"
      ])
    );
    expect(all.every((entry) => entry.url.startsWith("https://esim.uplisoft.com"))).toBe(true);
    expect(all.every((entry) => entry.lastModified instanceof Date)).toBe(true);
    expect(all.some((entry) => entry.url.includes("/xloginy"))).toBe(false);
    expect(all.some((entry) => entry.url.includes("/bff/"))).toBe(false);
    expect(all.some((entry) => entry.url.includes("/destinations/usa"))).toBe(false);
    expect(all.some((entry) => entry.url.includes("/cheapest-esim"))).toBe(false);
  });

  it("301s legacy destination and guide URLs in next.config", () => {
    const config = readFileSync("next.config.mjs", "utf8");
    expect(config).toContain('source: "/destinations/:slug"');
    expect(config).toContain('destination: "/esim/:slug"');
    expect(config).toContain('source: "/guides/:slug"');
    expect(config).toContain('destination: "/travel/:slug"');
    expect(config).toContain("permanent: true");
  });

  it("does not publish cheapest-esim routes without a price-evidence rule", () => {
    expect(existsSync("src/app/cheapest-esim")).toBe(false);
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
    expect(middlewareSource).toContain("getPublicOrigin(request)");
    expect(middlewareSource).toContain('url.protocol = "https:"');
    expect(middlewareSource).toContain('url.pathname.replace(/\\/+$/, "")');
    expect(middlewareSource).toContain("NextResponse.redirect(url, 308)");
  });
});
