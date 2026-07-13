import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
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

  it("uses the live Android and iOS app listings", () => {
    expect(landingContent.appLinks).toEqual({
      android: {
        label: "Google Play",
        href: "https://play.google.com/store/apps/details?id=com.uplisoft.velocityesim"
      },
      ios: {
        label: "App Store",
        href: "https://apps.apple.com/am/app/velocityesim/id6768258284"
      }
    });
  });

  it("routes the header CTA to the download section and both app CTAs to their store listings", () => {
    const pageSource = readFileSync("src/app/page.tsx", "utf8");

    expect(pageSource).toContain('href="#download"');
    expect(pageSource).toContain("href={landingContent.appLinks.ios.href}");
    expect(pageSource).toContain("href={landingContent.appLinks.android.href}");
  });

  it("renders premium store buttons with platform icons", () => {
    const pageSource = readFileSync("src/app/page.tsx", "utf8");

    expect(pageSource).toContain("function AppleStoreIcon");
    expect(pageSource).toContain("function GooglePlayIcon");
    expect(pageSource).toContain("<AppleStoreIcon />");
    expect(pageSource).toContain("<GooglePlayIcon />");
    expect(pageSource).toContain('aria-label="Download Velocity eSIM on the App Store"');
    expect(pageSource).toContain('aria-label="Download Velocity eSIM on Google Play"');
  });

  it("organizes footer links without duplicate footer download actions", () => {
    const pageSource = readFileSync("src/app/page.tsx", "utf8");
    const footerSource = readFileSync("src/app/SiteFooter.tsx", "utf8");

    expect(pageSource).toContain("<SiteFooter />");
    expect(footerSource).toContain('aria-label="Footer"');
    expect(footerSource).toContain("Company");
    expect(footerSource).toContain("Explore");
    expect(footerSource).toContain("Resources");
    expect(footerSource).not.toContain('aria-label="Download Velocity eSIM from the footer on the App Store"');
    expect(footerSource).not.toContain('aria-label="Download Velocity eSIM from the footer on Google Play"');
  });

  it("keeps footer resources styled like the other footer link columns and repeats the app name naturally", () => {
    const footerSource = readFileSync("src/app/SiteFooter.tsx", "utf8");

    expect(footerSource).toContain('<FooterLinkColumn title="Resources" links={footerResourceLinks} />');
    expect(footerSource).not.toContain("function FooterResourceLinks");
    expect(footerSource).not.toContain("rounded-lg border border-white/10 bg-white/5");
    expect(footerSource).toContain("Velocity eSIM travel data guides");
    expect(footerSource).toContain("Velocity eSIM helps travelers");
    expect(footerSource).toContain("Velocity eSIM destination coverage");
  });

  it("uses app logo assets for favicon, header, and footer branding", () => {
    const pageSource = readFileSync("src/app/page.tsx", "utf8");
    const footerSource = readFileSync("src/app/SiteFooter.tsx", "utf8");
    const layoutSource = readFileSync("src/app/layout.tsx", "utf8");

    expect(existsSync("src/app/icon.png")).toBe(true);
    expect(existsSync("public/favicon.png")).toBe(true);
    expect(existsSync("public/app-logo.png")).toBe(true);
    expect(pageSource).toContain('src="/app-logo.png"');
    expect(footerSource).toContain('src="/app-logo.png"');
    expect(pageSource).not.toContain("Globe2");
    expect(layoutSource).toContain('url: "/favicon.png"');
  });
});
