# Checkout recovery after a paid-but-failed setup (web)

**Date:** 2026-10-31

## What was done
- Audit against `../docs/esim-competitor-review-report.pdf` (competitor review complaints) found three web failure modes. A card charge whose eSIM setup failed had no retry, and a refresh created a second payment intent. The order page said "ready" while still provisioning. Paid-but-unprovisioned payments were invisible to the buyer.
- `src/lib/chargedPayment.ts` + `checkout/RecoveryPanel.tsx`: the charged payment is persisted in sessionStorage. The panel tells the buyer not to pay again, offers an idempotent Retry setup, and blocks creating a new intent for 24h.
- `account/[orderId]/page.tsx` banner keyed on `qr.kind`. `ProvisioningWatcher.tsx` refreshes the page every 10s for 2 min, then shows Contact support.
- `bff/orders/pending-payments` + `account/PendingPaymentCards.tsx` read the new backend `GET /orders/pending-payments`.

## How it was done
The implementer subagent did the work and the main session reviewed it. Polling was slowed from 5s to 10s because each refresh re-runs 4 backend calls, including Airalo usage. The Pokpay SDK's `onSuccess` has no payload, so the browser can't see the order returned by `/card/confirm` and still calls `/bff/payments/provision`. That call is idempotent and the backend already provisioned inline.

## Outcome
`tsc` clean, vitest 1119 passing, `next build` not run. Paired with backend `fix/order-integrity` (pending-payments endpoint, stuck-claim sweep) and mobile `fix/offline-esims`. Facts f337-f339.
