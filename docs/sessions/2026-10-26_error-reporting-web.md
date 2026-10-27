---
date: 2026-10-26
tags: [errors, xerrors, bff, reporting]
focus: web
status: complete
---

# Session: error-reporting-web

## What was done
- /xerrors: URL-bound server-side filters, cursor pagination (25/50/100), /stats cards, detail fetch for token/trail/stack, Copy full report, public-API cURL (f307-f311, f315).
- backendFetch sends x-platform/x-client-source/x-app-version/x-request-id/x-user-email hint (f312).
- Public /bff/client-errors, src/app/error.tsx, global-error.tsx, CardStep and checkout/return reporting, ?ref on /checkout/failed (f313-f314).
- Corrected stale f044/f045/f046.

## Verification
`pnpm exec tsc --noEmit` clean; `pnpm test` 130 files / 1027 tests pass. No next build (owner dev server not running at start, but build avoided).

## Follow-ups
Pass clientUserAgent from more BFF routes; no ESLint config exists in this repo.

## Review fixes (same day, f316)
- backendFetch: per-call headers only on uncached calls (Next fetch cache key includes headers); x-user-email only printable ASCII, meta block try/catch.
- /xerrors: realFailuresOnly=false with any narrowing filter plus an Include-minor toggle; allowlists aligned with the backend (info severity, airalo/esim areas).
- /bff/client-errors: byte-capped streaming read, non-string fields dropped, behavior tests call the handler; checkout-return report wait cut to 1.2 s; /support shows ?ref.

## 2026-10-27 follow-ups (f317-f319)
- checkout/return keeps refreshed session cookies on failure and reports with the refreshed token.
- hasEmail now lifts realFailuresOnly; /xerrors checks 401 before json() on detail, save and repair; fingerprint includes paymentReference.
- Visitor UA forwarded from uncached payment/checkout BFF routes.
- account/topup/return: same cookie + report + ?ref fix (f320).
- /xerrors provisioning-claim recovery section + claim BFF proxy (f321).
