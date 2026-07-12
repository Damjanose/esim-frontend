# Subdomain SEO

## Context
The `E-SIM-frontend` project is a Next.js public landing site served at `https://esim.uplisoft.com`. It also contains hidden admin surfaces at `/xloginy` and `/xerrors`, plus API proxy routes under `/api/*`.

## What changed
- Added a shared SEO source of truth in `src/lib/seo.ts` for the canonical subdomain, OG image, public routes, private route prefixes, metadata helpers, and JSON-LD builders.
- Added a real project-local 1200x630 Open Graph PNG at `public/og/velocity-esim-og.png`.
- Added route-specific metadata for `/`, `/policy`, and `/terms`, including canonical URLs, Open Graph, Twitter cards, and index/follow robots directives.
- Added JSON-LD for the public landing page:
  - `Organization`
  - `WebSite`
  - `SoftwareApplication`
  - `FAQPage` using only the visible FAQ copy on the page
- Added JSON-LD for `/policy` and `/terms`:
  - `WebPage`
  - `BreadcrumbList`
- Added Next metadata routes for:
  - `/robots.txt`
  - `/sitemap.xml`
- Limited the sitemap to indexable public pages only:
  - `https://esim.uplisoft.com/`
  - `https://esim.uplisoft.com/policy`
  - `https://esim.uplisoft.com/terms`
- Added hidden admin layouts with `noindex`, `nofollow`, `nocache`, and Googlebot `noimageindex` metadata for:
  - `/xloginy`
  - `/xerrors`
- Added middleware redirects for duplicate canonical variants the app can safely control:
  - `www.esim.uplisoft.com` to `esim.uplisoft.com`
  - forwarded `http` requests on the canonical host to `https`
  - non-root trailing slash paths to no trailing slash
- Added SEO contract tests covering metadata, sitemap membership, robots exclusions, private noindex layouts, and canonical redirect middleware.

## Intentional exclusions
The following are intentionally private or API-only and must not be listed in the sitemap:
- `/api/*`
- `/admin/*`
- `/account/*`
- `/auth/*`
- `/billing/*`
- `/dashboard/*`
- `/xerrors`
- `/xloginy`

## Manual follow-up
- Confirm the production reverse proxy also performs HTTP to HTTPS redirects before requests reach Next.js.
- Confirm DNS/TLS behavior for `www.esim.uplisoft.com`; if the host resolves publicly, it should redirect to `https://esim.uplisoft.com`.
- In Google Search Console, add or verify the property for `https://esim.uplisoft.com`, submit `https://esim.uplisoft.com/sitemap.xml`, and inspect `/`, `/policy`, and `/terms`.
- Review the generated OG image visually before broad sharing if brand exactness matters.
