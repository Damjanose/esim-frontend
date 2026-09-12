---
date: 2026-09-12
tags: [seo, structured-data, destinations, travel, compare]
status: complete
---

# Session: SEO product snippets and ranking slice

## What changed

- Removed unsupported homepage review, star-rating, and millions-of-travelers claims. The homepage now uses factual signals: destination coverage, live plan prices, installation timing, and support.
- Product/AggregateOffer JSON-LD now contains a real `highPrice` computed from the same live package catalog as `lowPrice`, plus the existing OG image. The visible destination price badge shows the same range and count.
- Added unique content for the ten priority countries through destination enhancement sections.
- Added Netherlands, Austria, Balkans, Middle East, Africa, and South America SEO destination routes. Their live tables can show an unavailable state when no matching package exists rather than fabricating availability.
- Added four factual comparison pages (Yesim, Holafly, Ubigi, Roamless) and six travel guides covering data needs, Wi-Fi, dual SIM, pre-flight activation, connection troubleshooting, and Europe plan selection.
- Updated content tests for the expanded sitemap/source counts and added Product schema coverage.

## Verification

- `pnpm test`: 62 files / 489 tests passed.
- Browser-checked homepage, `/esim/albania`, `/esim/balkans`, `/compare/holafly-vs-esim2you`, `/travel/how-much-data-when-traveling`, and all three sitemap segments.
- Browser CDP confirmed Albania Product JSON-LD includes `lowPrice`, `highPrice`, `offerCount`, and `image`, with no fabricated `review` or `aggregateRating`.
- `pnpm exec tsc --noEmit` encountered stale generated `.next/types` references to deleted legacy `/destinations/[slug]` and `/guides/[slug]` route files; rerun after a clean Next build.

## Search Console follow-up

After deployment, submit or re-submit `/sitemap.xml`, inspect representative `/esim/*` URLs, and run the Rich Results Test. Keep `aggregateRating` and `review` absent until genuine, visible, attributable customer review data exists.
