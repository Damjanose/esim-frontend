# 2026-10-14 · GEO re-audit, answer-first hero, /esim aliases

**Focus:** web

## Why
A `/seo geo` re-audit of the live site (score ~63/100, was ~55 on 10-08; the full report is in docs/GEO-ANALYSIS.md) found two small code gaps:
- The best quotable sentence on each destination page ("Does eSIM2you work in the USA? Yes… 27 plans from €4.00…") sat in the FAQ at ~80% page depth.
- `/esim/united-states`, `/esim/united-kingdom` and `/esim/great-britain` returned 404.

## What changed
- `src/app/EsimDestinationPage.tsx`: the `destinationAnswerFaq` answer renders in the hero (h2 + paragraph, `data-answer-first`) between the price line and the intro. The FAQPage JSON-LD still leads with it, and the visible FAQ list now maps `page.faqs` so the sentence isn't repeated. f281.
- `esimAliasPath()` in `src/lib/esim-routes.ts` plus a call in middleware after the lowercase step: guessable country names 308 to the real slug in one hop. Added `britain` and `england` to the aliases. f282.
- docs/GEO-ANALYSIS.md: rewritten as the 10-14 re-audit, with the 10-08 audit kept below it.

## Verified
- Tests written first and seen failing. Then `pnpm test`: 121 files / 962 tests pass. `tsc --noEmit` is clean.
- Temporary `next dev -p 3077`:
  - `/esim/united-states` → 308 `/esim/usa`, `/esim/England` → 308 `/esim/uk`, `/esim/hungary` still 404.
  - The /esim/usa raw HTML has the answer block before the intro.
  - Headless Chrome screenshots at 1280 and 390 look right (the 390 capture clips at the right edge for the existing price pill too, which is a capture artifact).

## Open (from the GEO report)
- Off-site mentions and reviews.
- Rewriting the thin guides (US/UK/Europe first).
- Per-plan carrier and hotspot answers (needs backend Airalo fields).
- Price index key findings in USD/GBP.
- appsapk.com hosts an unofficial "eSim2you APK".
