import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("public navigation shell", () => {
  it("uses route-safe navbar links that work away from the homepage", () => {
    const navbar = readFileSync("src/app/components/Navbar.tsx", "utf8");

    expect(navbar).toContain('href="/"');
    // /destinations repeats the homepage catalog, so it isn't a navbar link.
    expect(navbar).not.toContain('href: "/destinations"');
    expect(navbar).not.toContain('href="#"');
    expect(navbar).not.toContain('href="#download-app"');
    // Only real pages: no links that just scroll the homepage.
    expect(navbar).not.toMatch(/href: "\/#/);
    for (const href of ["/trip-plan", "/flights", "/travel", "/compare", "/use-cases", "/support"]) {
      expect(navbar).toContain(`href: "${href}"`);
    }
  });

  it("uses footer links that resolve from every route", () => {
    const footer = readFileSync("src/app/SiteFooter.tsx", "utf8");

    expect(footer).toContain('href: "/support"');
    expect(footer).toContain('href: "/policy"');
    expect(footer).toContain('href: "/terms"');
    expect(footer).not.toContain('href: "#faq"');
  });

  it("renders the shared navbar and footer on destination browsing screens", () => {
    const destinations = readFileSync("src/app/destinations/page.tsx", "utf8");
    const destinationPlans = readFileSync(
      "src/app/destinations/DestinationPlans.tsx",
      "utf8",
    );

    expect(destinations).toContain('import { Navbar } from "../components/Navbar"');
    expect(destinations).toContain('import { SiteFooter } from "../SiteFooter"');
    expect(destinations).toContain("<Navbar />");
    expect(destinations).toContain("<SiteFooter />");
    expect(destinationPlans).toContain('import { SiteFooter } from "../SiteFooter"');
    expect(destinationPlans).toContain("<Navbar />");
    expect(destinationPlans).toContain("<SiteFooter />");
  });

  it("shows the brand gradient banner while the destination photo loads", () => {
    const destinationPlans = readFileSync(
      "src/app/destinations/DestinationPlans.tsx",
      "utf8",
    );
    const banner = readFileSync("src/app/components/CountryBanner.tsx", "utf8");

    // The hex-coloured scanning loader is gone: CountryBanner's token gradient is the placeholder.
    expect(destinationPlans).toContain("<CountryBanner");
    expect(destinationPlans).toContain("Loading destination image");
    expect(destinationPlans).not.toContain("DestinationHeroImageLoader");
    expect(destinationPlans).not.toContain("destination-loader-scan");
    expect(banner).toContain("bg-gradient-to-br from-brandBlue via-[#0E86C0] to-brandTeal");
  });

  it("renders the shared navbar and footer on support and SEO content pages", () => {
    const support = readFileSync("src/app/support/SupportPageClient.tsx", "utf8");
    const seoContent = readFileSync("src/app/SeoContentPage.tsx", "utf8");

    expect(support).toContain('import { SiteFooter } from "../SiteFooter"');
    expect(support).toContain("<Navbar />");
    expect(support).toContain("<SiteFooter />");
    expect(seoContent).toContain('import { Navbar } from "./components/Navbar"');
    expect(seoContent).toContain("<Navbar />");
    expect(seoContent).toContain("<SiteFooter />");
  });

  it("keeps legal pages on shared footer chrome instead of duplicating footer markup", () => {
    const legalPage = readFileSync("src/app/LegalDocumentPage.tsx", "utf8");

    expect(legalPage).toContain('import { SiteFooter } from "./SiteFooter"');
    expect(legalPage).toContain("<SiteFooter />");
    expect(legalPage).not.toContain("<footer");
  });

  it("shows the profile icon when signed in and a Sign in link otherwise", () => {
    const navbar = readFileSync("src/app/components/Navbar.tsx", "utf8");
    const account = readFileSync("src/app/components/NavbarAccount.tsx", "utf8");

    expect(navbar).toContain("<NavbarAccount />");
    expect(navbar).not.toContain('href="/account"');
    expect(account).toContain('fetch("/bff/auth/status"');
    expect(account).toContain('href="/profile"');
    expect(account).toContain("UserRound");
    expect(account).toContain('href="/signin"');
    expect(navbar).not.toContain("Showroom mode");
  });

  it("keeps primary purchase navigation available on mobile", () => {
    const navbar = readFileSync("src/app/components/Navbar.tsx", "utf8");
    const mobileMenu = readFileSync("src/app/components/MobileNavbarMenu.tsx", "utf8");

    expect(navbar).toContain("MobileNavbarMenu");
    expect(navbar).toContain("<BottomDock />");
    expect(mobileMenu).toContain('aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}');
    expect(mobileMenu).toContain("lg:hidden");
    expect(mobileMenu).toContain("Browse eSIM plans");
  });

  it("keeps one fixed capsule navbar whose tone follows the page, not a theme prop", () => {
    const navbar = readFileSync("src/app/components/Navbar.tsx", "utf8");
    const tone = readFileSync("src/app/components/NavbarTone.tsx", "utf8");
    const home = readFileSync("src/app/page.tsx", "utf8");

    expect(navbar).toContain("rounded-full");
    expect(navbar).toContain("backdrop-blur-md");
    // Dark glass over the homepage's dark hero, light glass elsewhere, decided
    // by NavbarTone from the page itself, never by a prop.
    expect(navbar).not.toContain('theme?: "light" | "dark"');
    expect(home).not.toContain('<Navbar theme="dark" />');
    expect(navbar).toContain("group-data-[tone=dark]:bg-brandInk/55");
    expect(tone).toContain('className="group fixed inset-x-0 top-0 z-50');
    expect(tone).toContain("data-tone={tone}");
    expect(home).toContain('data-nav-dark=""');
    // The dock must sit outside the blurred capsule: backdrop-filter creates a
    // containing block that would pin a position:fixed child to the header.
    expect(navbar.indexOf("<BottomDock />")).toBeGreaterThan(navbar.indexOf("</NavbarTone>"));
  });

  it("renders the app-style bottom dock on phones and tablets only", () => {
    const dock = readFileSync("src/app/components/BottomDock.tsx", "utf8");

    expect(dock).toContain('"use client"');
    expect(dock).toContain("isDockVisible(pathname)");
    expect(dock).toContain("activeDockItem(pathname)");
    expect(dock).toContain("lg:hidden");
    expect(dock).toContain("data-bottom-dock");
    expect(dock).toContain("whitespace-nowrap");
    expect(dock).toContain('aria-current={isActive ? "page" : undefined}');
    // Static links only: the dock renders on statically generated pages (f022).
    expect(dock).not.toContain("cookies");
    expect(dock).not.toContain("esim_at");
  });

  it("uses the quiet light footer and clears the phone dock", () => {
    const footer = readFileSync("src/app/SiteFooter.tsx", "utf8");
    const css = readFileSync("src/app/globals.css", "utf8");

    expect(footer).toContain("bg-surfaceBright");
    // Phones: stacked groups with wrapping inline links; sm+: three columns.
    expect(footer).toContain("sm:grid-cols-3");
    expect(footer).toContain("flex flex-wrap gap-x-4 gap-y-2 sm:mt-4 sm:grid sm:gap-3");
    expect(css).toContain("body:has([data-bottom-dock]) footer[aria-label=\"Footer\"]");
  });
});
