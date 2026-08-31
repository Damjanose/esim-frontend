---
date: 2026-09-01
tags: [public-content-pages, routing]
status: complete
---

# Session: homepage_redesign

## What existed before
Homepage hero was an abstract "floating stat cards + orbit rings" graphic
around a phone/map illustration (`HeroVisual`, `DestinationBubble`,
`FeatureCard`), followed by a static, non-live "Plans" marketing section
(`Short Trips` / `Longer Journeys` / `Unlimited Data` cards with hardcoded
copy, no real pricing). Design spec:
`docs/superpowers/specs/2026-09-01-homepage-redesign-design.md` (root repo),
approved after a visual-companion brainstorm comparing Airalo and MobiMatter.
Phase 1 of a multi-page redesign — later phases (Destinations detail,
Checkout, Sign-in, Profile, Support, Guides/Use-cases, Terms/Policy) are
separate future work.

## What was done
- **Hero rebuilt** (`page.tsx`): full-bleed photo (`/images/mountain.webp`,
  an existing repo asset already used in the `Cta` section — reused rather
  than sourcing a new one) replaces the abstract graphic. `HeroPackageSearch`
  now sits over the photo (its built-in trust-checklist row removed — see
  below); a new `HeroDestinationChips` client component renders a row of
  clickable popular-destination chips sourced from
  `GET /api/packages/groups`' `popular` array (same data
  `DestinationBrowse`'s "Popular destinations" rail uses).
- **Trust signals relocated, not duplicated**: `HeroPackageSearch`'s inline
  checklist ("200+ destinations / Instant activation / No roaming fees") was
  removed from `HeroPackageSearch.tsx` (only consumer was this page); the
  richer avatar-stack/star-rating/review-count block that used to be a
  separate `TravelerReviews` floating card now renders directly under the
  search pill instead, restyled for white text on the dark photo.
- **Live marketplace replaces static marketing cards**: the `Plans` section
  is deleted outright (not restyled) — `<DestinationBrowse urlFilters={{}} />`
  (the exact, unmodified component already shipped for `/destinations` on
  `feature/marketplace-rails`) is rendered directly below the Hero instead,
  giving the homepage the same live rails + full destination grid + "Help me
  choose" wizard. `/destinations` itself is untouched.
- **`Navbar` gained a `theme` prop** (`"light"` default, `"dark"` for
  homepage use): the navbar's dark-on-transparent text/icons need to flip to
  white to stay legible over the new dark hero photo. Every other page's
  `<Navbar />` call is unchanged (defaults to the original light styling).
- Added `id="plans"` to `DestinationBrowse`'s root `<section>` so the
  Navbar's existing `/#plans` link still resolves (it used to anchor to the
  now-deleted `Plans` section).
- Deleted: `HeroVisual`, `DestinationBubble`, `FeatureCard`, `Plans`,
  `TravelerReviews` (folded into the new `HeroTrustSignals`), and the
  `heroDestinations` data array — all were page.tsx-local with no other
  consumers (verified by grep before deleting).

## How it was done
Branch `feature/homepage-redesign`. Updated the two tests that hard-asserted
on the deleted structure: `hero-package-search.test.ts` (old className/hero
image assertions replaced with new ones, plus a new test asserting the old
components are gone and `DestinationBrowse` is rendered) and
`core-web-vitals.test.ts` (LCP image assertions repointed from
`hero-map-and-phone.webp`/`sizes="(max-width: 1024px) 100vw, 850px"` to
`mountain.webp`/`sizes="100vw"`). Verified against the real local backend
(same `feature/package-groups-api` setup as the prior `/destinations`
session) in a real browser: hero photo, search pill, live popular-destination
chips, and the full 215-destination rails+grid all render with live pricing;
the `/#plans` anchor scrolls to the marketplace section; rest of the page
(Benefits → Cta) renders unchanged.

## Outcome
`pnpm exec tsc --noEmit` clean, `pnpm build` succeeds (homepage bundle
shrank, 4.02kB → 3.31kB, despite adding functionality — the static Plans
cards were bigger than the reused DestinationBrowse import), `pnpm exec
vitest run` — all 263 tests pass (261 pre-existing incl. 2 updated + 2 new),
no regressions. Browser-verified live against real Airalo data.

**Known follow-up, not addressed here**: `HeroDestinationChips` and
`DestinationBrowse` each independently call `fetchPackageGroups()` on mount,
so the homepage now fires two `GET /bff/packages/groups` requests instead of
one. Not a correctness bug (each component works standalone, `cache:
"no-store"` on both), but worth sharing the fetch if a later pass touches
this area — no shared data-fetching layer exists yet for either component to
plug into without adding one.
