---
date: 2026-09-01
tags: [destinations, packages]
status: complete
---

# Session: destination_rails_and_wizard

## What existed before
`/destinations` with no `?country=` param showed only static SEO guide cards
(`content/seo-pages.ts`) — no live grouped browsing. `HeroPackageSearch`'s
autocomplete was the only live-data destination picker, and it only surfaced
a flat "popular" slice via client-side dedup, not backend-curated categories.
Backend design: `docs/superpowers/specs/2026-08-31-package-grouping-and-wizard-design.md`
(written in `E-SIM backend`'s sibling repo, applies across both). This work
targets the web frontend only, per explicit instruction — not the
`velocity-eSim` mobile app.

## What was done
- `src/app/bff/packages/groups/route.ts` — proxies the backend's new
  `GET /api/packages/groups` (branch `feature/package-groups-api` in
  `E-SIM backend`), same shape as the existing `bff/packages` proxy.
- `src/services/packages.ts` — added `fetchPackageGroups()` +
  `mapPackageGroupsPayload()`, reusing `mapPackagesPayload()` per rail so a
  rail package and a flat-list package are mapped identically.
- `src/services/destinationFilters.ts` (new) — pure filter logic
  (`matchesDestinationFilters`, `parseDestinationFiltersFromParams`,
  `wizardFiltersToQueryParams`) so the wizard's answers and the grid's
  filtering share one implementation, round-tripped through URL query params
  (`daysMin`/`daysMax`/`dataMin`/`dataMax`/`unlimited`) rather than client
  state, so a filtered `/destinations` URL is shareable/bookmarkable.
- `src/app/destinations/DestinationBrowse.tsx` (new, client component) —
  renders 4 rails (Popular/Best value/Unlimited/Long stay, from
  `fetchPackageGroups()`, hidden individually when empty) above a live,
  searchable "All destinations" grid (from `fetchPackageOptions()`, filtered
  by any wizard-set URL params). Rails always show the full unfiltered
  backend curation regardless of grid filters.
- `src/app/destinations/HelpMeChooseWizard.tsx` (new, client component) — 3
  skippable steps, Days → Data → Destination. Days: `7/15/30/Custom`
  (custom bounded 1–90). Data: `1–3GB / 5–10GB / 20GB+ / Unlimited`. Picking a
  destination navigates straight to `/destinations?country=`; finishing (or
  skipping) the filter steps navigates to `/destinations?<query params>`.
- Wired into `src/app/destinations/page.tsx`: added
  `<DestinationBrowse urlFilters={...} />` between the existing marketing
  hero and the existing static guides grid (both untouched), reading the new
  optional `daysMin`/`daysMax`/`dataMin`/`dataMax`/`unlimited` search params
  alongside the existing `country` one.
- Tests: `src/services/packages.test.ts` (3), `src/services/destinationFilters.test.ts`
  (13) — all pure-function coverage for the mapping/filter/query-param logic.

## How it was done
Branch `feature/marketplace-rails`. Verified against the real local backend
(`feature/package-groups-api` branch, `pnpm dev` on :4000, live Airalo data)
rather than mocks alone: ran both dev servers, drove `/destinations` in a
real browser — confirmed all 4 rails render with distinct destinations, the
"Help me choose" wizard's 3 steps work end-to-end (30 days + 20GB+ → grid
narrowed live from 215 to 131 destinations, URL carried the query params),
and the existing per-country `DestinationPlans` page still works unchanged.

## Outcome
`pnpm exec tsc --noEmit` clean, `pnpm build` succeeds (`/destinations` route
compiles, `/bff/packages/groups` present), `pnpm exec vitest run` — all 262
tests pass (16 of them new: 3 in `packages.test.ts`, 13 in
`destinationFilters.test.ts`), no regressions. Browser-verified live
against real Airalo data end to end. Follow-up (not done here, per rollout
plan in the design spec): none required on the web frontend — the mobile app
(`velocity-eSim`) was explicitly out of scope for this pass.
