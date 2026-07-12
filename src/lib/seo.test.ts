import { describe, expect, it } from "vitest";
import {
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
    expect(indexableRoutes.map((route) => route.path)).toEqual(["/", "/policy", "/terms"]);
    expect(privateRoutePrefixes).toEqual([
      "/api",
      "/admin",
      "/account",
      "/auth",
      "/billing",
      "/dashboard",
      "/xerrors",
      "/xloginy"
    ]);
  });

  it("builds route metadata with canonical, open graph, twitter, and index directives", () => {
    const metadata = createMetadata({
      path: "/policy",
      title: "Privacy Policy | Velocity eSIM",
      description: "Privacy Policy for Velocity eSIM travelers and app users."
    });

    expect(metadata.alternates).toEqual({
      canonical: "https://esim.uplisoft.com/policy"
    });
    expect(metadata.openGraph).toMatchObject({
      title: "Privacy Policy | Velocity eSIM",
      description: "Privacy Policy for Velocity eSIM travelers and app users.",
      url: "https://esim.uplisoft.com/policy",
      siteName: "Velocity eSIM",
      type: "website"
    });
    expect(metadata.twitter).toMatchObject({
      card: "summary_large_image",
      title: "Privacy Policy | Velocity eSIM",
      description: "Privacy Policy for Velocity eSIM travelers and app users."
    });
    expect(metadata.robots).toEqual({ index: true, follow: true });
  });

  it("marks hidden app/admin pages as noindex and noarchive", () => {
    const metadata = createMetadata({
      path: "/xloginy",
      title: "Admin | Velocity eSIM",
      description: "Private Velocity eSIM admin surface.",
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
      description: "Terms of Service for Velocity eSIM travelers and app users.",
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

  it("adds the live Android app link to SoftwareApplication schema without a fake iOS URL", () => {
    const schema = createLandingJsonLd();
    const softwareApplication = schema["@graph"].find(
      (entry) => entry["@type"] === "SoftwareApplication"
    );

    expect(softwareApplication).toMatchObject({
      "@type": "SoftwareApplication",
      operatingSystem: "Android",
      downloadUrl: "https://play.google.com/store/apps/details?id=com.uplisoft.velocityesim",
      sameAs: ["https://play.google.com/store/apps/details?id=com.uplisoft.velocityesim"]
    });
    expect(JSON.stringify(softwareApplication)).not.toContain("apps.apple.com");
    expect(JSON.stringify(softwareApplication)).not.toContain("null");
  });
});
