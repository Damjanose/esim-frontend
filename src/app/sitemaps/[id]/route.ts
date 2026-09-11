import { sitemapEntriesFor, sitemapSegmentIds, type SitemapSegmentId } from "@/lib/sitemaps";
import { notFound } from "next/navigation";

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function generateStaticParams() {
  return sitemapSegmentIds.map((id) => ({ id: `${id}.xml` }));
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const raw = (await context.params).id.replace(/\.xml$/, "");
  if (!sitemapSegmentIds.includes(raw as SitemapSegmentId)) {
    notFound();
  }

  const entries = sitemapEntriesFor(raw as SitemapSegmentId);
  const urls = entries
    .map((entry) => {
      const lastmod =
        entry.lastModified instanceof Date
          ? entry.lastModified.toISOString()
          : new Date(entry.lastModified ?? Date.now()).toISOString();
      return `  <url>
    <loc>${escapeXml(entry.url)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${entry.changeFrequency ?? "monthly"}</changefreq>
    <priority>${entry.priority ?? 0.5}</priority>
  </url>`;
    })
    .join("\n");

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;

  return new Response(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600"
    }
  });
}
