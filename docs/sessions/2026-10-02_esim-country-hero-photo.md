# /esim/[slug]: country photo in the hero

**Date:** 2026-10-02 · **Focus:** web

## Ask
`/esim/france` (and every country page) should show the country's image in the hero, not the generic mountain photo.

## What changed
- `src/lib/destinationMedia.ts` (new): `getDestinationMedia(slug, countryName)` calls the backend's
  `/packages/destinations/<code>/media` (same CountryMedia cache `/bff/country-image` proxies), cached 24h, null on any miss.
- `src/app/esim/[slug]/page.tsx`: fetches the media in the existing `Promise.all`; passes `heroImage` only for
  single-country pages (regional pages have `coverage`, and the backend maps e.g. `europe` → Paris).
- `src/app/EsimDestinationPage.tsx`: banner `<Image>` uses `heroImage.imageUrl` (alt from the backend, `unoptimized`
  only for non-allowlisted hosts) with `/images/mountain.webp` as the fallback; adds the Wikimedia credit.
- `seo-content-page.test.ts` assertion updated.

## Verified
- `/esim/france` SSR HTML: Paris photo as the `fetchPriority="high"` image, optimizer returns 200 image/jpeg; credit shown.
- `/esim/balkans`: still mountain.webp.
- `tsc --noEmit` clean, `pnpm test` 811/811.

Fact: f252.
