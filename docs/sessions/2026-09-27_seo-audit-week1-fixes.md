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

## Not done (deliberately)

The audit also flagged the homepage `SoftwareApplication.review` markup, which is built from approved testimonials (commit 91ff502), as self-serving. Google's self-serving review restriction covers LocalBusiness and Organization, not SoftwareApplication, and the testimonials are a deliberate feature. I left it for the owner to decide.

## Verification

- `pnpm test`: 67 files, 537 tests passing.
- `pnpm exec tsc --noEmit`: clean.

## Follow-ups

- After deploy, check that `curl https://esim.uplisoft.com/robots.txt | grep /x` returns nothing.
- After deploy, check that the three regional pages render plan rows once the 1-hour catalog cache revalidates.
- Phase 2 of the audit's ACTION-PLAN.md: visitor-based currency, mobile LCP, Offer[] schema, and About/Contact pages.
