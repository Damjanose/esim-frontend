import type { MetadataRoute } from "next";
import { policyDocument, termsDocument } from "@/content/legal";
import { contentUpdatedAt } from "@/lib/content-dates";
import { indexableRoutes, siteUrl } from "@/lib/seo";

export const sitemapSegmentIds = ["static", "esim", "travel", "compare"] as const;
export type SitemapSegmentId = (typeof sitemapSegmentIds)[number];

function legalLastModified(path: string, lastUpdated: string): Date {
  const parsed = Date.parse(`${lastUpdated} 00:00:00 GMT`);
  if (Number.isNaN(parsed)) return contentUpdatedAt(path);
  return new Date(parsed);
}

function lastModifiedForPath(path: string): Date {
  if (path === "/policy") return legalLastModified(path, policyDocument.lastUpdated);
  if (path === "/terms") return legalLastModified(path, termsDocument.lastUpdated);
  return contentUpdatedAt(path);
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

export function sitemapSegmentLastModified(id: SitemapSegmentId): Date {
  const times = sitemapEntriesFor(id).map((entry) => {
    const value = entry.lastModified;
    return value instanceof Date ? value.getTime() : new Date(value ?? 0).getTime();
  });
  return new Date(Math.max(...times));
}

export function allSitemapEntries(): MetadataRoute.Sitemap {
  return sitemapSegmentIds.flatMap((id) => sitemapEntriesFor(id));
}

export function sitemapIndexUrls() {
  return sitemapSegmentIds.map((id) => `${siteUrl}/sitemaps/${id}.xml`);
}
