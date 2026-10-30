/**
 * When each public page's main content last changed, for sitemap <lastmod>
 * and Article dateModified. Google only trusts lastmod that tracks real
 * content changes, so:
 *
 * - Bump the matching entry in the same change that edits a page's visible
 *   copy, headings, FAQs, plan table structure or structured data.
 * - Do not bump for styling, layout or navigation/related-link changes.
 *
 * Exact paths win over prefixes; everything else uses the default. Dates come
 * from the git history of src/content/* and the page templates.
 */
const defaultUpdatedAt = "2026-09-12";

const byPath: Record<string, string> = {
  // Benefits, FAQ, testimonials and app sections rewritten (bc62285, d697439, 64da945).
  "/": "2026-10-02",
  // Visible H1 fix (15aa5be).
  "/destinations": "2026-09-27",
  // Planner launched on the web (2ed6b77).
  "/trip-plan": "2026-10-02",
  // Flight search launched.
  "/flights": "2026-10-09",
  // Support chat and FAQ on the web (e4131cb).
  "/support": "2026-10-02",
  // Brand pages launched.
  "/about": "2026-10-08",
  "/contact": "2026-10-08",
  // Link-earning pages launched.
  "/esim-price-index": "2026-10-08",
  "/press": "2026-10-08",
  // Options table, data, roaming and WhatsApp sections, new FAQs.
  "/travel/internet-abroad": "2026-10-08",
  // SEO content pack: /compare price-per-GB hub, city blocks and city-led titles.
  "/compare": "2026-10-30",
  "/esim/spain": "2026-10-30",
  "/esim/italy": "2026-10-30",
  "/esim/mexico": "2026-10-30"
};

const byPrefix: Array<[prefix: string, date: string]> = [
  // Price-led meta descriptions and per-plan Offer schema on every page; 182
  // catalog country pages launched.
  ["/esim/", "2026-10-25"]
];

export function contentUpdatedAt(path: string): Date {
  const date =
    byPath[path] ?? byPrefix.find(([prefix]) => path.startsWith(prefix))?.[1] ?? defaultUpdatedAt;
  return new Date(`${date}T00:00:00.000Z`);
}
