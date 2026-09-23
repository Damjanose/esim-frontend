import type { MetadataRoute } from "next";
import { privateRoutePrefixes, siteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [...privateRoutePrefixes]
    },
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl
  };
}
