---
date: 2026-07-02
tags: [frontend, packages, search]
status: complete
---

# Session: hero-package-api-search

## What existed before

The landing page hero search used static destination entries from `src/content/landing.ts`. Searching for a destination could show "No packages found" even when provider-backed packages existed in the backend API.

## What was done

- Added `src/services/packages.ts` to fetch package options for the hero search and normalize backend package data into display rows.
- Added `src/app/api/packages/route.ts` as a same-origin Next.js proxy to the backend `/api/packages` endpoint.
- Updated `src/app/HeroPackageSearch.tsx` to remove static package matching and show API-backed popular/matching package options.
- Updated `src/app/hero-package-search.test.ts` so the contract guards against returning to static landing destinations.

## Outcome

The hero package dropdown now depends on backend package data, matching the Marketplace package direction from the mobile app. When the package API is unavailable, the dropdown shows a clear unavailable state instead of stale static options.

## Verification

- `pnpm test src/app/hero-package-search.test.ts`
- `pnpm build`
- Browser smoke test at `http://127.0.0.1:3000`: entering `aln` opened the "Matching packages" dropdown. The local backend was unavailable during the smoke test, so the dropdown showed the API-unavailable message and `/api/packages` returned 502.
