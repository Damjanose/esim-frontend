import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { RETIRED_COLOR_CLASS } from "./components/retiredTokens";

describe("LegalDocumentPage restyle (spec 8B: off the retired tokens)", () => {
  const source = readFileSync("src/app/LegalDocumentPage.tsx", "utf8");

  it("keeps its slim header, logo, title, date and sections", () => {
    expect(source).toContain('alt="eSIM2you app logo"');
    expect(source).toContain('src="/app-logo.png"');
    expect(source).toContain("{landingContent.brand}");
    expect(source).toContain("{document.title}");
    expect(source).toContain("Last updated: {document.lastUpdated}");
    expect(source).toContain("document.sections.map");
    expect(source).toContain("section.paragraphs.map");
    expect(source).toContain("<SiteFooter />");
  });

  it("is on the current tokens only (no midnight, line, cyan, cloud, ink, slate)", () => {
    expect(source).not.toMatch(RETIRED_COLOR_CLASS);
    expect(source).not.toContain("bg-white");
    expect(source).not.toContain("shadow-glow");
    expect(source).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  });

  it("reads as one column of sections in a card, with 44px header links", () => {
    expect(source).toContain('<main className="min-h-screen bg-surfaceBright text-onSurface">');
    expect(source).toContain("max-w-3xl");
    expect(source).toContain("first:border-t-0");
    expect(source.match(/min-h-11/g)?.length).toBeGreaterThanOrEqual(1);
    expect(source).toContain("CONTENT_TEXT_LINK");
  });
});
