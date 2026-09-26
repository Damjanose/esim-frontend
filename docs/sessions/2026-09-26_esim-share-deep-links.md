# Session: eSIM share deep links (web side)

Focus: **web**. Date: 2026-09-26.

## What existed before
`/.well-known/apple-app-site-association` and `/assetlinks.json` (via `src/lib/app-links.ts`)
claimed only `/pkg/*` and `/checkout?package=` for the mobile app. `/esim/[slug]` is the
destination-marketing route. There was no shared-eSIM concept on the web.

## What was done
- `src/lib/app-links.ts`: added `ESIM_LINK_PREFIX = "/esim/id"` and included `/esim/id/*` in the
  AASA `components` and `paths`. Added `appSchemeUrlForEsim()` / `androidIntentUrlForEsim()`
  mirroring the package helpers. `assetlinks.json` is path-agnostic (`handle_all_urls`) so it was
  left unchanged.
- New route `src/app/esim/id/[esimId]/page.tsx` (`indexable:false`) + client
  `OpenEsimAppActions.tsx`. The server component fetches the PUBLIC backend read
  `GET /api/shared-esim/{token}` via `backendFetch` and renders a **redacted** summary
  (coverage/data/validity/status) plus open-in-app / store-download actions and a
  "Get your own eSIM" link. On an unknown/revoked token it shows a friendly "link isn't available"
  state. The full detail (with the install QR) never appears here.
- Updated `src/lib/app-links.test.ts`: AASA now expects `/esim/id/*`, plus coverage for the eSIM
  scheme/intent helpers.

## Why `/esim/id/{token}` (two segments)
`/esim/{slug}` is a single-segment dynamic marketing route; you cannot add a second dynamic name
(`[id]`) at the same level, and claiming `/esim/*` for App Links would capture every marketing
link. `/esim/id/{token}` is a deeper path with a literal `id` segment, so it coexists with
`/esim/[slug]` and the app claims only `/esim/id/*`.

## Outcome
`tsc` clean; the full web vitest suite passes (535). Deploy note: the AASA change must ship before
iOS re-verifies universal links; confirm `/.well-known/*` still return `application/json`, 200, no
redirect on the canonical https host (middleware only redirects www/http/trailing-slash).
