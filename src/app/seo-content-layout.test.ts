import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { RETIRED_COLOR_CLASS } from "./components/retiredTokens";

describe("SeoContentPage restyle (spec 8B: same structure, new styling)", () => {
  const source = readFileSync("src/app/SeoContentPage.tsx", "utf8");

  it("keeps the JSON-LD call exactly as before (Article on guides, f196)", () => {
    expect(source).toContain(
      [
        "        data={createContentPageJsonLd({",
        "          path: page.path,",
        "          name: page.heading,",
        "          description: page.description,",
        "          breadcrumbName: page.heading,",
        "          parent,",
        "          faqs: page.faqs,",
        "          offer,",
        "          article: asArticle ? { dateModified: updatedAt } : undefined",
        "        })}"
      ].join("\n")
    );
  });

  it("keeps both app CTAs with the Play button as the page's one gradient", () => {
    expect(source.match(/<LinkButton/g)).toHaveLength(2);
    expect(source.match(/variant="tint"/g)).toHaveLength(1);
    expect(source).toContain('aria-label="Download eSIM2you on the App Store"');
    expect(source).toContain('aria-label="Download eSIM2you on Google Play"');
  });

  it("uses the shared content cards, a Related sidebar that stacks on phones, and the shared FAQ", () => {
    expect(source).toContain('from "./components/contentClasses"');
    expect(source).toContain('<main className="min-h-screen overflow-x-clip bg-surface');
    expect(source).toContain("lg:grid-cols-[minmax(0,1fr)_280px]");
    expect(source).toContain("lg:items-start");
    expect(source).toContain("<aside className={`h-fit ${CONTENT_ASIDE}`}>");
    expect(source).toContain("className={CONTENT_ROW_LINK}");
    expect(source).toContain("<ContentFaq faqs={page.faqs} />");
    expect(source).toContain("Related pages");
    expect(source).toContain("Quick answers before you travel.");
  });

  it("gives the back link a 44px target and drops the retired palette", () => {
    expect(source).toContain("CONTENT_TEXT_LINK");
    expect(source).toContain("{parent.name}");
    expect(source).not.toMatch(RETIRED_COLOR_CLASS);
    expect(source).not.toContain("bg-white");
    expect(source).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  });
});
