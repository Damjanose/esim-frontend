# 2026-11-08: Web purchases disabled (app-only)

**Goal:** the web is for visitors, sign-in and managing existing eSIMs (plus partners). All purchases move to the mobile app.

## What changed
- `src/lib/web-purchases.ts`: `WEB_PURCHASES_DISABLED_MESSAGE` and `appPurchaseHref(id)` → `/pkg/{id}`.
- Buy links (destination pages, plan lists, the failed page's "Try again", SEO Offer url) → `/pkg/{id}`.
- `/checkout?package=X` redirects to `/pkg/X`. `/checkout` stays claimed by universal / App Links, so old shares still open the app.
- `/pkg/[id]`: shows the app-only message and Open in the app (mobile), or the App Store / Google Play buttons (desktop). The "Buy on the web" button is gone.
- BFF `payments/intent`, `paypal/intent`, `crypto/intent`, `topups/intent` → 403.
- Account order page: a "top up in the app" note replaces TopUpPanel.
- Trip plans: the paid unlock is refused with 403 by `bff/itineraries/[id]/checkout`, and the UI shows the app-only note. Free unlocks still work.

## Kept on purpose
Sign-in, account management, provision/return routes (payments already in flight), the partner wallet top-up.

## Follow-ups
- Delete the now-unused checkout UI (CheckoutWizard, steps, TopUpPanel) in a separate PR.
- Optional backend change: refuse paid trip-plan checkout for web clients, so no orphan pending payment gets created.

Fact: f346.
