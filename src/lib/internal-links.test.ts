import { describe, expect, it } from "vitest";
import { destinationPages, guidePages, publicSeoPages, useCasePages } from "@/content/seo-pages";
import { destinationGuideLinks, relatedDestinationLinks, relatedGuideLinks } from "./internal-links";

/** Every in-content link a page renders, keyed by the page's path. */
function outlinks() {
  const links = new Map<string, string[]>();
  for (const page of destinationPages) {
    links.set(page.path, [
      ...relatedDestinationLinks(page.slug).map((link) => link.href),
      ...destinationGuideLinks(page).map((link) => link.href)
    ]);
  }
  for (const page of [...guidePages, ...useCasePages]) {
    links.set(page.path, relatedGuideLinks(page).map((link) => link.href));
  }
  return links;
}

function inboundTo(path: string) {
  return [...outlinks()].filter(([, hrefs]) => hrefs.includes(path)).map(([from]) => from);
}

describe("internal links between /esim and /travel pages", () => {
  it("links Croatia from the Europe hub and its neighbours", () => {
    expect(inboundTo("/esim/croatia")).toEqual(
      expect.arrayContaining(["/esim/europe", "/esim/italy", "/esim/austria", "/esim/albania", "/esim/balkans"])
    );
  });

  it("links the Europe buying guide from /esim/europe and European country pages", () => {
    expect(inboundTo("/travel/best-esim-europe-travel")).toEqual(
      expect.arrayContaining(["/esim/europe", "/esim/france", "/esim/croatia", "/esim/italy"])
    );
  });

  it("links the compatible-phones guide from the install guide and destination pages", () => {
    expect(inboundTo("/travel/esim-compatible-phones")).toEqual(
      expect.arrayContaining(["/travel/how-to-install-esim", "/esim/japan", "/esim/usa"])
    );
  });

  it("links the keep-your-number guide from more than its old two pages", () => {
    expect(inboundTo("/travel/keep-your-number-with-esim").length).toBeGreaterThanOrEqual(5);
  });

  it("gives every public SEO page in-content inbound links", () => {
    for (const page of publicSeoPages) {
      expect(inboundTo(page.path).length, page.path).toBeGreaterThanOrEqual(2);
    }
  });

  it("only links to real canonical pages, never to itself or twice", () => {
    const canonical = new Set(publicSeoPages.map((page) => page.path));
    for (const [from, hrefs] of outlinks()) {
      expect(hrefs, from).not.toContain(from);
      for (const href of hrefs) {
        expect(href.startsWith("/guides") || /^\/destinations\/./.test(href), href).toBe(false);
        if (href.startsWith("/esim/") || href.startsWith("/travel/")) {
          expect(canonical.has(href), `${from} -> ${href}`).toBe(true);
        }
      }
    }
    for (const page of destinationPages) {
      const hrefs = relatedDestinationLinks(page.slug).map((link) => link.href);
      expect(new Set(hrefs).size, page.path).toBe(hrefs.length);
    }
  });
});
