---
date: 2026-10-02
tags: [feature, trip-plan, bff]
focus: web
status: complete (pending signed-in smoke + nginx timeout)
---

# Session: trip-plan-web

## What existed before
Only the admin settings page `/xtripplany` (f160). The traveler trip planner was mobile-only, even though the backend `/itineraries` API covered everything.

## What was done
- Spec: `docs/superpowers/specs/2026-10-02-trip-plan-web-design.md` (full mobile parity, public `/trip-plan`, sync generation through the BFF, inline-card unlock, no backend changes).
- `/trip-plan` (public, static, sitemap, Navbar + footer link): pitch, Tirana sample plan, quota line, create form with generating overlay, Your plans / Older plans (delete only for older).
- `/trip-plan/[id]` (guarded): locked preview + unlock (free, or BillingStep + CardStep then provision), full plan with version picker, PDF download, refine.
- BFF `src/app/bff/itineraries/**` via `src/lib/tripPlan/bff.ts`; path segments validated.
- `backendFetch` `timeoutMs` (undici Agent, 600s) for generate/edit; `backendFetchBinary` returns Content-Disposition; `callWithSession` carries the backend error `code`.
- Navbar: Trip planner link; Use cases hidden below xl and Partners below 2xl so six links fit at lg. Dock hidden on `/trip-plan/<id>`.
- Tests: tripPlan logic/docView, backend timeoutMs, with-session code, route guard, dock (779 passing). `pnpm build` clean. Signed-out page, 401 and id validation checked against a local `next start`; desktop/phone screenshots reviewed.

## Not verified
- Signed-in flow end to end (generate, pay with a card, unlock, PDF, refine, versions): needs a real session.
- Production nginx: `location /` → 127.0.0.1:3020 needs `proxy_read_timeout 600s; proxy_send_timeout 600s;` or long generations 504 (plan still saves and appears in the list).

## Gotcha hit
Running `pnpm build` while the owner's `pnpm dev` was running overwrote `.next` and made the dev server return 500s; restart `pnpm dev` after a build.
