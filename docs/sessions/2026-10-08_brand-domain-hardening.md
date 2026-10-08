# 2026-10-08: Brand domain hardening

## Problem
Typing or searching "esim2you" landed people on `esim2you.com` (a STRATO "domain reserved" placeholder, not ours) or `www.esim2me.com` (a competitor). Nothing in our code links there. The cause is that the brand and the host (`esim.uplisoft.com`) don't match.

## Changes
- `src/lib/site-host.ts` (new): the one place the canonical host lives. `NEXT_PUBLIC_SITE_HOST` (default `esim.uplisoft.com`) and `NEXT_PUBLIC_SITE_ALIAS_HOSTS`. Aliases are the bare and www forms of the default host, `esim2you.com` and any configured hosts.
- `src/middleware.ts`: every alias host now 308s to `https://<canonical>`, keeping the path and query. This replaced the www-only check. `.well-known/` is excluded from the matcher so AASA and assetlinks never redirect.
- `src/lib/seo.ts`: `siteUrl` now comes from site-host. WebSite and Organization JSON-LD got `alternateName`, and Organization `sameAs` got the App Store and Play listings.
- `src/app/xerrors/page.tsx` and `scripts/ping-indexnow.mjs` stopped hardcoding the host.
- `.env.example` documents the new vars. `docs/runbooks/brand-domain-migration.md` covers getting the domain, the manual brand-signal steps and the full move checklist.
- Tests: `site-host.test.ts`, brand-domain cases in `middleware.test.ts`, an alternateName/sameAs test in `seo.test.ts`, and an updated source assertion in `seo-routes.test.ts`.

## Round 2: brand entity (same day)
- Normalized `eSim2you` → `eSIM2you` across src/ and public/ (69 files, tests included). A "brand spelling" test in `seo.test.ts` guards it. `alternateName` was trimmed to `["esim2you"]`.
- Organization schema: added `description` (`brandDescription`) and a `contactPoint`.
- New `/about` (AboutPage) and `/contact` (ContactPage) pages, added to the sitemap, footer and `llms.txt`. `createWebPageJsonLd` takes a `pageType`. `content-dates.ts` dates them 2026-10-08, which moved the static sitemap lastmod.
- `next.config.mjs` 308s `/esim`, `/blog`, `/blog/:slug`, `/how-esim-works` and `/esim-compatible-devices` to the existing hubs and guides rather than adding duplicate pages.
- `docs/brand-outreach-kit.md`: fixed brand facts, where to get mentions, anchor text, keyword order, and no eSIM2Me targeting.
- Checked on a temporary dev server (:3005): /about and /contact return 200 with the right H1 and schema, and all 5 redirects return 308.
- Not done (other repos): the mobile app has 299 `eSim2you` strings and the backend emails have 63.

## Verification
`pnpm exec vitest run` passes. `tsc` shows only stale `.next/types` errors for a removed bulk-profit route, which this change didn't cause.

## Open / owner actions
- Buy or claim `esim2you.com` (or a fallback), then follow part C of the runbook.
- Set the GSC and Bing verification env vars, link the site from the store listings and social bios, and settle on one brand spelling (eSIM2you vs eSim2you).

## Round 3: answer-first copy (same day)
- Homepage H1 is brand-led ("eSIM2you: travel eSIMs for 200+ destinations"), and the old headline became the subtext. The title and description were updated in page.tsx, layout.tsx and indexableRoutes (f271, commit 09a0ca2).
- `src/lib/destination-answer.ts`: every /esim page with live plans now leads its FAQ and its FAQPage schema with "Does eSIM2you work in <country>?". The answer is built only from the rendered plans (count, from-price, validity range). There are no carrier claims, because `network` is a speed label with a "4G/5G" fallback (f272).
- The homepage FAQ now opens with "What is eSIM2you?".
- Checked on a temporary dev server against the prod catalog: /esim/albania reads "12 … plans … from €4.00, valid 3 to 30 days".
- Still open: the backend email brand pass, and the domain cutover once esim2you.com DNS (STRATO nameservers) points at the server.
