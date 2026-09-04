# Inline PokPay card checkout (replace hosted redirect)

## Context

`velocity-eSim` already migrated off PokPay's hosted-checkout redirect for
package purchases, to a fully native in-app card form using PokPay's React
Native SDK (`@nebula-ltd/pok-payments-rn`) for on-device card encryption and
Cybersource 3DS — see
`velocity-eSim/docs/superpowers/specs/2026-08-16-in-app-card-checkout-design.md`.
The web frontend's `/checkout` still uses the older mechanism: `PayButton.tsx`
calls `POST /bff/payments/intent` then does `window.location.assign(checkoutUrl)`,
a full-page redirect to PokPay's hosted payment page, returning via
`/checkout/return`.

This spec brings the same **inline, no-redirect** outcome to web, but not by
porting mobile's implementation line-for-line. Inspecting the actual published
`@nebula-ltd/pok-payments-js` package (v2.0.1, not yet installed anywhere in
this repo) shows it has a materially different shape from the RN SDK: it has
no low-level `encryptCard(card, keys)` / `createChallenge().runChallenge()`
pair to swap in for mobile's native calls. Instead it exports a self-contained
`usePOK(orderId, onSuccess, onError, env)` hook (and an equivalent
`GuestCheckoutForm` component) that calls PokPay's API **directly from the
browser** — confirmed by inspecting the bundled code, which makes real
requests to `api.pokpay.io` / `api-staging.pokpay.io` for guest-card creation,
3DS enrollment and confirm (`/sdk-orders/{orderId}/guest-confirm`,
`/credit-debit-cards/guest`, `/check-3ds-enrollment`), and to Cardinal
Commerce/Cybersource domains for the 3DS challenge itself. No separate API key
is required client-side — `orderId` is exactly the `paymentId` our backend's
`POST /payments/intent` already creates server-side with our merchant
credentials, and the SDK just references it.

Given that, this spec uses `usePOK`/`GuestCheckoutForm` as designed rather
than reimplementing mobile's low-level orchestration:

- Card capture, guest-card tokenization, 3DS enrollment, and the 3DS challenge
  itself are all handled internally by the SDK — no custom iframe/postMessage
  code to write, no `pokCardFlow.ts` state machine to port, no device-header
  plumbing.
- The backend's `/payments/card/guest`, `/payments/card/3ds-enrollment`, and
  `/payments/card/confirm` endpoints (used by mobile) are **not** used by this
  web flow — the SDK talks to PokPay directly for those steps. This is a
  deliberate trade-off, confirmed with the user: those three backend-side
  checks (e.g. the 409 "billing address must be completed" gate on
  `/payments/card/guest`) are bypassed for the web path. Billing is still
  collected and shown to the buyer before payment (see Billing step below);
  it's passed straight into the SDK call as `billingInfo`, just not gated
  server-side the way mobile's flow gates it.
- `/payments/intent` (creates the `paymentId`/`orderId` and fixes the amount
  server-side) and `/payments/provision` (after the SDK reports success) are
  still backend-mediated, same as mobile — money movement is still anchored
  server-side even though the card/3DS steps aren't proxied.

Entry point stays where it is today: a plan's "Buy" button on
`/destinations/[slug]` (`DestinationPlans.tsx`) still navigates to
`/checkout?package=<id>` — only what `/checkout` does once you're there
changes, from a redirect to an inline wizard.

Scope: `E-SIM-frontend` only. No changes to `E-SIM backend` or `velocity-eSim`.

## Out of scope

- The hosted-redirect mechanism is removed entirely, not kept as a fallback —
  confirmed with the user. If the JS SDK fails to load, checkout errors
  inline rather than falling back to a hosted page.
- Top-up and partner-wallet-topup checkout (`/account/topup`,
  `/partners/me/wallet/topup`) — these use the same `checkoutUrl` redirect
  mechanism today and are **not** touched by this spec. They keep working via
  the existing `/payments/topups/intent` and `/payments/wallet-topups/intent`
  hosted-redirect path, since `/payments/intent`'s `checkoutUrl` field simply
  goes unused by the package-purchase path this spec changes, not removed
  from the backend.
- No changes to `/destinations` or `/destinations/[slug]` beyond nothing —
  the "Buy" link keeps navigating to `/checkout?package=<id>` unchanged.
- No new backend endpoints, and no BFF proxy routes for
  `/payments/card/encryption-key`, `/payments/card/guest`,
  `/payments/card/3ds-enrollment`, or `/payments/card/confirm` — the web flow
  doesn't call these; the SDK talks to PokPay directly (see Context). (A new
  BFF proxy route for `/payments/provision` is still needed on the frontend,
  since today it's only called inline from the hosted-redirect return
  handler — see Data flow.)
- No custom 3DS iframe/challenge UI to build — `usePOK`/`GuestCheckoutForm`
  handles the challenge internally.

## Architecture

`/checkout` becomes a 3-step client-side wizard — **Billing → Card → Receipt**
(the plan summary above it, already server-rendered by `page.tsx`, plays the
role of mobile's "Package" step but isn't a wizard step needing its own
state). The server component at `src/app/checkout/page.tsx` still resolves
the package server-side (unchanged) and renders the plan summary, but
everything below it — currently `PayButton.tsx` plus the "redirected to
Pokpay" copy — is replaced by a new client component that owns the wizard.

New files under `src/app/checkout/`:

- `CheckoutWizard.tsx` — client component, step state
  (`"billing" | "card"`; see the `steps/ReceiptStep.tsx` entry below for why
  there's no `"receipt"` step). Replaces `PayButton.tsx` and the
  static "Payments are handled by Pokpay..." copy. On entering the Card
  step, calls `POST bff/payments/intent` to obtain `paymentId` (used as the
  SDK's `orderId`) and `environment` (maps to the SDK's `env: "production" |
  "staging"`).
- `steps/BillingStep.tsx` — the 8-field billing form (holder name, email,
  country, admin area, locality, address1, postal code, phone). Prefills via
  the existing `GET /bff/user/billing-address` route; submitting saves via
  its `PUT`. That route already proxies the backend's `/user/billing-address`,
  and the backend's `BillingAddressInput` (`purchaseDetails.service.ts`) has
  been the full 8-field shape since the mobile in-app checkout work — but
  the frontend route currently only forwards 4 legacy fields (`line1`,
  `city`, `postal`, `country`) and is unused by any page today. This spec
  fixes that route's field mapping to the full 8-field shape rather than
  adding a new route. The values collected here are also what's passed as
  `billingInfo` into the SDK call on the Card step (see Data flow) — this
  step's job is entirely client-side collection/persistence, not a
  precondition check enforced by our backend for the card charge itself.
- `steps/CardStep.tsx` — mounts `GuestCheckoutForm` (or `usePOK`, whichever
  proves the more controllable fit once actually wired up — decide during
  implementation, see Task notes in the plan) from
  `@nebula-ltd/pok-payments-js/react`, passed `orderId={paymentId}`,
  `env={environment === "production" ? "production" : "staging"}`,
  `onSuccess`, and `onError`. The SDK renders its own card-number/expiry/CVV
  fields and, when the bank requires it, its own 3DS challenge iframe, all
  inside our container — no custom form fields, iframe, or device-header
  code needed here.
- No `steps/ReceiptStep.tsx` — **revised during implementation.**
  `/account/[orderId]/page.tsx` already has a complete, tested order display
  (QR/activation code, ICCID, usage, top-ups, plan history) plus
  `PurchaseConversion` tracking that only fires on that page. None of it is
  factored into an importable component; it's inline in that server
  component across five backend calls. Building a separate client-side
  receipt would mean re-implementing or re-fetching all of that, and losing
  conversion tracking if not carefully duplicated too. The existing
  hosted-redirect flow already ended by landing there
  (`checkout/return` → `/account/{orderId}?new=1`) — so `CheckoutWizard.tsx`
  does the same via `router.push` after the SDK's `onSuccess` and a
  successful `bff/payments/provision` call, rather than rendering a receipt
  inline. This is an internal same-origin navigation to a page this app
  already owns; it is not the external PokPay redirect this spec removes.
- No `pokCardFlow.ts` state machine to port, and no `PaymentProgressOverlay`
  staged narration — the SDK's `fetching`/`loading` states (from `usePOK`) or
  its own internal form UI (from `GuestCheckoutForm`) are the only in-flight
  indicators; there's no multi-step sequence on our side left to narrate.

## Data flow

`bff/payments/intent` is reused unchanged — its `checkoutUrl` field is
simply never read by the new wizard; only `paymentId`/`environment` are used.

A new `bff/payments/provision` POST route needs to be created: today,
`POST /payments/provision` is only called inline inside
`src/app/checkout/return/route.ts` (the hosted-redirect return handler), not
exposed as its own reusable BFF route. `CheckoutWizard.tsx` needs to call it
directly after the SDK's `onSuccess` fires, then navigate to the resulting
order. `checkout/return/route.ts`
itself is deleted along with the rest of the hosted-redirect path (per
"remove entirely" above), so there is no dual-path reconciliation to do —
the new route simply replaces that inline call as the only caller of backend
`/payments/provision`.

No new BFF routes are needed for card/3DS/confirm — the SDK calls PokPay
directly for those (see Context).

Full sequence once the buyer is on `/checkout`:

1. Billing step: `GET bff/user/billing-address` prefill → user edits/confirms
   → `PUT bff/user/billing-address` → advance to Card step
2. Card step mount: `POST bff/payments/intent` → `paymentId`, `environment`
3. `GuestCheckoutForm`/`usePOK` mounted with `orderId={paymentId}`,
   `env={environment}` — buyer enters card details in the SDK's own fields
4. SDK internally: encrypts the card, creates the guest card against
   PokPay directly, checks 3DS enrollment, runs the challenge inline if
   required, and confirms the charge — all without our backend in the loop
5. SDK's `onSuccess` fires → `POST bff/payments/provision` with the
   `paymentId` (idempotent by `payment_id`, safe to retry)
6. On success, `router.push` to `/account/{order.id}?new=1` — the existing
   order page (see the Architecture note on `ReceiptStep.tsx` above)

## Error handling

- **Not yet charged** (declined card, validation errors, failed 3DS): the
  SDK's `onError(error: PaymentErrorResponse)` fires with
  `{type: 'GENERAL_ERROR' | 'FORM_ERROR' | 'VALIDATION_ERROR', message?}`.
  `CardStep.tsx` shows this inline (mapping `type` to user-facing copy
  similar in spirit to mobile's `normalizePokCardError`, since the SDK's
  `message` is not guaranteed to be end-user-appropriate); the SDK's own
  form stays mounted so the buyer can retry without re-entering billing.
- **Charged but provisioning failed** (`onSuccess` fired, then
  `bff/payments/provision` fails): never re-invoke the SDK/re-charge the
  card. Since there's no receipt step to show a failure state in (per the
  Architecture revision above), `CheckoutWizard.tsx` shows this inline on
  the Card step instead, with a "retry" action that only re-calls
  `bff/payments/provision` — idempotent by `payment_id`, safe to retry any
  number of times.
- **3DS challenge dismissed/cancelled**: handled entirely inside the SDK; if
  it surfaces to us at all it arrives via `onError`, same handling as above.
  (Confirm the exact shape during implementation — the SDK's public types
  don't distinguish a user-cancelled challenge from other `GENERAL_ERROR`s,
  so this may end up needing generic "something went wrong, try again"
  copy rather than mobile's silent-return behavior.)
- **Double-submit guard**: track whether `onSuccess` has already fired for
  the current `paymentId` in component state, and ignore/no-op a second
  `onSuccess` call for the same id (the SDK is not known to guarantee it
  fires only once).
- **JS SDK fails to load/init**: shown as an inline error on the Card step
  ("Payment couldn't be initialized — check your connection and reload") with
  a reload action. No fallback to a hosted page, per the "remove entirely"
  decision above.

## Testing

- No backend test changes expected — this flow doesn't call the backend's
  card/3DS endpoints at all.
- New tests for the `bff/payments/provision` route (cookie-forwarding/refresh
  behavior, matching the shape of any existing test for `bff/payments/intent`)
  and for the corrected `bff/user/billing-address` field mapping.
- No unit tests are feasible for the SDK's internal card/3DS/confirm
  behavior — it's a third-party black box making real network calls; that
  logic is PokPay's to test, not ours.
- Manual test plan against PokPay's sandbox (`env: "staging"`): one purchase
  with a test card that triggers no 3DS step-up, one that triggers a
  step-up challenge, and one that gets declined — confirming inline
  error/receipt states for each, and that no navigation away from
  `/checkout` occurs in any case.
