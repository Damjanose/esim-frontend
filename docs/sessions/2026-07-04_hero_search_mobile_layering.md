---
date: 2026-07-04
tags: [frontend, search, mobile]
status: complete
---

# Session: hero-search-mobile-layering

## What existed before

On mobile, the landing page hero package results panel opened below the search form but could be painted underneath the hero device mockup. This made the "Matching packages" panel appear tucked behind the phone preview.

## What was done

- Raised the hero copy/search column above the device mockup with an explicit stacking layer.
- Kept the hero device mockup in a lower positioned layer.
- Raised the search component and dropdown z-index values so the package results panel remains on top while open.
- Added a regression check to `src/app/hero-package-search.test.ts` for the stacking classes.

## Outcome

The mobile search results panel now appears above the hero device image/card when it overlaps the lower hero area.

## Verification

- `pnpm test src/app/hero-package-search.test.ts`
- `pnpm build`
- Mobile viewport browser check at `http://127.0.0.1:3001` with `alhan` entered in the hero search.
