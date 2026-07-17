import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { publicSeoPages } from "@/content/seo-pages";

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
    expect(publicChromeSources.join("\n")).toContain('alt="Velocity eSIM app logo"');
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
    expect(footerSource).toContain("Velocity eSIM support");
    expect(seoPagesSource).not.toContain('label: "All destinations"');
    expect(seoPagesSource).not.toContain('label: "What is an eSIM?"');
  });
});
