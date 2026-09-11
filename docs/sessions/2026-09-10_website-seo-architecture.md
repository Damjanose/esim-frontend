---
date: 2026-09-10
tags: [seo, sitemap, destinations, travel, compare]
status: complete
---

# Session: website-seo-architecture

## What existed before

Public SEO lived under `/destinations/[slug]` and `/guides/[slug]` with a
single sitemap listing ~29 URLs, all dated `2026-07-12`. Destination “SEO”
pages were short copy; live plan tables sat on `/destinations?country=`, a
query-string duplicate. `robots.txt` omitted several `x*` admin prefixes.

## What was done

- Canonical country URLs are `/esim/[slug]`; guides are `/travel/[slug]`.
  Next 301s `/destinations/:slug` and `/guides/:slug`. `/destinations` stays
  the browse hub.
- Known `?country=` queries permanent-redirect to `/esim/[slug]`; unknown
  countries keep DestinationPlans but are `noindex`.
- Destination pages use keyword H1s, visible breadcrumbs, a server-rendered
  live plan table, and neighbor/region links. Albania, Asia, and North
  America pages were added. `/cheapest-esim` was not shipped.
- Sitemap is split (`static` / `esim` / `travel` / `compare`) with real
  lastModified dates. Compare hub + Airalo/Nomad/Saily pages are factual
  feature tables, not price claims.

## How it was done

Content paths in `src/content/seo-pages.ts`, new `src/lib/esim-routes.ts`
and `src/lib/sitemaps.ts`, `EsimDestinationPage`, App Router moves, and
`next.config.mjs` redirects.

## Verification

`pnpm test` — 488 passing. Browser-checked `/esim/usa`, `/travel`,
`/compare`, `/sitemap.xml`, `/robots.txt`, and a `/destinations/usa` 301.

## Follow-ups

Submit the sitemap index in Google Search Console after deploy. Do not add
`/cheapest-esim` until competitor prices can be evidenced.
