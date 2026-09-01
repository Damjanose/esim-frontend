---
date: 2026-09-01
tags: [public-content-pages]
status: complete
---

# Session: how_it_works_device_mockup

## What existed before
The homepage's `JourneyAndCoverage` section (`page.tsx`) had already been
restyled once earlier the same day (f075, session
`2026-09-01_journey_coverage_redesign.md`) into elevated step cards + a live
`CoverageFlagMosaic` flag grid. User flagged (via a screenshot) that the
result still "looks vibe-coded" and asked for a full redesign: drop the
"Where Will You Go Next?" coverage column entirely, and turn "How it works"
into a mock design on a real device showing the steps in simple, concrete
terms.

## What was done
Brainstormed via an HTML mockup (`.superpowers/brainstorm/how-it-works-device-mockup.html`,
not committed) instead of the browser visual companion — iterated through an
interactive-phone option and a static-fan-of-3-phones option, then refined
the chosen option (three fanned phones, one per step) through two more
passes based on screenshot feedback before landing on the final design.

- **Removed entirely**: the "Where Will You Go Next?" coverage column —
  heading, `CoverageFlagMosaic` (deleted, was only used here), the
  200+/500+/99% stat bar, and the "View All Destinations" button. No `#coverage`
  anchor references remained anywhere else in `src/`.
- **`JourneyAndCoverage` renamed to `HowItWorks`**, now a single full-width
  section: heading/subhead, three fanned phone-frame mockups (`PhoneFrame` +
  `ChoosePlanScreen`/`ScanInstallScreen`/`ConnectedScreen`), then the existing
  3 caption blocks below.
  - `ChoosePlanScreen` recreates the actual marketplace UI (a real user
    screenshot cropped as the hero-photo header, frosted search pill,
    Favorites/Countries/Popular tabs, real country rows with `FROM €x.xx`
    pricing pulled from that same screenshot, bottom nav with the shop-icon
    FAB) — not an invented generic plan list.
  - `ScanInstallScreen` shows a real, statically pre-generated QR code
    (`public/images/qr-esim-uplisoft.svg`, encodes `https://esim.uplisoft.com`)
    instead of a fake CSS QR pattern — generated once via `api.qrserver.com`
    and committed as a static asset, not hot-linked at runtime.
  - `ConnectedScreen` is a dashboard card styled after the mobile app's real
    `MyEsimsScreen`/`dashboardData.ts` copy conventions (active/expired pill,
    data-used/days-left, "eSim2you · Data plan").
  - Country/plan flags use real `flagcdn.com/w80/<code>.png` images (matching
    the site's existing `flagUri` convention elsewhere), not emoji.
- New static asset `public/images/how-it-works-marketplace.jpg` — the real
  screenshot the user supplied, used as the `ChoosePlanScreen` hero-photo
  background.
- `src/app/journey-and-coverage.test.ts` renamed to `src/app/how-it-works.test.ts`
  and rewritten for the new structure (asserts the coverage column and
  `CoverageFlagMosaic` are gone, the 3 screen components exist, and the real
  QR asset is referenced).
- Fixed one bug found during live verification: the real screenshot already
  has "Stay Connected / Anywhere" baked into it, and an early pass also drew
  that text as an HTML overlay on top, producing visibly doubled/ghosted
  text. Fix: dropped the overlay text entirely and let the photo's own
  headline show through the gradient.

## How it was done
Continuing on `feature/homepage-redesign`. Ran `pnpm exec tsc --noEmit` and
`pnpm vitest run` after each structural change; browser-verified live
(`pnpm dev`, port 3001 since 3000 was in use) with the Chrome extension,
including a zoomed-in check on the `ChoosePlanScreen` phone that caught the
overlay-text duplication bug above before calling it done.

## Outcome
`pnpm exec tsc --noEmit` clean. `pnpm vitest run` — 292/292 passing (3 in
the renamed test file). Browser-verified live at both the section level and
zoomed into each phone. Not yet committed — user asked to implement, commit
confirmation still pending per this repo's working-practices rule.
