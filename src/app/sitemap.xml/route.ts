import { siteUrl } from "@/lib/seo";
import { sitemapSegmentIds, sitemapSegmentLastModified } from "@/lib/sitemaps";

const stylesheet = `<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>`;

export function GET() {
  const body = `<?xml version="1.0" encoding="UTF-8"?>
${stylesheet}
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapSegmentIds
  .map((id) => {
    const lastmod = sitemapSegmentLastModified(id).toISOString();
    return `  <sitemap>
    <loc>${siteUrl}/sitemaps/${id}.xml</loc>
    <lastmod>${lastmod}</lastmod>
  </sitemap>`;
  })
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
