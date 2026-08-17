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
      "/destinations/usa",
      "/destinations/europe",
      "/destinations/japan",
      "/destinations/turkey",
      "/destinations/france",
      "/destinations/uk",
      "/destinations/germany",
      "/destinations/italy",
      "/destinations/spain",
      "/destinations/greece",
      "/destinations/portugal",
      "/destinations/switzerland",
      "/destinations/thailand",
      "/destinations/uae",
      "/destinations/mexico",
      "/destinations/canada",
      "/destinations/australia",
      "/destinations/indonesia"
    ]);
    expect(guidePages.map((page) => page.path)).toEqual([
      "/guides/what-is-an-esim",
      "/guides/esim-vs-roaming",
      "/guides/how-to-install-esim",
      "/guides/internet-abroad",
      "/guides/esim-vs-local-sim"
    ]);
    expect(useCasePages.map((page) => page.path)).toEqual([
      "/use-cases/business-travel",
      "/use-cases/remote-work"
    ]);
  });

  it("keeps public SEO page paths unique and copy complete", () => {
    const paths = publicSeoPages.map((page) => page.path);

    expect(new Set(paths).size).toBe(paths.length);
    expect(paths).toHaveLength(25);

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
