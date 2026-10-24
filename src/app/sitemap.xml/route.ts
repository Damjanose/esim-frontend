import { siteUrl } from "@/lib/seo";
import { blogSitemapEntries, blogSitemapId, sitemapSegmentIds, sitemapSegmentLastModified } from "@/lib/sitemaps";

const stylesheet = `<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>`;

// Blog posts arrive from Holo at any time; /bff/blog/revalidate refreshes this on publish.
export const revalidate = 3600;

export async function GET() {
  // The blog part is listed only once it has a post, so it never points at an empty file.
  const blogEntries = await blogSitemapEntries();
  const blogLastmod = blogEntries[0]?.lastModified;
  const blogSitemap =
    blogLastmod instanceof Date
      ? `\n  <sitemap>
    <loc>${siteUrl}/sitemaps/${blogSitemapId}.xml</loc>
    <lastmod>${blogLastmod.toISOString()}</lastmod>
  </sitemap>`
      : "";
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
  .join("\n")}${blogSitemap}
</sitemapindex>
`;

  return new Response(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600"
    }
  });
}
