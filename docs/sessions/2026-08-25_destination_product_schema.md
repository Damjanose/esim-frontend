---
date: 2026-08-25
tags: [seo, destinations, structured-data]
status: complete
---

# Session: destination-product-schema

## What existed before
An SEO audit (part of this session, root/CLAUDE.md-scoped across all three repos) found
the 18 static `/destinations/[slug]` SEO pages had solid technical SEO (metadata, sitemap,
JSON-LD `WebPage`/`BreadcrumbList`/`FAQPage`) but no price anywhere — pure marketing copy.
The live `/destinations?country=XX` view (client-rendered) had real prices but no
structured data at all. Google penalizes structured data that doesn't match visible page
content, so Product/Offer schema couldn't just be bolted onto the static pages as-is.

## What was done
- New `src/lib/destinationPricing.ts`: `getDestinationOffer(slug)` fetches
  `/api/packages` server-side (`next: { revalidate: 3600 }`) and returns the lowest price
  for that destination, or `null` if no packages match (page renders with no
  badge/schema rather than a fabricated price).
- `src/lib/seo.ts`: new `createOfferProductJsonLd` (Product + AggregateOffer node) and an
  optional `offer` param on `createContentPageJsonLd` that appends it to the page's
  `@graph`.
- `src/app/SeoContentPage.tsx` / `destinations/[slug]/page.tsx`: fetch the offer server-side,
  render a visible "eSIM plans from €X.XX" badge in the hero, pass it into the JSON-LD.
- `src/app/destinations/DestinationPlans.tsx` (the live `?country=XX` view): compute the
  same low price from the already-loaded client package list and render a matching
  `Product`/`AggregateOffer` `<JsonLd>` node — no extra fetch needed there.

## How it was done
Curled the live `/api/packages` endpoint directly rather than assuming its shape, and
found two wrong assumptions from the initial design: `countryCode` is a slugified country
name (`united-states`, `europe`), not an ISO code, and prices are EUR, not USD. Also
discovered there's no `region` field — `europe` is just another `countryCode` value with
its own real regional-plan packages, so the "europe" destination page didn't need any
aggregation logic across country pages, just a slug lookup like every other destination
(see f065 in `feedAI/facts.jsonl`).

## Outcome
`tsc --noEmit` clean. `pnpm build` succeeds; `/destinations/[slug]` is SSG with 1h
ISR revalidation as intended. Verified against the built HTML output for several slugs
(usa, europe, japan, uk, uae, switzerland, indonesia) that both the visible price badge
and the `Product`/`AggregateOffer` JSON-LD node contain real, matching prices pulled from
the live backend at build time.
