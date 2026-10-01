import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { RETIRED_COLOR_CLASS } from "./components/retiredTokens";

const hubs = [
  { file: "src/app/travel/page.tsx", h1: "Travel eSIM guides", cta: "Read guide", crumb: 'breadcrumbName: "Travel"' },
  { file: "src/app/use-cases/page.tsx", h1: "eSIM use cases", cta: "Read more", crumb: 'breadcrumbName: "Use cases"' },
  { file: "src/app/compare/page.tsx", h1: "Compare travel eSIMs", cta: "Read comparison", crumb: 'breadcrumbName: "Compare"' }
];

describe("content hubs restyle (spec 8B)", () => {
  for (const hub of hubs) {
    it(`${hub.file}: same H1, JSON-LD and links, as whole-card links on the new tokens`, () => {
      const source = readFileSync(hub.file, "utf8");

      expect(source).toContain(hub.h1);
      expect(source).toContain(hub.cta);
      expect(source).toContain(hub.crumb);
      expect(source).toContain("<Navbar />");
      expect(source).toContain("<SiteFooter />");
      expect(source).toContain("href={page.path}");
      expect(source).toContain("className={CONTENT_CARD_LINK}");
      expect(source).toContain('<main className="min-h-screen overflow-x-clip bg-surfaceBright');
      expect(source).toContain("CONTENT_TOP");
      expect(source).not.toMatch(RETIRED_COLOR_CLASS);
      expect(source).not.toContain("bg-white");
    });
  }
});

describe("/compare/[slug] restyle (spec 8B)", () => {
  const source = readFileSync("src/app/compare/[slug]/page.tsx", "utf8");

  it("keeps the Article JSON-LD, breadcrumb, table semantics and links", () => {
    expect(source).toContain('parent: { name: "Compare", path: "/compare" },');
    expect(source).toContain("article: { dateModified: seoContentUpdatedAt }");
    expect(source).toContain('aria-label="Breadcrumb"');
    expect(source).toContain('scope="col"');
    expect(source).toContain('scope="row"');
    expect(source).toContain("Browse eSIM2you destinations");
    expect(source).toContain('href="/destinations"');
  });

  it("gives breadcrumb and text links 44px targets and reuses the shared FAQ", () => {
    expect(source.match(/inline-flex min-h-11 items-center/g)?.length).toBeGreaterThanOrEqual(2);
    expect(source).toContain("className={CONTENT_TEXT_LINK}");
    expect(source).toContain("<ContentFaq faqs={page.faqs} />");
  });

  it("scrolls a wide table inside its own positioned box (f195) on the new tokens", () => {
    expect(source).toContain("relative overflow-x-auto rounded-[20px]");
    expect(source).toContain('<main className="min-h-screen overflow-x-clip bg-surface');
    expect(source).not.toMatch(RETIRED_COLOR_CLASS);
    expect(source).not.toContain("bg-white");
  });
});
