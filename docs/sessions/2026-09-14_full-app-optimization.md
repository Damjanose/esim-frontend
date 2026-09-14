---
date: 2026-09-14
tags: [performance, api, config, ui, deps]
status: complete
---

# Session: full-app-optimization

## What existed before
The web app defaulted to the hosted backend during local development, the browser catalog ignored the backend's 60-second cache headers, and the homepage could request the same catalog through several independent client effects.

## What was done
- Added the local `BACKEND_API_URL` development override and corrected the `.env.example` wording.
- Added 60-second revalidation and public stale-while-revalidate headers to the public package BFF routes.
- Added one-minute browser in-flight/memory deduplication for package and package-group requests.
- Deferred the Help Me Choose wizard bundle and split the mobile navbar menu into a small client island.
- Added flag CDN support, immutable cache headers for stable logo assets, explicit optimized images, route loading skeletons, and removed unused large assets/dependency.
- Added countries-only catalog coverage regression coverage.

## How it was done
The optimized backend branch was run locally on port 4000. The web frontend was verified at `http://localhost:3000`; the homepage loaded live catalog data and made one request each to `/bff/packages` and `/bff/packages/groups`.

## Outcome
Public catalog requests now honor the backend cache contract while authenticated paths remain uncached. Local API routing is explicit and production remains the fallback when no environment override is present.
