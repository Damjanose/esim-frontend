import { describe, expect, it } from "vitest";
import {
  createContentPageJsonLd,
  createLandingJsonLd,
  createMetadata,
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
    expect(indexableRoutes.map((route) => route.path)).toEqual([
      "/",
      "/destinations",
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
      "/guides/what-is-an-esim",
      "/guides/esim-vs-roaming",
      "/guides/how-to-install-esim",
      "/guides/internet-abroad",
      "/guides/esim-vs-local-sim",
      "/use-cases/business-travel",
      "/use-cases/remote-work",
      "/support",
      "/policy",
      "/terms"
    ]);
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
      "/xerrors",
      "/xloginy"
    ]);
  });

  it("builds route metadata with canonical, open graph, twitter, and index directives", () => {
    const metadata = createMetadata({
      path: "/policy",
      title: "Privacy Policy | eSim2you",
      description: "Privacy Policy for eSim2you travelers and app users."
    });

    expect(metadata.alternates).toEqual({
      canonical: "https://esim.uplisoft.com/policy"
    });
    expect(metadata.openGraph).toMatchObject({
      title: "Privacy Policy | eSim2you",
      description: "Privacy Policy for eSim2you travelers and app users.",
      url: "https://esim.uplisoft.com/policy",
      siteName: "eSim2you",
      type: "website"
    });
    expect(metadata.twitter).toMatchObject({
      card: "summary_large_image",
      title: "Privacy Policy | eSim2you",
      description: "Privacy Policy for eSim2you travelers and app users."
    });
    expect(metadata.robots).toEqual({ index: true, follow: true });
  });

  it("marks hidden app/admin pages as noindex and noarchive", () => {
    const metadata = createMetadata({
      path: "/xloginy",
      title: "Admin | eSim2you",
      description: "Private eSim2you admin surface.",
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
      description: "Terms of Service for eSim2you travelers and app users.",
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
      downloadUrl: "https://apps.apple.com/am/app/velocityesim/id6768258284",
      sameAs: [
        "https://apps.apple.com/am/app/velocityesim/id6768258284",
        "https://play.google.com/store/apps/details?id=com.uplisoft.velocityesim"
      ]
    });
    expect(JSON.stringify(softwareApplication)).not.toContain("null");
  });

  it("creates content page schema with breadcrumbs and visible FAQ answers", () => {
    const schema = createContentPageJsonLd({
      path: "/guides/what-is-an-esim",
      name: "What Is an eSIM?",
      description:
        "A simple guide to what an eSIM is, how travel eSIM data works, and when to install one before an international trip.",
      breadcrumbName: "What Is an eSIM?",
      parent: {
        name: "Guides",
        path: "/guides"
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
          "@id": "https://esim.uplisoft.com/guides/what-is-an-esim#webpage",
          url: "https://esim.uplisoft.com/guides/what-is-an-esim",
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
              name: "Guides",
              item: "https://esim.uplisoft.com/guides"
            }),
            expect.objectContaining({
              position: 3,
              name: "What Is an eSIM?",
              item: "https://esim.uplisoft.com/guides/what-is-an-esim"
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
      description: "Browse eSim2you travel data destinations.",
      breadcrumbName: "Destinations"
    });

    expect(schema["@graph"].some((entry) => entry["@type"] === "FAQPage")).toBe(false);
  });
});
