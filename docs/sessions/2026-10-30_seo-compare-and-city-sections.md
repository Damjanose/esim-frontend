# 2026-10-30: SEO compare hub and city sections

## What changed
- Implemented the Oct 2026 SEO content pack (source: `~/Desktop/seo-content.ts`).
- `/compare` rebuilt: new title/description (`indexableRoutes`), H1 "Compare travel eSIM plans", a live price-per-GB table for Spain, Italy, France, Germany, UK, USA, Mexico, Japan, Thailand, Europe and Asia (`comparePriceRow`), a 6-point checklist, a provider feature table linking all 8 `/compare/*-vs-esim2you` pages, FAQ + FAQPage JSON-LD and related links. Both tables scroll in focusable regions (also closes the "/compare table not keyboard-scrollable" follow-up).
- `/esim/spain`, `/esim/italy`, `/esim/mexico`: city blocks (Barcelona, Madrid, Rome, Milan, Cancun) with anchors, tips and FAQs; city FAQs added to the FAQPage schema; city-led titles with the live from-price.
- Sitemap lastmod bumped for the four pages (`content-dates.ts`).

## Validation
- New tests: `src/lib/compare-price-table.test.ts`, `src/content/city-sections.test.ts`; `content-hubs.test.ts` now asserts the new /compare structure.
- `pnpm exec tsc --noEmit` passed; full `vitest run` passed (141 files, 1096 tests).
- `next dev` on :3055 against the prod API: /compare table filled for all 11 destinations; city pages show the anchors, "start at €4.00" and FAQPage with 6/6/5 questions.

## Notes
- The /compare title is 68 characters once `brandedTitle` adds " | eSIM2you", so Google may cut the brand suffix.
- Promoting cities to `/esim/spain/barcelona` etc. is left for later, once the anchors rank.
