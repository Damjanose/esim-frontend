import type { MetadataRoute } from "next";
import { privateRoutePrefixes, siteUrl } from "@/lib/seo";

// Obfuscated admin routes (/x*) stay out of robots.txt: listing them here would
// publish the hidden paths. Their layouts already emit noindex meta instead.
const robotsDisallow = privateRoutePrefixes.filter((prefix) => !prefix.startsWith("/x"));

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: robotsDisallow
    },
    sitemap: `${siteUrl}/sitemap.xml`
  };
}
