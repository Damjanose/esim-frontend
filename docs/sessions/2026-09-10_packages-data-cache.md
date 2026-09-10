---
date: 2026-09-10
tags: [seo, cache, destinations, docs]
status: complete
---

# Session: packages-data-cache

## What existed before

`getDestinationOffer` fetched `GET /api/packages` with `next: { revalidate: 3600 }`
so static destination pages could refresh JSON-LD “from” prices hourly. The
catalog body is ~2.7MB. Next.js data cache refuses items over 2MB, so
`pnpm build` logged:

`Failed to set Next.js data cache for https://esim.uplisoft.com/api/packages,
items over 2MB can not be cached (2702049 bytes)`

## What was done

- Fetch `/packages` with `cache: "no-store"` so the catalog is never stored in
  the Next data cache.
- Reduce it to a slim per-country offer index and wrap that in
  `unstable_cache` (1h) so destination prices still ISR.
- Set `export const revalidate = 3600` on `/destinations/[slug]`.

## How it was done

Tests in `src/lib/destinationPricing.test.ts` first; then
`src/lib/destinationPricing.ts` and the slug page.

## Verification

`pnpm exec vitest run src/lib/destinationPricing.test.ts` passed.

## Follow-ups

A smaller packages endpoint (min price per country) would avoid downloading
2.7MB on each index refresh; not required to silence the build warning.
