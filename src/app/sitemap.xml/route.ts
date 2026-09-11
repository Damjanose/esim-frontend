import { seoContentUpdatedAt } from "@/lib/esim-routes";
import { siteUrl } from "@/lib/seo";
import { sitemapSegmentIds } from "@/lib/sitemaps";

export function GET() {
  const lastmod = seoContentUpdatedAt.toISOString();
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapSegmentIds
  .map(
    (id) => `  <sitemap>
    <loc>${siteUrl}/sitemaps/${id}.xml</loc>
    <lastmod>${lastmod}</lastmod>
  </sitemap>`
  )
  .join("\n")}
</sitemapindex>
`;

  return new Response(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600"
    }
  });
}
