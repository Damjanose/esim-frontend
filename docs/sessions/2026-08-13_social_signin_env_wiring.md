# Social sign-in env wiring

**Date:** 2026-08-13

## Problem

`/signin?next=%2Fprofile` showed only the email/OTP form — no Google or Apple
buttons.

## Cause

Not missing code. `src/app/signin/SocialSignInButtons.tsx` reads
`NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID` and `NEXT_PUBLIC_APPLE_SERVICES_ID` and
returns `null` when both are empty — a deliberate guard, since the backend
answers 503 for an unconfigured provider anyway. This repo had **no env file at
all**, so both were empty.

## Change

- Added `.env.local` (gitignored) with `NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID`,
  copied from `E-SIM backend/.env`'s `GOOGLE_WEB_CLIENT_ID`. The two must match
  or the backend rejects the token's `aud`.
- Added `.env.example` documenting all six env vars this app reads.
- Apple left commented out — see below.

Verified: the client id appears in the served client chunk and the "or" divider
renders in the SSR HTML. `vitest run src/app/signin` passes (9 tests).

## Apple is still off

Web Sign in with Apple mints tokens whose `aud` is a **Services ID**, not the
app bundle id (`E-SIM backend/src/config/index.ts` has a separate
`APPLE_SERVICES_ID` for exactly this). No Services ID exists yet. To enable:

1. Apple Developer portal → Identifiers → Services IDs → create one, enable
   Sign in with Apple, add `http://localhost:3000` (and the prod origin) as
   return URLs.
2. Set it as `NEXT_PUBLIC_APPLE_SERVICES_ID` here **and** `APPLE_SERVICES_ID` in
   the backend `.env`.

Also note `src/app/api/auth/social/apple/route.ts` deliberately sends no
`authorizationCode`, so a web-only Apple account has no stored refresh token and
revoke-on-delete does not cover it.

## Design pass on `/signin`

- **Google button was left-aligned, not centered.** Cause: Google renders into a
  fixed-pixel-width iframe, so the old `[&>div]:!w-full` stretched the *wrapper*
  while the button kept its own 320px width at the left edge. Fixed by measuring
  the row with a `ResizeObserver` and passing the real pixel width to
  `renderButton` (capped at Google's 400px limit), re-rendering on resize.
- **Button language**: `?hl=en` on the GSI script plus `locale: "en"` on
  `renderButton`. Without it Google uses the browser UI language.
- **Provider pair**: Google's button is 40px and unresizable, so Apple is built
  to the same 40px pill rather than the taller house button. Hierarchy is now
  deliberate: 48px gradient rect = the house method, 40px pills = shortcuts.
- Social block moved **outside** the email `<form>` (it was nested inside).
- Added a Terms/Privacy line, `focus-visible` rings on all three buttons,
  `motion-reduce` on the hover lift, and a radial "coverage glow" behind the
  card so it isn't floating in an empty field.

## Follow-up for Google

`http://localhost:3000` must be an Authorized JavaScript origin on that OAuth
client in the Google Cloud Console, otherwise GIS refuses to render the button
(`origin_mismatch` in the console). Could not verify from here.

See also: `GOOGLE_APPLE_AUTH_READINESS.md` at the workspace root.
