---
date: 2026-10-07
tags: [admin, checkout, bff]
focus: web
status: complete
---

# Session: games streak promo (admin + checkout)

## What existed before
No games on web. Checkout knew only the admin retail discount and partner promo codes.

## What was done
- Branch `feature/games-streak-promo` (not committed yet).
- New hidden admin page `/xstreaky` (AdminNav "Streak", Flame icon; noindex; in `privateRoutePrefixes`):
  on/off, streak days to unlock, discount %, reward validity days, max claims per user, campaign
  start/end (UTC dates), stats tiles and the latest 50 claims.
- BFF: `bff/admin/games-streak-promo` (GET/PUT) and `.../claims` via `proxyAdminJson`;
  customer `bff/checkout/quote` → backend `POST /payments/quote` (callWithSession).
- Checkout: `useCheckoutQuote` quotes the price whenever signed in and no partner-code check is
  running; `checkoutSummary` gains a `streak` line ("Games streak reward -N%") and the total uses the
  quote. The partner line uses `partnerFinalCents` because apply-promo's total now includes the reward.
- Top-up panel on `/account/[orderId]` shows "Your games streak reward takes N% off one top-up at payment".

## How it was done
The backend applies the reward inside `/payments/intent` and `/payments/topups/intent` regardless of
the client, so the web only displays it. A quote failure just hides the line.

## Outcome
854 tests pass, `pnpm build` passes. Needs the backend branch deployed (migration) before `/xstreaky` loads.
