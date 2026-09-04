import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("public navigation shell", () => {
  it("uses route-safe navbar links that work away from the homepage", () => {
    const navbar = readFileSync("src/app/components/Navbar.tsx", "utf8");

    expect(navbar).toContain('href="/"');
    expect(navbar).toContain('href="/#download-app"');
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
});
