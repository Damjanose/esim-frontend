---
date: 2026-09-27
tags: [seo, robots, destinations, bugfix]
status: complete
---

# Session: SEO audit week-1 fixes

## What existed before

The 2026-09-26 claude-seo audit of esim.uplisoft.com scored the site 64/100. The report is in the workspace root at `../esim.uplisoft.com-audit/`. It found these live problems:
- `/esim/balkans`, `/esim/middle-east` and `/esim/south-america` showed no plans.
- `/esim/ireland` and `/esim/croatia` had the H1 "eSIM for Ireland travel eSIM".
- On mobile, the `/destinations` H1 read "databefore".
- robots.txt listed every obfuscated `/x*` admin path and had a malformed `Host:` line.
- The App Store link pointed at the Armenian storefront under the legacy `velocityesim` slug.

## What was done

- Mapped `balkans` to `europe`, `middle-east` to `middle-east-and-north-africa`, and `south-america` to `latin-america` in `BACKEND_COUNTRY_CODE_BY_SLUG`. Every `europe` plan covers all Balkan countries except Kosovo, which I checked against the live `/api/packages` `countries` list.
- Added `ireland` and `croatia` to `destinationDisplay`, plus a test that every `destinationPages` slug has display data.
- Added `{" "}` before the `sm:`-only `<br>` in the `/destinations` H1.
- `robots.ts` now filters `/x*` out of `privateRoutePrefixes` and no longer emits `host`. All 10 `src/app/x*/layout.tsx` files already set `indexable:false`.
- The App Store link is now `https://apps.apple.com/app/id6768258284`, which is storefront-neutral and redirects to the visitor's own store under the current name.

## Follow-up in the same session: review markup

After the owner decided, the homepage stopped turning approved testimonials into `SoftwareApplication.review` markup. `page.tsx` now calls `createLandingJsonLd()`, and the unused `testimonialsToSiteReviews` was deleted. The visible testimonials section is unchanged. Review schema now comes only from verified third-party numbers in `src/content/reviews.ts` (f191).

## Phase 2, item 2: mobile Core Web Vitals

Measured with a local production build and Lighthouse 13 on mobile, 3 runs per page:

| Page | LCP before | LCP after | CLS before | CLS after |
|---|---|---|---|---|
| `/` | 3.76 s | 3.54 s | 0.139 | 0 |
| `/esim/usa` | 2.99 s | 2.76 s | 0 | 0 |

- Homepage hero `<Image>`: added `fetchPriority="high"`. `priority` alone emits a preload with no priority hint.
- `HeroDestinationChips`: added placeholder pills while loading. The hero vertically centers its content, so chips that appeared late shifted the search box (the whole homepage CLS).
- Footer logo: changed from a plain `<img>` of the 1024px PNG to `next/image` at 36x36.
- Rejected after measuring:
  - `experimental.inlineCss` made the `/esim/usa` HTML go from 16KB to 46KB, and its LCP got worse.
  - `fetchPriority="high"` on the faded `/esim/[slug]` background made LCP noisy and worse.
- Still open, and outside the code: Cloudflare Email Obfuscation injects a render-blocking `email-decode.min.js` on every page. Turning it off is a dashboard toggle (Scrape Shield).

## Verification

- `pnpm test`: 67 files, 540 tests passing.
- `pnpm exec tsc --noEmit`: clean.

## Follow-ups

- After deploy, check that `curl https://esim.uplisoft.com/robots.txt | grep /x` returns nothing.
- After deploy, check that the three regional pages render plan rows once the 1-hour catalog cache revalidates.
- Phase 2 of the audit's ACTION-PLAN.md: visitor-based currency, mobile LCP, Offer[] schema, and About/Contact pages.
