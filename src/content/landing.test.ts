import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { landingContent } from "./landing";

describe("landingContent", () => {
  it("contains the core sections needed for a public eSIM landing page", () => {
    expect(landingContent.brand).toBe("eSim2you");
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
        href: "https://apps.apple.com/app/id6768258284"
      }
    });
  });

  it("points both app store badges at their store listings", () => {
    const pageSource = readFileSync("src/app/page.tsx", "utf8");

    // The hero's store buttons keep the #download-app anchor.
    expect(pageSource).toContain('id="download-app"');
    // The store badge hrefs are literal URLs rather than landingContent.appLinks.*.href
    // references, so pin them against the single source of truth here instead —
    // catches drift if either side changes without the other.
    expect(pageSource).toContain(`href="${landingContent.appLinks.ios.href}"`);
    expect(pageSource).toContain(`href="${landingContent.appLinks.android.href}"`);
  });

  it("renders the homepage FAQ section from the same content used by schema", () => {
    const pageSource = readFileSync("src/app/page.tsx", "utf8");

    expect(pageSource).toContain('id="faq"');
    expect(pageSource).toContain("landingContent.faqs.map");
    expect(pageSource).toContain("faq.question");
    expect(pageSource).toContain("faq.answer");
  });

  it("uses descriptive alt text for homepage destination and flag images", () => {
    const pageSource = readFileSync("src/app/page.tsx", "utf8");
    const photoTileSource = readFileSync("src/app/destinations/PhotoTile.tsx", "utf8");
    const countryRowSource = readFileSync("src/app/destinations/CountryRow.tsx", "utf8");

    // The homepage no longer renders flags itself (the old phone mockups were replaced by
    // a screenshot); its remaining images must carry descriptive alt text.
    expect(pageSource).toContain(
      'alt="eSim2you app screens: destination list, United Kingdom plans and billing details"',
    );
    expect(pageSource).not.toMatch(/alt=""/);
    // Browse flags render inside PhotoTile (Trending, rails) and CountryRow (All destinations).
    expect(photoTileSource).toContain('alt={`${country} flag`}');
    expect(countryRowSource).toContain('alt={`${country} flag`}');
  });

  it("renders premium store buttons with platform icons", () => {
    const pageSource = readFileSync("src/app/page.tsx", "utf8");

    // Apple/Google logos are inlined as <svg> markup directly on each store link
    // rather than extracted into named icon components.
    // The accessible name must contain the visible text ("Download on the App Store",
    // "Get it on Google Play") for WCAG label-in-name / Lighthouse label-content-name-mismatch.
    expect(pageSource).toContain('aria-label="Download on the App Store, eSim2you"');
    expect(pageSource).toContain('aria-label="Get it on Google Play, eSim2you"');
    expect(pageSource).toMatch(/aria-label="Download on the App Store, eSim2you"[\s\S]*?<svg/);
    expect(pageSource).toMatch(/aria-label="Get it on Google Play, eSim2you"[\s\S]*?<svg/);
  });

  it("organizes footer links without duplicate footer download actions", () => {
    const pageSource = readFileSync("src/app/page.tsx", "utf8");
    const footerSource = readFileSync("src/app/SiteFooter.tsx", "utf8");

    expect(pageSource).toContain("<SiteFooter />");
    expect(footerSource).toContain('aria-label="Footer"');
    expect(footerSource).toContain("Company");
    expect(footerSource).toContain("Explore");
    expect(footerSource).toContain("Resources");
    expect(footerSource).not.toContain('aria-label="Download eSim2you from the footer on the App Store"');
    expect(footerSource).not.toContain('aria-label="Download eSim2you from the footer on Google Play"');
  });

  it("keeps footer resources styled like the other footer link columns and repeats the app name naturally", () => {
    const footerSource = readFileSync("src/app/SiteFooter.tsx", "utf8");

    expect(footerSource).toContain('<FooterLinkColumn title="Resources" links={footerResourceLinks} />');
    expect(footerSource).not.toContain("function FooterResourceLinks");
    expect(footerSource).not.toContain("rounded-lg border border-white/10 bg-white/5");
    // One brand sentence; the two filler lines were dropped to shorten the phone footer.
    expect(footerSource).toContain("eSim2you helps travelers");
    expect(footerSource).not.toContain("eSim2you travel data guides");
  });

  it("uses app logo assets for favicon, header, and footer branding", () => {
    // The header/nav bar was extracted out of page.tsx into its own component
    // (src/app/components/Navbar.tsx) — the real logo lives there now.
    const navSource = readFileSync("src/app/components/Navbar.tsx", "utf8");
    const footerSource = readFileSync("src/app/SiteFooter.tsx", "utf8");
    const layoutSource = readFileSync("src/app/layout.tsx", "utf8");

    expect(existsSync("src/app/icon.png")).toBe(true);
    expect(existsSync("public/favicon.png")).toBe(true);
    expect(existsSync("public/app-logo.png")).toBe(true);
    expect(existsSync("public/logo-icon.png")).toBe(true);
    // The navbar sits on both the colorful homepage hero and plain white content
    // pages, so it uses the transparent, colored icon mark (cropped from
    // logo-full.png) rather than logo-no-bg.png (which renders white-on-white,
    // effectively invisible, on every light page) or app-logo.png's solid square
    // (which the footer, on a plain white background, uses instead).
    expect(navSource).toContain('src="/logo-icon.png"');
    expect(footerSource).toContain('src="/app-logo.png"');
    // Globe2 is legitimately reused elsewhere (language selector, "Global Coverage"
    // benefit icons) now that the logo itself is a real image — only the brand-mark
    // link itself must never fall back to an icon instead of the logo image.
    const homeLinkMatch = navSource.match(/<a[^>]*aria-label="eSim2you home"[\s\S]*?<\/a>/);
    expect(homeLinkMatch).not.toBeNull();
    expect(homeLinkMatch![0]).not.toContain("Globe2");
    expect(homeLinkMatch![0]).toContain("<Image");
    expect(layoutSource).toContain('url: "/favicon.png"');
  });
});
