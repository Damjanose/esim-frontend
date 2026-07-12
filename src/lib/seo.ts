import type { Metadata } from "next";
import { landingContent } from "@/content/landing";

export const siteUrl = "https://esim.uplisoft.com";
export const siteName = "Velocity eSIM";
export const supportEmail = "esim@uplisoft.com";
export const ogImage = {
  url: `${siteUrl}/og/velocity-esim-og.png`,
  width: 1200,
  height: 630,
  alt: "Velocity eSIM travel data app preview"
};

export const privateRoutePrefixes = [
  "/api",
  "/admin",
  "/account",
  "/auth",
  "/billing",
  "/dashboard",
  "/xerrors",
  "/xloginy"
] as const;

export type IndexableRoute = {
  path: "/" | "/policy" | "/terms";
  url: string;
  title: string;
  description: string;
  changeFrequency: "monthly" | "yearly";
  priority: number;
};

export const indexableRoutes: IndexableRoute[] = [
  {
    path: "/",
    url: `${siteUrl}/`,
    title: "Velocity eSIM | Travel Data for 200+ Destinations",
    description:
      "Buy a digital SIM for 200+ destinations, install it in minutes, and skip surprise roaming fees.",
    changeFrequency: "monthly",
    priority: 1
  },
  {
    path: "/policy",
    url: `${siteUrl}/policy`,
    title: "Privacy Policy | Velocity eSIM",
    description: "Privacy Policy for Velocity eSIM travelers and app users.",
    changeFrequency: "yearly",
    priority: 0.3
  },
  {
    path: "/terms",
    url: `${siteUrl}/terms`,
    title: "Terms of Service | Velocity eSIM",
    description: "Terms of Service for Velocity eSIM travelers and app users.",
    changeFrequency: "yearly",
    priority: 0.3
  }
];

export function absoluteUrl(path: string) {
  if (path === "/") return `${siteUrl}/`;
  return `${siteUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

export function createMetadata({
  path,
  title,
  description,
  indexable = true
}: {
  path: string;
  title: string;
  description: string;
  indexable?: boolean;
}): Metadata {
  const url = absoluteUrl(path);

  return {
    title,
    description,
    alternates: {
      canonical: url
    },
    openGraph: {
      title,
      description,
      url,
      siteName,
      type: "website",
      images: [ogImage]
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage.url]
    },
    robots: indexable
      ? { index: true, follow: true }
      : {
          index: false,
          follow: false,
          nocache: true,
          googleBot: {
            index: false,
            follow: false,
            noimageindex: true
          }
        }
  };
}

export function createLandingJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${siteUrl}/#organization`,
        name: siteName,
        url: `${siteUrl}/`,
        email: supportEmail,
        logo: ogImage.url
      },
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        url: `${siteUrl}/`,
        name: siteName,
        publisher: { "@id": `${siteUrl}/#organization` },
        inLanguage: "en"
      },
      {
        "@type": "SoftwareApplication",
        "@id": `${siteUrl}/#softwareapplication`,
        name: siteName,
        applicationCategory: "TravelApplication",
        operatingSystem: "iOS, Android",
        description: landingContent.hero.body,
        url: `${siteUrl}/`
      },
      {
        "@type": "FAQPage",
        "@id": `${siteUrl}/#faq`,
        mainEntity: landingContent.faqs.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: faq.answer
          }
        }))
      }
    ]
  };
}

export function createWebPageJsonLd({
  path,
  name,
  description,
  breadcrumbName
}: {
  path: "/policy" | "/terms";
  name: string;
  description: string;
  breadcrumbName: string;
}) {
  const url = absoluteUrl(path);

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${url}#webpage`,
        url,
        name,
        description,
        isPartOf: { "@id": `${siteUrl}/#website` },
        inLanguage: "en"
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${url}#breadcrumb`,
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: `${siteUrl}/`
          },
          {
            "@type": "ListItem",
            position: 2,
            name: breadcrumbName,
            item: url
          }
        ]
      }
    ]
  };
}
