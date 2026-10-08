---
date: 2026-10-08
tags: [seo, robots, sitemap, search-console, internal-links]
status: complete (not deployed)
---

# Session: GSC page-indexing cleanup

## What existed before

GSC (8 Oct): 60 indexed, 79 not indexed. 69 were "Excluded by noindex": 34 `/checkout?package=`, 33 `/signin?next=/checkout?package=`, `/profile` and `/destinations?country=albania`. Plan CTAs were plain links, robots.txt disallowed the same routes that send noindex, and the 404 page carried the homepage canonical.

## What was done

1. `rel="nofollow"` on links into private routes (`crawlRel` in `src/lib/robots-policy.ts`): plan Buy now, dock /account + /profile, navbar /profile + /signin, /partners/request (navbar, phone menu, footer, homepage), trip-plan sign-in, unknown-country browse tiles.
2. robots.txt now only blocks `/api`, `/admin`, `/auth`, `/bff`, `/cdn-cgi/`. Middleware sends `X-Robots-Tag: noindex, nofollow` on private HTML routes and their signin redirects.
3. Known `/destinations?country=` values get a real 308 to `/esim/<slug>` in middleware. The page-level `permanentRedirect` was a 200 + meta refresh because `destinations/loading.tsx` streams the route. **Deviation from the brief:** unknown countries (e.g. `kenya`) are *not* redirected to `/destinations`. That view is the only web purchase path for ~170 countries, so it stays, noindex with no canonical, with nofollow links. The Expo app never links to this pattern (its App Links cover only `/checkout`, `/pkg/`, `/esim/id/`).
4. Legacy redirects were already permanent (`next.config.mjs` `permanent: true` = 308, trailing slash 308 in middleware). No `/guides/` or `/destinations/<slug>` links remain in code, sitemap or llms.txt.
5. Root layout no longer leaks canonical/robots into 404s. Uppercase `/esim|/travel|/use-cases|/compare/<slug>` 308s to lowercase.
6. `src/lib/internal-links.ts`: related destinations (neighbours, regional hub, region members) and guides (buying guide per region/country, setup guides, guide topic graph). Croatia, best-esim-europe-travel, esim-compatible-phones and keep-your-number now have 16-34 in-content inbound links each.
7. `src/lib/content-dates.ts` replaces the single `seoContentUpdatedAt` with per-path dates taken from git history.

## Verification

`pnpm test` 114 files / 876 tests passing. `tsc --noEmit` clean apart from stale `.next/types` for the removed `bulk-profit` route. `next build` passed in a scratch copy, since the owner's dev server was running from this repo on :3100. curl against :3100 checked robots.txt, the 308s, X-Robots-Tag, the 404 head and rendered nofollow links. No lint step: the repo has no ESLint config or `lint` script.

## Follow-ups

After deploy: resubmit the sitemap, and inspect `/esim/croatia` and the three new `/travel` pages in URL Inspection. The noindex bucket will shrink slowly as Google recrawls. Don't "validate fix" on it.
