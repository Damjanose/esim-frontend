import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("public navigation shell", () => {
  it("uses route-safe navbar links that work away from the homepage", () => {
    const navbar = readFileSync("src/app/components/Navbar.tsx", "utf8");

    expect(navbar).toContain('href="/"');
    expect(navbar).toContain('href="/destinations"');
    expect(navbar).toContain('href: "/destinations"');
    expect(navbar).not.toContain('href="#"');
    expect(navbar).not.toContain('href="#download-app"');
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

  it("uses a branded loader while destination hero images load", () => {
    const destinationPlans = readFileSync(
      "src/app/destinations/DestinationPlans.tsx",
      "utf8",
    );

    expect(destinationPlans).toContain("function DestinationHeroImageLoader");
    expect(destinationPlans).toContain("Loading destination image");
    expect(destinationPlans).toContain("animate-[destination-loader-scan_2.8s_ease-in-out_infinite]");
    expect(destinationPlans).not.toContain("h-full w-full animate-pulse bg-[linear-gradient(135deg,#09213d,#031024)]");
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

  it("links to the account entry point, letting the route guard handle signed-in vs signed-out", () => {
    const navbar = readFileSync("src/app/components/Navbar.tsx", "utf8");

    expect(navbar).toContain('href="/profile"');
    expect(navbar).toContain("UserRound");
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

  it("uses one capsule navbar style on every page instead of a dark/light theme switch", () => {
    const navbar = readFileSync("src/app/components/Navbar.tsx", "utf8");
    const home = readFileSync("src/app/page.tsx", "utf8");

    expect(navbar).toContain("rounded-full");
    expect(navbar).toContain("backdrop-blur-md");
    expect(navbar).not.toContain('theme?: "light" | "dark"');
    expect(home).not.toContain('<Navbar theme="dark" />');
    // The dock must sit outside the blurred capsule: backdrop-filter creates a
    // containing block that would pin a position:fixed child to the header.
    expect(navbar.indexOf("<BottomDock />")).toBeGreaterThan(navbar.indexOf("</header>"));
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
});
