import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { publicSeoPages } from "@/content/seo-pages";
import { allSitemapEntries } from "@/lib/sitemaps";

const stopWords = new Set([
  "and",
  "before",
  "for",
  "the",
  "with",
  "without",
  "your"
]);

function words(value: string) {
  return value
    .toLowerCase()
    .match(/[a-z0-9]+/g)!
    .filter((word) => word.length > 2 && !stopWords.has(word));
}

describe("SEO external factors", () => {
  it("does not expose the framework powered-by header", () => {
    const configSource = readFileSync("next.config.mjs", "utf8");

    expect(configSource).toContain("poweredByHeader: false");
  });

  it("uses descriptive alt text for public raster images", () => {
    const publicChromeSources = [
      readFileSync("src/app/components/Navbar.tsx", "utf8"),
      readFileSync("src/app/SiteFooter.tsx", "utf8"),
      readFileSync("src/app/LegalDocumentPage.tsx", "utf8"),
      readFileSync("src/app/page.tsx", "utf8")
    ];

    for (const source of publicChromeSources) {
      expect(source).not.toContain('alt=""');
    }
    expect(publicChromeSources.join("\n")).toContain('alt="eSim2you app logo"');
  });

  it("supports H1 terms in non-heading SEO page copy", () => {
    for (const page of publicSeoPages) {
      const bodyCopy = [
        page.intro,
        ...page.sections.map((section) => `${section.title} ${section.body}`),
        ...page.faqs.map((faq) => `${faq.question} ${faq.answer}`)
      ].join(" ");
      const bodyWords = new Set(words(bodyCopy));
      const missingWords = [...new Set(words(page.heading))].filter(
        (word) => !bodyWords.has(word)
      );

      expect(missingWords, `${page.path} is missing H1 words`).toEqual([]);
    }
  });

  it("uses specific footer and related-page anchor text", () => {
    const footerSource = readFileSync("src/app/SiteFooter.tsx", "utf8");
    const seoPagesSource = readFileSync("src/content/seo-pages.ts", "utf8");

    expect(footerSource).toContain("Browse all eSIM destinations");
    expect(footerSource).toContain("eSim2you support");
    expect(footerSource).toContain("Business travel eSIM guide");
    expect(footerSource).toContain("Remote work eSIM guide");
    expect(footerSource).toContain("Cruise port-day eSIM guide");
    expect(footerSource).toContain("Study abroad eSIM guide");
    expect(footerSource).toContain("How much travel data do you need");
    expect(footerSource).toContain("Travel data and Wi-Fi planning");
    expect(footerSource).toContain("Keep your number with a travel eSIM");
    expect(seoPagesSource).not.toContain('label: "All destinations"');
    expect(seoPagesSource).not.toContain('label: "What is an eSIM?"');
  });

  it("keeps the AI content map on canonical travel and destination URLs", () => {
    const llms = readFileSync("public/llms.txt", "utf8");

    expect(llms).toContain("https://esim.uplisoft.com/esim/usa");
    expect(llms).toContain("https://esim.uplisoft.com/travel/what-is-an-esim");
    expect(llms).toContain("esim2you@uplisoft.com");
    expect(llms).not.toContain("/guides/");
    expect(llms).not.toContain("esim@uplisoft.com");

    // Every page linked from llms.txt must be a real, indexable sitemap URL.
    const sitemapUrls = new Set(allSitemapEntries().map((entry) => entry.url.replace(/\/$/, "")));
    const linked = [...llms.matchAll(/https:\/\/esim\.uplisoft\.com\/[^\s)]+/g)]
      .map((match) => match[0].replace(/\/$/, ""))
      .filter((url) => !/\.(txt|xml)$/.test(url));
    expect(linked.filter((url) => !sitemapUrls.has(url))).toEqual([]);
  });

  it("links the homepage server HTML to the top /esim money pages", () => {
    const home = readFileSync("src/app/page.tsx", "utf8");
    const block = readFileSync("src/app/TopDestinationLinks.tsx", "utf8");
    const esimPaths = new Set(allSitemapEntries().map((entry) => new URL(entry.url).pathname));

    expect(home).toContain("<TopDestinationLinks />");
    expect(block).not.toContain('"use client"');
    for (const slug of ["usa", "uk", "europe"]) {
      expect(block).toContain(`"${slug}"`);
      expect(esimPaths.has(`/esim/${slug}`)).toBe(true);
    }
  });
});
