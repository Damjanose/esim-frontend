import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { landingContent } from "./landing";

describe("landingContent", () => {
  it("contains the core sections needed for a public eSIM landing page", () => {
    expect(landingContent.brand).toBe("Velocity eSIM");
    expect(landingContent.destinations).toHaveLength(5);
    expect(
      landingContent.destinations.every((destination) =>
        destination.imageUrl.startsWith("https://images.unsplash.com/")
      )
    ).toBe(true);
    expect(landingContent.steps).toHaveLength(3);
    expect(landingContent.faqs.length).toBeGreaterThanOrEqual(4);
    expect(landingContent.supportLinks.map((link) => link.label)).toEqual([
      "Support",
      "Contact",
      "Policy",
      "Terms"
    ]);
  });

  it("uses the real Android app listing and does not publish a placeholder iOS link", () => {
    expect(landingContent.appLinks).toEqual({
      android: {
        label: "Google Play",
        href: "https://play.google.com/store/apps/details?id=com.uplisoft.velocityesim"
      },
      ios: {
        label: "App Store",
        href: null
      }
    });
  });

  it("routes the primary download CTA to Google Play instead of an in-page placeholder", () => {
    const pageSource = readFileSync("src/app/page.tsx", "utf8");

    expect(pageSource).toContain("href={landingContent.appLinks.android.href}");
    expect(pageSource).not.toContain('href="#download"');
  });
});
