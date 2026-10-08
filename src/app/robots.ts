import type { MetadataRoute } from "next";
import { robotsDisallowPaths } from "@/lib/robots-policy";
import { siteUrl } from "@/lib/seo";

// Private HTML routes (/checkout, /signin, /profile, /account, ...) are left
// out on purpose: they send noindex, and a Disallow would hide that from
// Google. Obfuscated admin routes (/x*) stay out too, since listing them would
// publish the hidden paths; their layouts emit noindex meta instead.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [...robotsDisallowPaths]
    },
    sitemap: `${siteUrl}/sitemap.xml`
  };
}
