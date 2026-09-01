---
date: 2026-09-01
tags: [public-content-pages, routing]
status: complete
---

# Session: homepage_error_handling_and_auto_wizard

## What existed before
Follow-up to the same-day [Homepage redesign](./2026-09-01_homepage_redesign.md)
session, on the same branch (`feature/homepage-redesign`). User reported
(after browser-testing the committed redesign live): (1) every destination
list on `/` and `/destinations` appeared empty, and the wizard's country
search returned "No destination found" for real country names; (2) a design
request to have the "Help me choose" wizard open automatically on homepage
load instead of requiring a button click.

## What was done
- **Diagnosed the empty-lists bug**: not a code bug. The local backend dev
  server (`E-SIM backend`, `feature/package-groups-api`) had been stopped at
  the end of the prior session and never restarted; `GET /bff/packages/groups`
  was 502ing because the BFF couldn't reach it. A stale orphaned `next dev`
  process on :3000 from an even earlier session compounded the confusion by
  still answering with the same symptom after the backend came back up.
  Fixed by restarting the backend and replacing the stale frontend process
  with a fresh one. Documented as a troubleshooting entry
  (`feedAI/topics/troubleshooting.json`) so a future session recognizes this
  symptom shape immediately.
- **Added graceful error/retry UI** so a real fetch failure is never confused
  with a genuinely-empty result again: `DestinationBrowse.tsx` gained a
  `loadError` state (set in the fetch's `catch`) rendering a distinct panel
  ("Destinations couldn't be loaded" + a "Try again" button that re-runs the
  effect via a `retryCount` bump); `HeroDestinationChips.tsx` gained the same
  pattern, scaled down to a small inline retry pill appropriate for its size.
- **Wizard auto-open**: `DestinationBrowse` gained an `autoOpenWizard` prop
  (default `false`) that seeds `wizardOpen`'s initial state instead of always
  starting closed. `page.tsx` passes `autoOpenWizard` so the homepage opens
  the wizard immediately on load; `/destinations/page.tsx` doesn't pass it,
  so its button-only behavior is unchanged. No conflicting on-load modal
  exists elsewhere on the homepage (checked before making the change).
- New test file `src/app/destinations/destinationBrowse-wiring.test.ts`
  (source-string assertions, matching this repo's existing no-RTL testing
  pattern) covering the error-UI presence and the `autoOpenWizard` wiring on
  both pages.

## How it was done
Same branch as the redesign commit, follow-up commit. Verified live in a
real browser against the restarted local backend: reproduced the exact
"France" search failure from the bug report, confirmed it now resolves;
confirmed the wizard auto-opens on `/` over a dimmed non-blocking backdrop
with the button still present to reopen it; confirmed `/destinations` still
requires the button (no auto-open there).

## Outcome (first pass)
`pnpm exec tsc --noEmit` clean, `pnpm exec vitest run` — 268/268 pass (5
new), `pnpm build` succeeds. Browser-verified live: rails, grid, and wizard
destination search all populated with real data again; auto-open wizard
confirmed on `/` only.

## Follow-up: real race condition in the auto-open, not just dev-env flakiness
User reported live (twice) that the wizard's destination search still
returned "No destination found" for real country names ("France"), and asked
for a 2-second delay + welcome animation before the wizard auto-opens.

Both times traced back to the backend dev server being down again — I'd
killed it during cleanup at the end of my own verification and never
restarted it before the next turn, so `GET /bff/packages/groups`/`/packages`
502'd again (same root cause as the first pass, recurring because I kept
tearing my own verification servers down). Fixed the immediate instance by
restarting both dev servers, and — per the user's explicit choice — **left
them running this time** instead of killing them at the end of the turn, so
repeated live checks between turns don't keep hitting this.

But the auto-open design itself also had a real, code-level race: `wizardOpen`
was seeded straight from `autoOpenWizard` (`useState(autoOpenWizard)`), so on
a slow connection the wizard could render before `fetchPackageOptions()`
resolved, handing `HelpMeChooseWizard` an empty `countries` array — any
search would show "No destination found" regardless of the backend's actual
health, purely from timing. Fixed together with the animation request:

- Added `WizardWelcomeIntro.tsx` — a branded splash (icon, headline, three
  pulsing dots) shown via a new `showWelcome` state, styled like the wizard's
  own modal chrome.
- `DestinationBrowse` no longer opens the wizard immediately on
  `autoOpenWizard`. It shows the welcome intro instead, and two effects gate
  the actual `setWizardOpen(true)`: one starts a `WELCOME_MIN_DELAY_MS`
  (2000ms) timer, the other only flips from welcome to wizard once **both**
  that timer has fired **and** the data fetch has settled (`!loading`) — so
  a slow fetch extends the welcome screen rather than the wizard opening
  with no data. If the fetch ends in `loadError`, the welcome intro is
  dismissed without opening the wizard at all (a broken wizard is worse than
  none — the existing error/retry panel handles that case instead).
- The manual "Help me choose" button also gained `disabled={loading}`,
  closing the same race for the (much narrower) window where someone clicks
  it before the initial fetch resolves.
- New keyframe `welcome-fade-scale` in `globals.css` for the intro's
  entrance; the pulsing dots reuse Tailwind's built-in `animate-pulse` with
  staggered `animationDelay`.
- Extended `destinationBrowse-wiring.test.ts` with source-string assertions
  for the gating logic (same no-RTL pattern as the rest of the repo).

Verified live in a real browser via `browser_batch` (navigate + immediate
screenshot in one round trip, since a two-step navigate-then-screenshot
consistently missed the 2s window): the welcome intro renders correctly,
transitions into a wizard whose step 3 now returns real matches ("France"
found), and `/destinations` remains unaffected (button-only, no welcome
intro since it never sets `autoOpenWizard`).

## Outcome (final)
`pnpm exec tsc --noEmit` clean, `pnpm exec vitest run` — 269/269 pass,
`pnpm build` succeeds. Dev servers (backend on :4000, frontend on :3000,
`BACKEND_API_URL=http://127.0.0.1:4000/api`) left running after this session
at the user's request, rather than torn down.
