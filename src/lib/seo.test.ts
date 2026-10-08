import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  brandedTitle,
  createContentPageJsonLd,
  createLandingJsonLd,
  createMetadata,
  createOfferProductJsonLd,
  createWebPageJsonLd,
  indexableRoutes,
  privateRoutePrefixes,
  siteUrl
} from "./seo";

describe("SEO route contract", () => {
  it("uses the eSIM subdomain as the only canonical host", () => {
    expect(siteUrl).toBe("https://esim.uplisoft.com");

    for (const route of indexableRoutes) {
      expect(route.url).toMatch(/^https:\/\/esim\.uplisoft\.com(\/|$)/);
      expect(route.url).not.toContain("https://uplisoft.com");
      expect(route.url).not.toContain("www.");
    }
  });

  it("keeps private, admin, and API-only routes out of the sitemap source", () => {
    const paths = indexableRoutes.map((route) => route.path);

    expect(paths).toContain("/");
    expect(paths).toContain("/destinations");
    expect(paths).toContain("/esim/usa");
    expect(paths).toContain("/esim/albania");
    expect(paths).toContain("/esim/asia");
    expect(paths).toContain("/esim/north-america");
    expect(paths).toContain("/travel");
    expect(paths).toContain("/travel/how-to-install-esim");
    expect(paths).toContain("/use-cases");
    expect(paths).toContain("/compare");
    expect(paths).toContain("/compare/airalo-vs-esim2you");
    expect(paths).not.toContain("/destinations/usa");
    expect(paths).not.toContain("/guides/how-to-install-esim");
    expect(paths.some((path) => path.startsWith("/cheapest-esim"))).toBe(false);

    for (const prefix of privateRoutePrefixes) {
      expect(paths.some((path) => path === prefix || path.startsWith(`${prefix}/`))).toBe(false);
    }

    expect(privateRoutePrefixes).toEqual([
      "/api",
      "/admin",
      "/account",
      "/auth",
      "/bff",
      "/billing",
      "/checkout",
      "/dashboard",
      "/profile",
      "/signin",
      "/xactivityy",
      "/xerrors",
      "/xloginy",
      "/xnotificationy",
      "/xpartnersy",
      "/xpricing",
      "/xstreaky",
      "/xsupport",
      "/xtestimonialsy",
      "/xtripplany",
      "/xversion"
    ]);
  });

  it("builds route metadata with canonical, open graph, twitter, and index directives", () => {
    const metadata = createMetadata({
      path: "/policy",
      title: "Privacy Policy | eSIM2you",
      description: "Privacy Policy for eSIM2you travelers and app users."
    });

    expect(metadata.alternates).toEqual({
      canonical: "https://esim.uplisoft.com/policy"
    });
    expect(metadata.openGraph).toMatchObject({
      title: "Privacy Policy | eSIM2you",
      description: "Privacy Policy for eSIM2you travelers and app users.",
      url: "https://esim.uplisoft.com/policy",
      siteName: "eSIM2you",
      type: "website"
    });
    expect(metadata.twitter).toMatchObject({
      card: "summary_large_image",
      title: "Privacy Policy | eSIM2you",
      description: "Privacy Policy for eSIM2you travelers and app users."
    });
    expect(metadata.robots).toEqual({ index: true, follow: true });
  });

  it("marks hidden app/admin pages as noindex and noarchive", () => {
    const metadata = createMetadata({
      path: "/xloginy",
      title: "Admin | eSIM2you",
      description: "Private eSIM2you admin surface.",
      indexable: false
    });

    expect(metadata.robots).toEqual({
      index: false,
      follow: false,
      nocache: true,
      googleBot: {
        index: false,
        follow: false,
        noimageindex: true
      }
    });
  });

  it("creates schema only from visible public page content", () => {
    const schema = createWebPageJsonLd({
      path: "/terms",
      name: "Terms of Service",
      description: "Terms of Service for eSIM2you travelers and app users.",
      breadcrumbName: "Terms"
    });

    expect(schema["@graph"]).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          "@type": "WebPage",
          "@id": "https://esim.uplisoft.com/terms#webpage",
          url: "https://esim.uplisoft.com/terms",
          name: "Terms of Service"
        }),
        expect.objectContaining({
          "@type": "BreadcrumbList",
          itemListElement: [
            expect.objectContaining({
              position: 1,
              name: "Home",
              item: "https://esim.uplisoft.com/"
            }),
            expect.objectContaining({
              position: 2,
              name: "Terms",
              item: "https://esim.uplisoft.com/terms"
            })
          ]
        })
      ])
    );
  });

  it("adds the live Android and iOS app links to SoftwareApplication schema", () => {
    const schema = createLandingJsonLd();
    const softwareApplication = schema["@graph"].find(
      (entry) => entry["@type"] === "SoftwareApplication"
    );

    expect(softwareApplication).toMatchObject({
      "@type": "SoftwareApplication",
      operatingSystem: "iOS, Android",
      downloadUrl: "https://apps.apple.com/app/id6768258284",
      sameAs: [
        "https://apps.apple.com/app/id6768258284",
        "https://play.google.com/store/apps/details?id=com.uplisoft.velocityesim"
      ]
    });
    expect(JSON.stringify(softwareApplication)).not.toContain("null");
    // Only verified third-party ratings (src/content/reviews.ts) may become
    // review markup; on-site testimonials stay visible-only.
    expect(softwareApplication).not.toHaveProperty("review");
    expect(softwareApplication).not.toHaveProperty("aggregateRating");
  });

  it("names the brand spellings and app listings on Organization and WebSite schema", () => {
    const graph = createLandingJsonLd()["@graph"];
    const organization = graph.find((entry) => entry["@type"] === "Organization");
    const website = graph.find((entry) => entry["@type"] === "WebSite");

    // Without alternateName, a search for "esim2you" is corrected toward eSIM2Me.
    expect(website).toMatchObject({ alternateName: expect.arrayContaining(["esim2you"]) });
    expect(organization).toMatchObject({
      name: "eSIM2you",
      alternateName: ["esim2you"],
      sameAs: expect.arrayContaining([
        "https://www.instagram.com/esim2you",
        "https://apps.apple.com/app/id6768258284",
        "https://play.google.com/store/apps/details?id=com.uplisoft.velocityesim"
      ])
    });
  });

  it("does not turn homepage testimonials into review schema", () => {
    const home = readFileSync("src/app/page.tsx", "utf8");
    expect(home).toContain("<JsonLd data={createLandingJsonLd()} />");
  });

  it("creates content page schema with breadcrumbs and visible FAQ answers", () => {
    const schema = createContentPageJsonLd({
      path: "/travel/what-is-an-esim",
      name: "What Is an eSIM?",
      description:
        "A simple guide to what an eSIM is, how travel eSIM data works, and when to install one before an international trip.",
      breadcrumbName: "What Is an eSIM?",
      parent: {
        name: "Travel guides",
        path: "/travel"
      },
      faqs: [
        {
          question: "Does an eSIM replace my phone number?",
          answer:
            "No. A travel eSIM can provide mobile data while your usual SIM remains available for calls, texts, and WhatsApp."
        }
      ]
    });

    expect(schema["@graph"]).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          "@type": "WebPage",
          "@id": "https://esim.uplisoft.com/travel/what-is-an-esim#webpage",
          url: "https://esim.uplisoft.com/travel/what-is-an-esim",
          name: "What Is an eSIM?"
        }),
        expect.objectContaining({
          "@type": "BreadcrumbList",
          itemListElement: [
            expect.objectContaining({
              position: 1,
              name: "Home",
              item: "https://esim.uplisoft.com/"
            }),
            expect.objectContaining({
              position: 2,
              name: "Travel guides",
              item: "https://esim.uplisoft.com/travel"
            }),
            expect.objectContaining({
              position: 3,
              name: "What Is an eSIM?",
              item: "https://esim.uplisoft.com/travel/what-is-an-esim"
            })
          ]
        }),
        expect.objectContaining({
          "@type": "FAQPage",
          mainEntity: [
            {
              "@type": "Question",
              name: "Does an eSIM replace my phone number?",
              acceptedAnswer: {
                "@type": "Answer",
                text:
                  "No. A travel eSIM can provide mobile data while your usual SIM remains available for calls, texts, and WhatsApp."
              }
            }
          ]
        })
      ])
    );
  });

  it("omits FAQ schema when a content page has no visible FAQs", () => {
    const schema = createContentPageJsonLd({
      path: "/destinations",
      name: "Travel eSIM Destinations",
      description: "Browse eSIM2you travel data destinations.",
      breadcrumbName: "Destinations"
    });

    expect(schema["@graph"].some((entry) => entry["@type"] === "FAQPage")).toBe(false);
  });

  it("emits a complete visible AggregateOffer range without review claims", () => {
    const product = createOfferProductJsonLd({
      url: "https://esim.uplisoft.com/esim/japan",
      name: "eSIM for Japan",
      description: "Japan travel data",
      offer: {
        lowPrice: 9.89,
        highPrice: 19.5,
        currency: "EUR",
        offerCount: 2
      }
    });

    expect(product).toMatchObject({
      "@type": "Product",
      image: "https://esim.uplisoft.com/og/esim2you-og.png?v=5",
      offers: {
        "@type": "AggregateOffer",
        lowPrice: "9.89",
        highPrice: "19.50",
        priceCurrency: "EUR"
      }
    });
    expect(product).not.toHaveProperty("aggregateRating");
    expect(product).not.toHaveProperty("review");
  });

  it("marks editorial pages as an Article by the organization, without a Product", () => {
    const schema = createContentPageJsonLd({
      path: "/compare/airalo-vs-esim2you",
      name: "Airalo vs eSIM2you",
      description: "Feature comparison.",
      breadcrumbName: "Airalo vs eSIM2you",
      article: { dateModified: new Date("2026-09-12T00:00:00.000Z") }
    });
    const types = schema["@graph"].map((node) => node["@type"]);
    const article = schema["@graph"].find((node) => node["@type"] === "Article");

    expect(types).not.toContain("Product");
    expect(article).toMatchObject({
      headline: "Airalo vs eSIM2you",
      mainEntityOfPage: { "@id": "https://esim.uplisoft.com/compare/airalo-vs-esim2you#webpage" },
      dateModified: "2026-09-12T00:00:00.000Z",
      author: { "@id": "https://esim.uplisoft.com/#organization" }
    });
  });

  it("keeps Product markup off compare pages and Article on travel guides", () => {
    const compareHub = readFileSync("src/app/compare/page.tsx", "utf8");
    const compareSlug = readFileSync("src/app/compare/[slug]/page.tsx", "utf8");
    const travelSlug = readFileSync("src/app/travel/[slug]/page.tsx", "utf8");

    expect(compareHub).not.toContain("offer:");
    expect(compareSlug).not.toMatch(/offer: offer/);
    expect(compareSlug).toContain("article: { dateModified: contentUpdatedAt(page.path) }");
    expect(travelSlug).toContain("<SeoContentPageView asArticle");
  });

  it("publishes /about and /contact as brand pages tied to the Organization", () => {
    const paths = indexableRoutes.map((route) => route.path);
    expect(paths).toEqual(expect.arrayContaining(["/about", "/contact"]));

    const about = createWebPageJsonLd({
      path: "/about",
      name: "About eSIM2you",
      description: "About",
      breadcrumbName: "About",
      pageType: "AboutPage"
    })["@graph"][0];
    expect(about).toMatchObject({
      "@type": "AboutPage",
      about: { "@id": "https://esim.uplisoft.com/#organization" }
    });

    const plain = createWebPageJsonLd({
      path: "/terms",
      name: "Terms",
      description: "Terms",
      breadcrumbName: "Terms"
    })["@graph"][0];
    expect(plain["@type"]).toBe("WebPage");
    expect(plain).not.toHaveProperty("about");
  });
});

describe("branded titles", () => {
  it("appends the brand to titles that lack it, once", () => {
    expect(brandedTitle("eSIM for Italy | Travel Data for Rome, Milan, and More")).toBe(
      "eSIM for Italy | Travel Data for Rome, Milan, and More | eSIM2you"
    );
    expect(brandedTitle("Support Center | eSIM2you")).toBe("Support Center | eSIM2you");
    expect(createMetadata({ path: "/esim/italy", title: "eSIM for Italy", description: "d" })).toMatchObject({
      title: "eSIM for Italy | eSIM2you",
      openGraph: { title: "eSIM for Italy | eSIM2you", siteName: "eSIM2you" }
    });
  });
});

describe("brand spelling", () => {
  // One spelling everywhere (titles, H1s, schema, footer, alt text), so Google
  // sees a single entity name instead of variants close to "eSIM2Me".
  const offVariants = /eSim2you|ESIM2you(?!\/61593159061406)|eSIM2You|eSIM 2 You|Esim2you/;

  function sourceFiles(dir: string): string[] {
    return readdirSync(dir).flatMap((name) => {
      const path = join(dir, name);
      if (statSync(path).isDirectory()) return sourceFiles(path);
      return /\.(tsx?|txt|json)$/.test(name) && !/\.test\.tsx?$/.test(name) ? [path] : [];
    });
  }

  it("spells the brand eSIM2you in every public source file", () => {
    const offenders = [...sourceFiles("src"), ...sourceFiles("public")].filter((file) =>
      offVariants.test(readFileSync(file, "utf8"))
    );
    expect(offenders).toEqual([]);
  });
});
