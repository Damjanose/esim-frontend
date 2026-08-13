# Production redirects pointed at localhost

**Date:** 2026-08-13

## Problem

On `https://esim.uplisoft.com/`, navigating to `/profile` landed the visitor on
`localhost`. Reproduced against production before touching anything:

```
$ curl -sSI https://esim.uplisoft.com/profile
HTTP/2 307
location: https://localhost:3020/signin?next=%2Fprofile
```

`/account` did the same. Any signed-out visitor clicking a guarded link got a
dead URL only the server itself can resolve.

## Cause

`update.sh` runs Next on `127.0.0.1:3020` behind nginx. Next resolves
`request.nextUrl` from the address the server listens on, not from the `Host`
header, so inside middleware `url.origin` is `https://localhost:3020`.

`src/middleware.ts` built its guard redirect with
`NextResponse.redirect(new URL(guarded, url.origin))` — so the internal address
went out in the `Location` header.

This is the exact hazard `src/lib/public-origin.ts` was written for, and the
payment return routes already used `getPublicOrigin`. Middleware and
`/api/auth/refresh` were the two places that never got it. Confirmed by
contrast in production — `/checkout/return`, which does use it, answers with
`location: https://esim.uplisoft.com/checkout/failed?...`.

## Change

- `src/middleware.ts` — builds one `URL` from `getPublicOrigin(request)` up
  front and does all canonicalisation on it, so the www→apex, http→https,
  trailing-slash and guard redirects are all emitted on the public origin. The
  www/protocol branches now test the resolved URL instead of re-reading the
  headers themselves.
- `src/app/api/auth/refresh/route.ts` — same fix; it had the same bug via
  `new URL(request.url).origin`, and it is on this very path (an expired access
  token on `/profile` bounces through it).
- `src/middleware.test.ts` (new, 7 tests) — drives the middleware with a
  request whose URL is `https://localhost:3020` and whose `Host` is
  `esim.uplisoft.com`, i.e. what nginx actually delivers. Three of them failed
  before the fix with the production string `https://localhost:3020/signin?...`.
- `src/app/api/auth/refresh-route.test.ts` — two proxied cases added.
- `src/app/seo-routes.test.ts` — the canonical-redirect test asserted on
  middleware *source text* and looked for `request.headers.get(
  "x-forwarded-proto")`, which now lives inside `getPublicOrigin`. Repointed at
  `getPublicOrigin(request)`; the behaviour it guards is covered properly by the
  new middleware tests.

## Verification

`pnpm exec tsc --noEmit` clean, `pnpm build` clean. `pnpm test`: 221 pass, 4
fail — all four (`landing.test.ts` ×3, `hero-package-search.test.ts` ×1) fail
identically on a stashed tree and are unrelated to this change.

Then against a real `pnpm build && pnpm start -p 3020`, replaying nginx's
headers:

```
$ curl -sSI http://127.0.0.1:3020/profile \
    -H 'Host: esim.uplisoft.com' -H 'X-Forwarded-Proto: https'
HTTP/1.1 307
location: https://esim.uplisoft.com/signin?next=%2Fprofile
```

Local dev with no proxy headers still redirects normally (`/signin?next=...`).

## Second production bug — nginx swallows `/api` (fixed by moving the web routes)

nginx proxies **everything** under `/api/*` to the Express backend, so no Next
route handler under `src/app/api/` is reachable in production:

```
$ curl -sS https://esim.uplisoft.com/api/auth/refresh?next=%2Fprofile
<pre>Cannot GET /api/auth/refresh</pre>          # Express, not Next

$ curl -sS -X POST https://esim.uplisoft.com/api/auth/signout
<pre>Cannot POST /api/auth/signout</pre>

$ curl -sS https://esim.uplisoft.com/api/zzz-nonexistent
<pre>Cannot GET /api/zzz-nonexistent</pre>       # the whole prefix, not per-route
```

Consequences: `fetchForPage`'s recovery hop (`src/lib/server-session.ts`) hits a
404 instead of rotating the session, so a signed-in visitor with an expired
access token gets an Express error page on `/profile`. Same for the browser
calls in `SignOutButton`, `PayButton`, `TopUpPanel`, `BillingForm`,
`LinkedProviders`, `LinkEmailStep`, `DeleteAccountCard` and the `/xloginy` and
`/xerrors` admin pages — except where the backend happens to expose the same
path (`/api/user/account` answers 401, so some do).

### Why nginx was *not* the thing to change

The obvious fix — point `/api` at Next — breaks every installed copy of the
mobile app. `velocity-eSim/.env` sets
`EXPO_PUBLIC_API_URL=https://esim.uplisoft.com/api`, and `app.config.ts` bakes
it into the JS bundle at build time, so the shipped iOS build has that origin
compiled in. It is also the only public host the backend has
(`api.uplisoft.com` does not resolve), and it serves mobile-only paths that
Next has no equivalent for:

```
$ curl -sS -o /dev/null -w '%{http_code}\n' https://esim.uplisoft.com/api/esim/countries   # 200
$ curl -sS -o /dev/null -w '%{http_code}\n' https://esim.uplisoft.com/api/orders           # 401
```

A per-path carve-out is not possible either: the Next handlers deliberately
*mirror* the backend's paths (`/api/auth/otp/send` exists on both). They are a
BFF — the browser holds httpOnly cookies, the backend wants a bearer token, and
the Next handler is what swaps one for the other. nginx cannot tell the two
apart by path.

So the collision was resolved from the other side, and nginx is untouched.

### Change: `src/app/api/**` → `src/app/bff/**`

Everything outside `/api` already reaches Next, so no server config was needed:

```
$ curl -sS https://esim.uplisoft.com/bff/probe        # Next's 404 page, not Express
```

- `git mv src/app/api src/app/bff` — all 20 route handlers.
- Every browser call site repointed: `PayButton`, `SignOutButton`, `SignInForm`,
  `SocialSignInButtons`, `LinkEmailStep`, `LinkedProviders`,
  `DeleteAccountCard`, `BillingForm`, `TopUpPanel`, `DestinationPlans`,
  `services/packages.ts`, and the `/xloginy` and `/xerrors` pages.
- `src/lib/server-session.ts` now bounces through `/bff/auth/refresh`.
- `@/app/api/user/billing-address/route` type imports repointed.
- `/bff` added to `privateRoutePrefixes` in `src/lib/seo.ts`, so it is
  `Disallow`ed in robots.txt and kept out of the sitemap. `/api` stays in the
  list too — it is still a real, non-indexable prefix, just served by Express.

`src/lib/backend.ts` is deliberately untouched: `BACKEND_API_URL` defaults to
`https://esim.uplisoft.com/api`, which is the *upstream* the BFF calls and
still resolves to Express.

Verified on a clean `pnpm build && pnpm start -p 3020` with nginx's headers
replayed — every path that returned an Express 404 in production now answers:

```
GET  /bff/auth/refresh   307 → https://esim.uplisoft.com/signin?next=%2Fprofile
POST /bff/auth/signout   200
GET  /bff/packages       200
GET  /bff/country-image  200
GET  /api/packages       404   (Next no longer claims it; nginx sends it to Express)
```

`tsc --noEmit` clean (after `rm -rf .next` — the stale generated route types
still referenced the old paths), `pnpm build` clean, same 221 tests pass.
