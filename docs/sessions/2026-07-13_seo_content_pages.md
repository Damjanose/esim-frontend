# SEO Content Pages

## Context
The Next.js public site already had canonical metadata, robots, sitemap, legal pages, Open Graph image, and structured data for the homepage. It only had one main indexable marketing page, so search engines had little dedicated content for travel eSIM, destination, guide, and use-case queries.

## What changed
- Added reusable global English SEO content for destination, guide, and use-case pages.
- Added crawlable routes for:
  - `/destinations`
  - `/destinations/usa`
  - `/destinations/europe`
  - `/destinations/japan`
  - `/destinations/turkey`
  - `/destinations/france`
  - `/destinations/uk`
  - `/guides/what-is-an-esim`
  - `/guides/esim-vs-roaming`
  - `/guides/how-to-install-esim`
  - `/guides/internet-abroad`
  - `/use-cases/business-travel`
  - `/use-cases/remote-work`
- Added a shared public SEO page renderer with visible FAQ sections, related links, and Google Play CTAs.
- Extended the sitemap source of truth to include the new public routes while keeping private/admin/API routes excluded.
- Added content-page JSON-LD with `WebPage`, `BreadcrumbList`, and visible `FAQPage` data.
- Updated the homepage with destination-page links, guide/use-case footer links, and natural copy for travel data, mobile internet abroad, roaming alternatives, remote work, and business travel.
- Added tests covering content integrity, sitemap membership, metadata, and structured data.

## Verification
- `pnpm test src/content/seo-pages.test.ts src/lib/seo.test.ts src/app/seo-routes.test.ts src/content/landing.test.ts`
- `pnpm test`
- `pnpm build`

## Follow-up
- Submit the expanded sitemap in Google Search Console after deployment.
- Review Search Console query data after indexing before adding more country pages.
