# 2026-11-27 user analytics, Waves 2 and 3 (web)

Branch `feature/analytics`. Plan: `docs/superpowers/plans/2026-11-27-user-analytics-wave2-3.md` (workspace). Builds on the Wave 1 work in `2026-11-26_user-analytics.md`.

## What changed

- **BFF (P0-W2):** 7 more report names on `/bff/admin/insights/[report]`. New static routes for `ad-spend` (GET, POST, PUT, DELETE) and `chart-notes` (GET, POST, DELETE). Each forwards to `/admin/analytics/*`. Types from the frozen Wave 2/3 contract are in `src/lib/insights/types.ts`.
- **Pure helpers (W2-1, W2-2):** `adSpendForm.ts` (validation mirrors the backend rules; `entryToFormInput` for edit), `chartNoteForm.ts`, `notes.ts`, `campaignReturn.ts` (unknown, never 0), `opportunities.ts` (rule order, icons, tones, sample text, footer), `trend.ts` (SVG geometry), `seasons.ts`, `acquisition.ts`, `promotions.ts`, `customers.ts`, `marketingErrors.ts`.
- **Trend (W2-2):** `TrendSection` draws visitors as a line and orders as bars in SVG, with no library. Chart notes come from `useChartNotes`. Admin notes are solid, holidays dashed. The chart scrolls sideways.
- **Marketing tools (W2-3):** ad spend and chart note forms, with edit, inline delete and the friendly error messages. `marketingApi.ts` wraps the BFF calls and never throws.
- **Refresh:** the page keeps a `refreshKey`. Saves bump it, and Trend and Campaigns reload.
- **Campaigns / Promotions / Customers (W2-4):** return-on-ad-spend table and unmatched spend; promotions grouped by kind; customer tiles and cohort table.
- **Seasons / Acquisition (W2-5):** monthly order bars with notes per month; acquisition bar list and other texts.
- **Opportunities (W2-6):** cards sorted money-first, numbers tables, sample notice and the fixed footer.
- **Type change:** `useInsightsReport` now accepts `ReportName | ReportNameW2`.

## Checks

- `pnpm test` and `pnpm exec tsc --noEmit` passed at the end of each task. Full suite at W2-7: see the run below.
- `next build` not run (dev server may be running).

## Still needs a browser check

Not verified in a real browser. Check at 375 px and 1280 px:
- Trend chart: sideways scroll, and the note tooltips on hover and keyboard focus.
- Marketing forms: layout, validation messages, and the inline Delete? Yes/No confirm.
- Wide tables (campaign return, promotions, cohorts, ad-spend list): sideways scroll with the sticky header.
- Opportunity cards and their numbers tables.

facts: f375-f379.
