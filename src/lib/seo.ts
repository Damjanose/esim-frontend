import type { Metadata } from "next";
import { comparePages } from "@/content/compare-pages";
import { landingContent } from "@/content/landing";
import { publicSeoPages, type SeoPageFaq } from "@/content/seo-pages";
import { siteReviewStats, siteReviews, type SiteReview, type SiteReviewStats } from "@/content/reviews";
import { siteUrl } from "@/lib/site-host";

export { siteUrl };
export const siteName = "eSIM2you";
// The brand is spelled "eSIM2you" everywhere. The only alternate is the
// lowercase form people type into search, which Google's site-name system
// reads from WebSite.alternateName. Without it a search for "esim2you" gets
// "did you mean" corrected toward the similarly named eSIM2Me. Don't add
// spaced or reworded variants: they dilute the one spelling.
export const siteAlternateNames = ["esim2you"];
export const supportEmail = "esim2you@uplisoft.com";
// The one-sentence brand description: reuse it verbatim in schema, the About
// page and outreach copy (docs/brand-outreach-kit.md) so every mention matches.
export const brandDescription =
  "eSIM2you is a travel eSIM provider offering prepaid mobile data plans in 200+ destinations, bought and installed from the eSIM2you app or website.";
// Bump this whenever public/og/esim2you-og.png changes so link-preview
// crawlers (iMessage, WhatsApp, Slack, Facebook, LinkedIn, X) fetch the
// new image instead of serving a stale cached copy of the old URL.
const ogImageVersion = "5";
export const ogImage = {
  url: `${siteUrl}/og/esim2you-og.png?v=${ogImageVersion}`,
  width: 1200,
  height: 630,
  alt: "eSIM2you: easy setup, instant connection. Travel eSIM for 200+ destinations."
};
export const appLogoUrl = `${siteUrl}/app-logo.png`;

export const socialLinks = {
  instagram: "https://www.instagram.com/esim2you",
  facebook: "https://www.facebook.com/people/ESIM2you/61593159061406/"
};
// Third-party profiles that describe eSIM2you. They go in Organization sameAs
// so Google and AI search tie mentions on those sites to this entity. Only list
// profiles that exist and use this exact name and website.
export const brandProfileLinks = {
  productHunt: "https://www.producthunt.com/products/esim2you"
};

export const privateRoutePrefixes = [
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
] as const;

export type IndexableRoute = {
  path: string;
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
    title: "eSIM2you: Travel eSIMs for 200+ Destinations",
    description:
      "Stay connected abroad with eSIM2you. Compare prepaid travel eSIM data plans for 200+ destinations, install before you fly and skip roaming fees.",
    changeFrequency: "monthly",
    priority: 1
  },
  {
    path: "/destinations",
    url: `${siteUrl}/destinations`,
    title: "Travel eSIM Destinations | eSIM2you",
    description:
      "Browse eSIM2you destinations for international travel data, mobile internet abroad, and roaming alternatives.",
    changeFrequency: "monthly",
    priority: 0.8
  },
  {
    path: "/travel",
    url: `${siteUrl}/travel`,
    title: "Travel eSIM Guides | eSIM2you",
    description:
      "Guides for installing a travel eSIM, comparing eSIM vs roaming, and staying online abroad.",
    changeFrequency: "monthly",
    priority: 0.7
  },
  {
    path: "/use-cases",
    url: `${siteUrl}/use-cases`,
    title: "eSIM Use Cases | eSIM2you",
    description:
      "How eSIM2you helps with business travel, remote work, cruises, and study abroad data needs.",
    changeFrequency: "monthly",
    priority: 0.6
  },
  {
    path: "/compare",
    url: `${siteUrl}/compare`,
    title: "Compare Travel eSIMs | eSIM2you",
    description:
      "Factual comparisons of eSIM2you with other travel eSIM providers. Live prices stay on destination pages.",
    changeFrequency: "monthly",
    priority: 0.7
  },
  ...publicSeoPages.map((page) => ({
    path: page.path,
    url: `${siteUrl}${page.path}`,
    title: page.title,
    description: page.description,
    changeFrequency: "monthly" as const,
    priority: page.kind === "destination" ? 0.75 : 0.65
  })),
  ...comparePages.map((page) => ({
    path: page.path,
    url: `${siteUrl}${page.path}`,
    title: page.title,
    description: page.description,
    changeFrequency: "monthly" as const,
    priority: 0.6
  })),
  {
    path: "/trip-plan",
    url: `${siteUrl}/trip-plan`,
    title: "AI Trip Planner: Day-by-Day Itineraries | eSIM2you",
    description:
      "Tell us where you're going and for how long. Get a day-by-day travel itinerary with timed stops, transport tips and practical notes, then download it as a PDF.",
    changeFrequency: "monthly",
    priority: 0.7
  },
  {
    path: "/esim-price-index",
    url: `${siteUrl}/esim-price-index`,
    title: "Travel eSIM Price Index: Cost per GB by Country | eSIM2you",
    description:
      "What a prepaid travel eSIM costs in each destination: starting price and lowest price per GB from live eSIM2you plans, updated hourly. Free to cite and download as CSV.",
    changeFrequency: "monthly",
    priority: 0.7
  },
  {
    path: "/press",
    url: `${siteUrl}/press`,
    title: "eSIM2you Press Kit: Logos, Facts and Media Contact",
    description:
      "eSIM2you press kit for journalists, bloggers and partners: company description, key facts, logo downloads, linking guidance and media contact.",
    changeFrequency: "monthly",
    priority: 0.5
  },
  {
    path: "/about",
    url: `${siteUrl}/about`,
    title: "About eSIM2you | Travel eSIM Data for 200+ Destinations",
    description:
      "eSIM2you is a travel eSIM provider: prepaid mobile data in 200+ destinations, bought and installed from the eSIM2you app or website.",
    changeFrequency: "monthly",
    priority: 0.6
  },
  {
    path: "/contact",
    url: `${siteUrl}/contact`,
    title: "Contact eSIM2you | Support Email and Chat",
    description:
      "Contact eSIM2you by email or in-app chat for help with eSIM setup, orders, top-ups and refunds, or to partner with us.",
    changeFrequency: "monthly",
    priority: 0.5
  },
  {
    path: "/support",
    url: `${siteUrl}/support`,
    title: "Support Center | eSIM2you",
    description:
      "Get help with eSIM2you app sign-in, Pokpay checkout, QR or manual eSIM setup, remaining data, top-ups, refunds, and connection troubleshooting.",
    changeFrequency: "monthly",
    priority: 0.6
  },
  {
    path: "/policy",
    url: `${siteUrl}/policy`,
    title: "Privacy Policy | eSIM2you",
    description: "Privacy Policy for eSIM2you travelers and app users.",
    changeFrequency: "yearly",
    priority: 0.3
  },
  {
    path: "/terms",
    url: `${siteUrl}/terms`,
    title: "Terms of Service | eSIM2you",
    description: "Terms of Service for eSIM2you travelers and app users.",
    changeFrequency: "yearly",
    priority: 0.3
  }
];

export function absoluteUrl(path: string) {
  if (path === "/") return `${siteUrl}/`;
  return `${siteUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * Every page title names the brand, so "eSIM2you Italy"-style searches match
 * the right page. Titles that already say eSIM2you are left alone.
 */
export function brandedTitle(title: string): string {
  return title.includes(siteName) ? title : `${title} | ${siteName}`;
}

export function createMetadata({
  path,
  title: pageTitle,
  description,
  indexable = true
}: {
  path: string;
  title: string;
  description: string;
  indexable?: boolean;
}): Metadata {
  const url = absoluteUrl(path);
  const title = brandedTitle(pageTitle);

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

export function createAggregateRatingNode(stats: SiteReviewStats) {
  return {
    "@type": "AggregateRating",
    ratingValue: stats.ratingValue,
    reviewCount: stats.reviewCount,
    bestRating: stats.bestRating ?? 5,
    worstRating: stats.worstRating ?? 1
  };
}

export function createReviewNodes(reviews: SiteReview[]) {
  return reviews.map((review) => ({
    "@type": "Review",
    author: { "@type": "Person", name: review.author },
    datePublished: review.datePublished,
    reviewBody: review.reviewBody,
    reviewRating: {
      "@type": "Rating",
      ratingValue: review.ratingValue,
      bestRating: 5,
      worstRating: 1
    }
  }));
}

export function createLandingJsonLd(reviews: SiteReview[] = siteReviews) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${siteUrl}/#organization`,
        name: siteName,
        alternateName: siteAlternateNames,
        url: `${siteUrl}/`,
        email: supportEmail,
        logo: appLogoUrl,
        description: brandDescription,
        contactPoint: {
          "@type": "ContactPoint",
          contactType: "customer support",
          email: supportEmail,
          url: `${siteUrl}/contact`,
          availableLanguage: ["en"]
        },
        sameAs: [
          socialLinks.instagram,
          socialLinks.facebook,
          brandProfileLinks.productHunt,
          landingContent.appLinks.ios.href,
          landingContent.appLinks.android.href
        ]
      },
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        url: `${siteUrl}/`,
        name: siteName,
        alternateName: siteAlternateNames,
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
        url: `${siteUrl}/`,
        downloadUrl: landingContent.appLinks.ios.href,
        sameAs: [
          landingContent.appLinks.ios.href,
          landingContent.appLinks.android.href
        ],
        ...(siteReviewStats ? { aggregateRating: createAggregateRatingNode(siteReviewStats) } : {}),
        ...(reviews.length > 0 ? { review: createReviewNodes(reviews) } : {})
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
  breadcrumbName,
  pageType = "WebPage"
}: {
  path: "/about" | "/contact" | "/esim-price-index" | "/policy" | "/press" | "/support" | "/terms" | "/trip-plan";
  name: string;
  description: string;
  breadcrumbName: string;
  pageType?: "WebPage" | "AboutPage" | "ContactPage";
}) {
  const url = absoluteUrl(path);

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": pageType,
        "@id": `${url}#webpage`,
        url,
        name,
        description,
        isPartOf: { "@id": `${siteUrl}/#website` },
        // About and Contact pages describe the brand itself: tie them to the
        // Organization node so Google reads them as the entity's own pages.
        ...(pageType === "WebPage" ? {} : { about: { "@id": `${siteUrl}/#organization` } }),
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

/**
 * Dataset node for the public price index. Only emit it when the table it
 * describes is on the page (there are live rows to show).
 */
export function createPriceIndexDatasetJsonLd({
  description,
  dateModified
}: {
  description: string;
  dateModified: string;
}) {
  const url = absoluteUrl("/esim-price-index");
  return {
    "@type": "Dataset",
    "@id": `${url}#dataset`,
    name: "eSIM2you Travel eSIM Price Index",
    description,
    url,
    creator: { "@id": `${siteUrl}/#organization` },
    publisher: { "@id": `${siteUrl}/#organization` },
    license: "https://creativecommons.org/licenses/by/4.0/",
    isAccessibleForFree: true,
    dateModified,
    keywords: ["travel eSIM prices", "eSIM cost per GB", "mobile data prices abroad"],
    variableMeasured: [
      "Starting price of a travel eSIM plan (EUR)",
      "Lowest price per GB of a travel eSIM plan (EUR)",
      "Number of plans available"
    ],
    distribution: {
      "@type": "DataDownload",
      encodingFormat: "text/csv",
      contentUrl: absoluteUrl("/esim-price-index.csv")
    }
  };
}

export type DestinationOfferInput = {
  lowPrice: number;
  highPrice: number;
  currency: string;
  offerCount: number;
};

/**
 * Product + AggregateOffer node for a page with a real, visibly-rendered
 * "from $X" price. Only call this where that price is on the page — schema
 * that doesn't match visible content risks a Google structured-data penalty.
 */
export function createOfferProductJsonLd({
  url,
  name,
  description,
  offer
}: {
  url: string;
  name: string;
  description: string;
  offer: DestinationOfferInput;
}) {
  return {
    "@type": "Product",
    "@id": `${url}#product`,
    name,
    description,
    image: ogImage.url,
    brand: { "@id": `${siteUrl}/#organization` },
    offers: {
      "@type": "AggregateOffer",
      url,
      priceCurrency: offer.currency,
      lowPrice: offer.lowPrice.toFixed(2),
      highPrice: offer.highPrice.toFixed(2),
      offerCount: offer.offerCount,
      availability: "https://schema.org/InStock"
    }
  };
}

export function createContentPageJsonLd({
  path,
  name,
  description,
  breadcrumbName,
  parent,
  faqs = [],
  offer,
  article
}: {
  path: string;
  name: string;
  description: string;
  breadcrumbName: string;
  parent?: {
    name: string;
    path: string;
  };
  faqs?: SeoPageFaq[];
  offer?: DestinationOfferInput;
  /**
   * Mark editorial pages (travel guides, comparisons) as an Article. There are no
   * per-guide authors or publish dates yet, so the Organization is the author and
   * only dateModified (the content update date the sitemap also uses) is emitted.
   */
  article?: { dateModified: Date };
}) {
  const url = absoluteUrl(path);
  const breadcrumbItems = [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: `${siteUrl}/`
    }
  ];

  if (parent) {
    breadcrumbItems.push({
      "@type": "ListItem",
      position: 2,
      name: parent.name,
      item: absoluteUrl(parent.path)
    });
  }

  breadcrumbItems.push({
    "@type": "ListItem",
    position: breadcrumbItems.length + 1,
    name: breadcrumbName,
    item: url
  });

  const graph: Record<string, unknown>[] = [
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
      itemListElement: breadcrumbItems
    }
  ];

  if (faqs.length > 0) {
    graph.push({
      "@type": "FAQPage",
      "@id": `${url}#faq`,
      mainEntity: faqs.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: faq.answer
        }
      }))
    });
  }

  if (offer) {
    graph.push(createOfferProductJsonLd({ url, name, description, offer }));
  }

  if (article) {
    graph.push({
      "@type": "Article",
      "@id": `${url}#article`,
      headline: name,
      description,
      url,
      mainEntityOfPage: { "@id": `${url}#webpage` },
      image: ogImage.url,
      dateModified: article.dateModified.toISOString(),
      inLanguage: "en",
      author: { "@id": `${siteUrl}/#organization` },
      publisher: { "@id": `${siteUrl}/#organization` }
    });
  }

  return {
    "@context": "https://schema.org",
    "@graph": graph
  };
}
