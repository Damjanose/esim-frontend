# Wizard filters dropped on country pick

Date: 2026-09-01

## What changed

Picking a specific country in the "Help me choose" wizard (`HelpMeChooseWizard.tsx`)
now carries the trip-length/data-need answers from steps 1-2 through to
`/destinations?country=X`, and that page (`DestinationPlans.tsx`) applies them —
previously it showed every plan for the country regardless of what the wizard asked.

## Why

Reported by the user: opening the destination country page from the wizard showed
"all the packages for that destination" instead of just the ones matching the
filter/search criteria picked in the wizard.

## Root cause

`WizardResult`'s `"country"` variant only ever carried `countryCode`. The
`wizardFiltersToQueryParams` → `parseDestinationFiltersFromParams` →
`matchesDestinationFilters` pipeline already existed and worked, but only for the
wizard's "Skip — show all matching destinations" exit (`kind: "filters"`), which
lands on the country-less `/destinations` grid (`DestinationBrowse.tsx`). The normal
path — picking an actual country — called `router.push('/destinations?country=' +
code)` with nothing else, and `DestinationPlans.tsx` (the per-country page) had no
code path that read filter query params at all: its only filtering was a local
`filter`/`sort` UI state, reset to `"all"`/`"recommended"` on every country change.

## Fix

- `HelpMeChooseWizard.tsx`: `WizardResult`'s `"country"` variant now also carries
  `days`/`data`; `DaysAnswer`/`DataAnswer` are exported so other modules can type
  against them.
- `destinationFilters.ts`: `wizardFiltersToQueryParams` now takes a plain
  `{ days, data }` instead of a `WizardResult` with `kind: "filters"`, so both the
  `"country"` and `"filters"` branches can reuse it.
- `DestinationBrowse.tsx`: `handleWizardFinish`'s `"country"` branch now builds the
  same filter query params and sets `country` on top, instead of a bare
  `?country=` URL.
- `page.tsx`: forwards the `daysMin`/`daysMax`/`dataMin`/`dataMax`/`unlimited` params
  it already parses for `DestinationBrowse` to a new `DestinationPlans`
  `searchFilters` prop.
- `DestinationPlans.tsx`: applies `matchesDestinationFilters` (the same helper the
  all-destinations grid already used) on top of the country match, before its own
  local unlimited/fixed/short/medium/long filter+sort UI runs.

A direct `/destinations?country=X` link with no filter params in the URL is
unaffected — `parseDestinationFiltersFromParams` defaults to "no constraint" on
missing params.

## Testing

- `pnpm exec tsc --noEmit` — clean.
- `pnpm test` — 290+ passing, including updated `destinationFilters.test.ts` (the
  `wizardFiltersToQueryParams` signature change) and two new assertions in
  `destinationBrowse-wiring.test.ts` covering the new wiring.
- No component-rendering test infra in this repo (per prior sessions); not manually
  verified live in a browser in this session.

See `feedAI/facts.jsonl` (f082) and `feedAI/topics/troubleshooting.json` for the
searchable record.
