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

## Verification
`pnpm exec vitest run` passes. `tsc` shows only stale `.next/types` errors for a removed bulk-profit route, which this change didn't cause.

## Open / owner actions
- Buy or claim `esim2you.com` (or a fallback), then follow part C of the runbook.
- Set the GSC and Bing verification env vars, link the site from the store listings and social bios, and settle on one brand spelling (eSIM2you vs eSim2you).
