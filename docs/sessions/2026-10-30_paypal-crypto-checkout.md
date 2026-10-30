# PayPal + crypto checkout (web)

**Date:** 2026-10-30

## What was done
- Checkout step 02 becomes "Payment" with a Card / PayPal / Crypto picker (`PaymentMethodPicker`, `usePaymentMethods`); hidden when only card is enabled, so checkout is unchanged until the backend flags are on.
- `steps/PaypalStep.tsx` (full-page redirect to PayPal), `checkout/paypal/return/route.ts` (capture → `/account/:id?new=1`, or `?topup=1&payment=` for top-ups; failures to `/checkout/failed` incl. new `pending` copy).
- `steps/CryptoStep.tsx`: network chips, invoice with QR + copy fields + countdown + warning, 5 s polling (`shouldKeepPolling`), Lottie waiting state, tx-hash fallback.
- `TopUpPanel` gets the same picker (PayPal redirect, inline crypto invoice, GA pending top-up stash).
- BFF: `bff/payments/{methods,paypal/intent,crypto/intent,crypto/[id]/tx,external/[id]}`; methods is called without a session (public backend route).

## How it was done
Card path left as is (intent still created on load, `CardStep`, `startTopup`). Layout verified with Playwright against mocked `/bff/**` (f219 recipe) at 1280 and 390 px, no horizontal overflow. Review fixes: signed-out visitors saw card only; crypto polling stopped on a transient setup error.

## Outcome
`tsc` clean, vitest 1101 passing. Backend contract: `E-SIM backend/docs/api/external-payments.md`.
