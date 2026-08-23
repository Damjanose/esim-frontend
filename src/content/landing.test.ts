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
        href: "https://apps.apple.com/am/app/velocityesim/id6768258284"
      }
    });
  });

  it("routes the header CTA to the download section and both app CTAs to their store listings", () => {
    const pageSource = readFileSync("src/app/page.tsx", "utf8");

    // Both the hero and bottom CTAs jump to the App Download section (#download-app),
    // which is where the store badges below actually live.
    expect(pageSource).toContain('href="#download-app"');
    // The store badge hrefs are literal URLs rather than landingContent.appLinks.*.href
    // references, so pin them against the single source of truth here instead —
    // catches drift if either side changes without the other.
    expect(pageSource).toContain(`href="${landingContent.appLinks.ios.href}"`);
    expect(pageSource).toContain(`href="${landingContent.appLinks.android.href}"`);
  });

  it("renders premium store buttons with platform icons", () => {
    const pageSource = readFileSync("src/app/page.tsx", "utf8");

    // Apple/Google logos are inlined as <svg> markup directly on each store link
    // rather than extracted into named icon components.
    expect(pageSource).toContain('aria-label="Download eSim2you on the App Store"');
    expect(pageSource).toContain('aria-label="Get eSim2you on Google Play"');
    expect(pageSource).toMatch(/aria-label="Download eSim2you on the App Store"[\s\S]*?<svg/);
    expect(pageSource).toMatch(/aria-label="Get eSim2you on Google Play"[\s\S]*?<svg/);
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
    expect(footerSource).toContain("eSim2you travel data guides");
    expect(footerSource).toContain("eSim2you helps travelers");
    expect(footerSource).toContain("eSim2you destination coverage");
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
    expect(existsSync("public/logo-no-bg.png")).toBe(true);
    // Navbar renders transparently over the hero image, so it deliberately uses the
    // no-background mark rather than app-logo.png's solid square (which the footer,
    // on a plain white background, uses instead).
    expect(navSource).toContain('src="/logo-no-bg.png"');
    expect(footerSource).toContain('src="/app-logo.png"');
    // Globe2 is legitimately reused elsewhere (language selector, "Global Coverage"
    // benefit icons) now that the logo itself is a real image — only the brand-mark
    // link itself must never fall back to an icon instead of the logo image.
    const homeLinkMatch = navSource.match(/<a[^>]*aria-label="eSim2you home"[\s\S]*?<\/a>/);
    expect(homeLinkMatch).not.toBeNull();
    expect(homeLinkMatch![0]).not.toContain("Globe2");
    expect(homeLinkMatch![0]).toContain("<img");
    expect(layoutSource).toContain('url: "/favicon.png"');
  });
});
