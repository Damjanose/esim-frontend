import type { MetadataRoute } from "next";
import { policyDocument, termsDocument } from "@/content/legal";
import { seoContentUpdatedAt } from "@/lib/esim-routes";
import { indexableRoutes, siteUrl } from "@/lib/seo";

export const sitemapSegmentIds = ["static", "esim", "travel", "compare"] as const;
export type SitemapSegmentId = (typeof sitemapSegmentIds)[number];

function legalLastModified(lastUpdated: string): Date {
  const parsed = Date.parse(`${lastUpdated} 00:00:00 GMT`);
  if (Number.isNaN(parsed)) return seoContentUpdatedAt;
  return new Date(parsed);
}

function lastModifiedForPath(path: string): Date {
  if (path === "/policy") return legalLastModified(policyDocument.lastUpdated);
  if (path === "/terms") return legalLastModified(termsDocument.lastUpdated);
  return seoContentUpdatedAt;
}

function toSitemapEntry(route: (typeof indexableRoutes)[number]): MetadataRoute.Sitemap[number] {
  return {
    url: route.url,
    lastModified: lastModifiedForPath(route.path),
    changeFrequency: route.changeFrequency,
    priority: route.priority
  };
}

function segmentForPath(path: string): SitemapSegmentId {
  if (path === "/esim" || path.startsWith("/esim/")) return "esim";
  if (path === "/travel" || path.startsWith("/travel/")) return "travel";
  if (path === "/compare" || path.startsWith("/compare/")) return "compare";
  return "static";
}

export function sitemapEntriesFor(id: SitemapSegmentId): MetadataRoute.Sitemap {
  return indexableRoutes.filter((route) => segmentForPath(route.path) === id).map(toSitemapEntry);
}

export function allSitemapEntries(): MetadataRoute.Sitemap {
  return sitemapSegmentIds.flatMap((id) => sitemapEntriesFor(id));
}

export function sitemapIndexUrls() {
  return sitemapSegmentIds.map((id) => `${siteUrl}/sitemaps/${id}.xml`);
}
