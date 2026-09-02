---
last_updated: 2026-09-02
---

# Project Overview — E-SIM-frontend

## What this is
Next.js 15 (App Router, React 19, TypeScript) site serving `https://esim.uplisoft.com/` — the public marketing/checkout web surface for eSim2you, plus an admin dashboard. Runs on `127.0.0.1:3020` behind host Nginx/Certbot; the root domain is reserved for this app, while `/api` on the same host routes to the separate `E-SIM backend` Express server (see root `docs/ARCHITECTURE.md`).

## Current state
- App Router structure under `src/app/`: public marketing pages (`destinations`, `destinations/[slug]`, `use-cases`, `use-cases/[slug]`, `guides`, `guides/[slug]`, `support`, `policy`, `terms`), auth (`signin`), account/purchase (`account`, `account/[orderId]`, `account/topup`, `profile`, `profile/billing`, `profile/deleted`), and `checkout` + `checkout/return` + `checkout/failed`
- Admin surfaces live under deliberately obfuscated route names, not `/admin*`: `xloginy` (admin sign-in), `xpricing` (price management), `xnotificationy`, `xerrors`, `xversion` (app version/usage report) — obfuscation is the access control, don't rename these to anything guessable
- `src/app/bff/*` is a Backend-For-Frontend layer: Next.js route handlers under `bff/auth`, `bff/payments`, `bff/user`, `bff/packages`, `bff/admin`, `bff/country-image` proxy browser requests to the `E-SIM backend` API — the browser never calls the Express backend directly
- `src/middleware.ts` handles host/protocol canonicalization (redirects `www.esim.uplisoft.com` and `http://` to the canonical `https://esim.uplisoft.com`, strips trailing slashes) and route guarding (`src/lib/route-guard.ts`) for signed-in-only pages; it resolves the public origin from forwarded headers rather than `request.nextUrl`, since production sits behind an Nginx reverse proxy on loopback
- Session cookies (`ACCESS_COOKIE`, `REFRESH_COOKIE` in `src/lib/session.ts`) are the client-side auth state; BFF routes read/refresh them rather than the page code touching backend tokens directly
- `src/content/` holds static/CMS-style content for guides and use-case pages
- `src/services/` holds client-side data-fetching/service logic consumed by pages
- Test runner is Vitest (`pnpm test`); several BFF routes and the admin dashboard have route-level tests (`*.test.ts` beside the route file, e.g. `src/app/bff/auth/auth-routes.test.ts`, `src/app/xloginy/admin-dashboard.test.ts`)
- Design reference: `docs/design/mobile-design-system.md`

## Key architectural decisions
- BFF pattern: all backend calls are proxied through `src/app/bff/*` Next.js route handlers, never called from client components directly — keeps backend base URL/credentials server-side
- Admin routes are obfuscated by unguessable path name (`x*`) rather than kept under a conventional `/admin` prefix, as a layer of access control in addition to auth
- Canonical host enforcement and trailing-slash normalization happen in `middleware.ts` before any route guard runs, so redirects always land on the canonical URL
- This repo currently has no `docs/architecture/` or `docs/decisions/` folder (see this repo's `CLAUDE.md`) — significant structural decisions live in session docs until one is warranted

## Known gaps
- No `docs/overview.md` existed for this repo until 2026-09-02 — it was omitted from the root `CLAUDE.md`'s repo list and had no session docs for 21 commits before 2026-08-19 (see `docs/sessions/INDEX.md` and `feedAI/MAINTAIN.md` history). Keep this file current the same way the other two repos' overviews are kept current.
