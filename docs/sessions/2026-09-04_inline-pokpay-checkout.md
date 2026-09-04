# Inline PokPay card checkout

**Date:** 2026-09-04
**Spec:** [2026-09-04-inline-pokpay-checkout-design.md](../superpowers/specs/2026-09-04-inline-pokpay-checkout-design.md)
**Plan:** [2026-09-04-inline-pokpay-checkout.md](../superpowers/plans/2026-09-04-inline-pokpay-checkout.md)

## What changed

`/checkout` no longer redirects to a PokPay-hosted payment page. `PayButton.tsx`
(which did `window.location.assign(checkoutUrl)`) and `checkout/return/route.ts`
(the hosted-redirect return handler) are both deleted. In their place,
`CheckoutWizard.tsx` runs a two-step Billing → Card flow entirely on the page:

- **Billing step** (`steps/BillingStep.tsx`) collects and saves the 8-field
  billing address via `GET`/`PUT bff/user/billing-address` — which itself was
  widened from a legacy 4-field shape (`line1`/`city`/`postal`/`country`) to
  the full 8 fields the backend has actually supported since the mobile
  in-app checkout work.
- **Card step** (`steps/CardStep.tsx`) creates a payment intent
  (`bff/payments/intent`, unchanged) and mounts
  `@nebula-ltd/pok-payments-js/react`'s `GuestCheckoutForm` with `orderId`
  set to that intent's id. The SDK calls PokPay's API **directly from the
  browser** for card capture, tokenization, and 3DS — this is not proxied
  through our backend, and the backend's `/payments/card/*` endpoints (used
  by mobile's native low-level flow) are not used by web at all.
- On success, a new `bff/payments/provision` route (extracted from the old
  return handler) finalizes the order, and the wizard does a client-side
  `router.push('/account/{orderId}?new=1')` — the same landing spot the old
  hosted-redirect flow ended at, just reached without leaving the page
  mid-payment.

No inline receipt UI was built (an original plan task for one was cut
mid-implementation): `/account/[orderId]` already has a complete, tested
order display plus purchase-conversion tracking, and duplicating it would
have risked losing that tracking.

Top-ups (`/account/topup`) and partner wallet top-ups are untouched — they
still use the old `checkoutUrl` hosted-redirect mechanism; only the
package-purchase flow on `/checkout` changed.

## Why

User request: add inline package purchase on the web app using PokPay, no
external redirect — matching the pattern `velocity-eSim` already uses
(though it turned out the actual JS SDK's API shape differs enough from the
RN SDK that the implementation isn't a line-for-line port; see the spec's
Context section for what was discovered mid-brainstorm about
`@nebula-ltd/pok-payments-js`'s real exports).

## Notable mid-implementation discoveries

- The first spec draft assumed the JS SDK mirrored the RN SDK's low-level
  `encryptCard`/`createChallenge` split. Inspecting the actual published
  package showed it instead exposes a self-contained `usePOK`/
  `GuestCheckoutForm` that talks to PokPay directly — the spec was revised
  before planning continued.
- Task 1 (widening the billing-address route) would have broken
  `/profile/billing`'s existing form, which also depends on that route's
  type — caught by plan review before implementation started.
- Task 6 (a planned `ReceiptStep.tsx`) was cut in favor of redirecting to
  the existing `/account/[orderId]` page, once it became clear that page's
  order display isn't factored into a reusable component and duplicating it
  would risk losing purchase-conversion tracking.
- Code review during Task 7 caught three real gaps before commit: the
  `disabled` prop (meant to block payment while a promo code re-validates)
  wasn't actually wired to anything, there was no guard against
  double-submitting the payment-intent creation, and the payment reference
  wasn't shown to the user on a charged-but-not-provisioned failure. All
  three were fixed in the same task.

## Verification

Automated: full test suite (`pnpm test`) and `tsc --noEmit` clean at every
step. Manual sandbox verification (real PokPay staging card charges,
including a 3DS step-up and a decline) was not completed in this session —
it requires a signed-in browser session and PokPay sandbox test cards,
which is genuinely manual QA. Smoke-tested that `/destinations` renders and
that `/checkout` still correctly redirects a signed-out visitor to
`/signin` (confirms the route-guard cleanup in the final task didn't break
the guard itself).
