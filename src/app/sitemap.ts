import type { MetadataRoute } from "next";
import { indexableRoutes } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  return indexableRoutes.map((route) => ({
    url: route.url,
    lastModified: new Date("2026-07-12"),
    changeFrequency: route.changeFrequency,
    priority: route.priority
  }));
}
