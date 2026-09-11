import type { MetadataRoute } from "next";
import { seoContentUpdatedAt } from "@/lib/esim-routes";
import { indexableRoutes, siteUrl } from "@/lib/seo";

export const sitemapSegmentIds = ["static", "esim", "travel", "compare"] as const;
export type SitemapSegmentId = (typeof sitemapSegmentIds)[number];

function lastModifiedForPath(path: string): Date {
  if (path === "/policy" || path === "/terms") {
    return new Date("2026-05-09T00:00:00.000Z");
  }
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
