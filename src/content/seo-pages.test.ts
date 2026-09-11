import { describe, expect, it } from "vitest";
import {
  destinationPages,
  guidePages,
  publicSeoPages,
  seoPageByPath,
  useCasePages
} from "./seo-pages";
import { landingContent } from "./landing";

const approvedExternalLinks = new Set([
  landingContent.appLinks.ios.href,
  landingContent.appLinks.android.href,
  null
]);

describe("SEO content pages", () => {
  it("defines the first global English destination, guide, and use-case pages", () => {
    expect(destinationPages.map((page) => page.path)).toEqual([
      "/esim/usa",
      "/esim/europe",
      "/esim/japan",
      "/esim/turkey",
      "/esim/france",
      "/esim/uk",
      "/esim/germany",
      "/esim/italy",
      "/esim/spain",
      "/esim/greece",
      "/esim/portugal",
      "/esim/switzerland",
      "/esim/thailand",
      "/esim/uae",
      "/esim/mexico",
      "/esim/canada",
      "/esim/australia",
      "/esim/indonesia",
      "/esim/albania",
      "/esim/asia",
      "/esim/north-america"
    ]);
    expect(guidePages.map((page) => page.path)).toEqual([
      "/travel/what-is-an-esim",
      "/travel/esim-vs-roaming",
      "/travel/how-to-install-esim",
      "/travel/internet-abroad",
      "/travel/esim-vs-local-sim"
    ]);
    expect(useCasePages.map((page) => page.path)).toEqual([
      "/use-cases/business-travel",
      "/use-cases/remote-work"
    ]);
  });

  it("keeps public SEO page paths unique and copy complete", () => {
    const paths = publicSeoPages.map((page) => page.path);

    expect(new Set(paths).size).toBe(paths.length);
    expect(paths).toHaveLength(28);

    for (const page of publicSeoPages) {
      expect(page.title.trim().length).toBeGreaterThan(20);
      expect(page.description.trim().length).toBeGreaterThan(50);
      expect(page.heading.trim().length).toBeGreaterThan(10);
      expect(page.intro.trim().length).toBeGreaterThan(80);
      expect(page.sections.length).toBeGreaterThanOrEqual(2);
      expect(page.faqs.length).toBeGreaterThanOrEqual(2);
      expect(seoPageByPath[page.path]).toBe(page);
    }
  });

  it("only links to known public pages, anchors, or approved app-store URLs", () => {
    const knownInternalPaths = new Set([
      "/",
      "/destinations",
      "/travel",
      "/use-cases",
      "/compare",
      "/policy",
      "/terms",
      ...publicSeoPages.map((page) => page.path)
    ]);

    for (const page of publicSeoPages) {
      for (const link of page.relatedLinks) {
        const isAnchor = link.href.startsWith("#");
        const isKnownInternal = knownInternalPaths.has(link.href);
        const isApprovedExternal = approvedExternalLinks.has(link.href);

        expect(
          isAnchor || isKnownInternal || isApprovedExternal,
          `${page.path} has unexpected related link ${link.href}`
        ).toBe(true);
      }
    }
  });
});
