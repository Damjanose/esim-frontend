---
date: 2026-08-24
tags: [admin, api, routes]
status: complete
---

# Session: app-version-usage-report

## What existed before
`/xversion` had a single section: read/set the minimum required mobile app version
(`GET`/`PUT /bff/admin/app-version`). No visibility into what versions/platforms
installs were actually running.

## What was done
- New `src/app/bff/admin/app-version/report/route.ts` (GET only), same
  `backendFetch` + bearer-passthrough pattern as the existing app-version proxy.
- `/xversion/page.tsx` gained a second section below the min-version card: two
  grouped lists (Android, iOS), each `version → device count`, loaded via the new
  proxy on the same `useAdminSession` token, with its own Refresh button.
- Extended `xversion/admin-app-version.test.ts` with coverage for both additions.
- Backfilled `feedAI/topics/admin-dashboard-ui.json`'s missing entry for `/xversion`
  itself — it had shipped earlier the same day without a feedAI update.

## How it was done
Backend counts by device id (client-generated, persisted, not tied to a user
account — see the backend and velocity-eSim session logs of the same date), so this
page's report includes anonymous/signed-out installs. No nav change needed;
`/xversion`'s `AdminNav` entry already existed.

## Outcome
`pnpm test` (vitest) passes for the new/extended test file; the only failing test in
the full suite (`landing.test.ts`, a logo-asset check) is pre-existing and unrelated.
`tsc --noEmit` clean.
