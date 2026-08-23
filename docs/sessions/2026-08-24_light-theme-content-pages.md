---
date: 2026-08-24
tags: [component, styling]
status: complete
---

# Session: light-theme-content-pages

## What existed before
`/destinations`, `/destinations/DestinationPlans.tsx` (the country plan-browsing
page), and `/support` were still on the old dark theme (`bg-[#020916]` and ~150+
bespoke hex colors), while `/guides` and `/use-cases` (both rendered by
`SeoContentPage.tsx`) were already light except for one dark hero band. This
mismatched the homepage's light rebrand and was already flagged as the planned
next step in `docs/design/mobile-design-system.md` / feedAI's `phase.next`.

## What was done
- `SeoContentPage.tsx`: hero band converted from `bg-midnight` to the light
  brand system; the rest of the file's older `cyan`/`midnight`/`line`/`cloud`
  tokens swapped for the current `brandBlue`/`brandInk`/`outline`/`mist` tokens.
- `destinations/page.tsx`: fully converted (badge pill, heading, destination
  card grid) — no exceptions, this page has no photo content.
- `destinations/DestinationPlans.tsx` (1349 lines): converted the page chrome,
  toolbar, stats bar, featured/compact plan cards, loading/error/empty states.
  Deliberately left `HeroCountryImage`/`DestinationHeroImageLoader` dark — that
  card holds a real destination photo with white overlay text (same pattern as
  the homepage's photo CTA card and mobile's `CountryHero.tsx`), not a plain
  section background. Fixed an unrelated stray `x` character typo found in
  `MissingDestinationState` while in the area.
- `support/SupportPageClient.tsx` (798 lines): fully converted — no photo
  content on this page, so no dark-card exception applies anywhere.
- Followed `docs/design/mobile-design-system.md`'s Phase 2 conversion rules
  throughout (background/text/border/glow token mapping), including
  "primary CTA gradients → the shared `Button`/`LinkButton` component, not a
  hand-written gradient" — went back and replaced every hand-rolled gradient
  CTA across all four files with `Button`/`LinkButton` after finding that rule
  mid-session.

## How it was done
User confirmed via `AskUserQuestion` to do all four pages in one pass, then
separately confirmed (after seeing the size of `DestinationPlans.tsx`/
`SupportPageClient.tsx`) to take the time for full polish rather than a fast
bulk-swap pass. Worked file by file, reading each function's JSX in full before
editing, rather than blind hex-to-hex sed substitution — ~150 unique bespoke
colors in `DestinationPlans.tsx` alone meant a coloring-by-formula approach
(background/text/border/glow role, not literal hex) was necessary for a
coherent result.

## Outcome
`pnpm exec tsc --noEmit` clean, `pnpm build` succeeds, all 243 tests pass.
Not deployed yet — left uncommitted per the user's standing preference.

Known follow-up: mobile-design-system.md says to delete the old
`ink`/`midnight`/`cyan`/`aqua`/`cloud`/`line` Tailwind keys "once no file
references them any more" — `AdminNav.tsx`'s dark sidebar rail and the admin
pages' login-card gradient still intentionally use `midnight`/`ink`/`cyan`/
`aqua` (that's a separate "Cloud Premium + dark rail" design system for the
hidden admin surfaces, not the public rebrand), so those tokens should stay
until/unless the admin pages are redesigned too.
