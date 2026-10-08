# 2026-10-08: GEO wording pass

## Goal
Act on the GEO audit (`docs/GEO-ANALYSIS.md`): use the words travelers compare plans on, show prices in the US/UK markets' currencies, and make guides more citable.

## Done
- `src/lib/exchangeRate.ts`: `getDisplayRates()` (USD and GBP from one cached `/currencies` call) and `formatEstimateRange()`. Every `/esim/[slug]` hero now shows e.g. "€4.00 to €17.50 (~$4.47–$19.58 · ~£3.38–£14.80)". Previously only `/esim/uk` had a GBP estimate. Checkout and JSON-LD stay in EUR.
- `src/content/destination-buying.ts`: a "Before you buy an eSIM for <country>" block on every destination page covering phone support, number/WhatsApp, hotspot, top-ups and refunds. It makes no claim the catalog can't back.
- `SeoContentPage`: visible "Updated <date> · By the eSIM2you team" on guides, using the same date as Article `dateModified`. Optional `table` on sections.
- `/travel/internet-abroad` rewritten from ~350 to ~950 words: options comparison table, roaming vs eSIM cost, data needs, roaming and WhatsApp sections, 5 FAQs. `content-dates.ts` bumped for it.
- Tests: exchangeRate (+7), destination-buying (new), template source tests. Two tests that pinned the old travel sitemap lastmod and the old Article date expression were updated. Full suite: 910 passing.

## Not done / follow-ups
- Per-country network names and hotspot flags: needs the backend to pass Airalo operator data through `/packages`. That's a cross-repo change.
- The plan table's Network column shows "4G/5G" on every row (it's the fallback, because `/packages` sends no network).
- Rewrite the other thin guides and use-cases the same way.
- Deploy: none of today's SEO commits are live yet (the live titles still lack the "| eSIM2you" suffix).
