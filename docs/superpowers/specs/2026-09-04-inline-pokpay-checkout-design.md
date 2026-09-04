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

This spec ports the mobile app's in-app pattern to web, using PokPay's JS SDK
(`@nebula-ltd/pok-payments-js`, the sibling of the RN package, not yet
installed anywhere in this repo) against the backend's existing
`/payments/card/*` endpoints (`E-SIM backend/src/routes/payments.ts`), which
mobile already uses and which require no backend changes.

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
- No new backend endpoints. The four `/payments/card/*` endpoints and
  `/payments/provision` already exist on the backend and are already
  exercised by mobile. (A new BFF proxy route for `/payments/provision` is
  needed on the frontend, since today it's only called inline from the
  hosted-redirect return handler — see Data flow.)

## Architecture

`/checkout` becomes a 4-step client-side wizard — **Package → Billing → Card
→ Receipt** — mirroring `velocity-eSim/src/screens/Checkout/PlanCheckoutScreen.tsx`
step-for-step. The server component at `src/app/checkout/page.tsx` still
resolves the package server-side (unchanged) and renders the plan summary,
but everything below it — currently `PayButton.tsx` plus the "redirected to
Pokpay" copy — is replaced by a new client component that owns the wizard.

New files under `src/app/checkout/`:

- `CheckoutWizard.tsx` — client component, step state
  (`"billing" | "card" | "receipt"`; "package" is the existing server-rendered
  summary above it, not a wizard step needing its own state). Replaces
  `PayButton.tsx` and the static "Payments are handled by Pokpay..." copy.
- `steps/BillingStep.tsx` — the 8-field billing form (holder name, email,
  country, admin area, locality, address1, postal code, phone), same fields
  and validation as mobile's `BillingStep.tsx`. Prefills via the existing
  `GET /bff/user/billing-address` route; submitting saves via its `PUT`.
  That route already proxies the backend's `/user/billing-address`, and the
  backend's `BillingAddressInput` (`purchaseDetails.service.ts`) has been
  the full 8-field shape since the mobile in-app checkout work — but the
  frontend route currently only forwards 4 legacy fields (`line1`, `city`,
  `postal`, `country`) and is unused by any page today. This spec fixes
  that route's field mapping to the full 8-field shape rather than adding a
  new `bff/billing` route.
- `steps/CardStep.tsx` — card number / expiry / CVV fields with client-side
  Luhn + brand validation via `card-validator` (add as a web dependency; already
  used by mobile). Also mounts the invisible device-data-collection iframe
  and, when needed, the visible 3DS challenge iframe.
- `steps/ReceiptStep.tsx` — final receipt. Reuses existing order-display
  components from the `/account/[orderId]` page rather than duplicating
  markup where those components are reasonably shareable.
- `PaymentProgressOverlay.tsx` — staged progress narration, same stages as
  mobile: encrypting → registering card → collecting device data → checking
  3DS → authenticating → confirming.
- `src/payments/pokCardFlow.ts` — ports the state machine from mobile's
  `src/payments/pokCardFlow.ts` (`runPokCardFlow`), with a new
  `src/payments/pokSdk.ts` providing web bindings: `@nebula-ltd/pok-payments-js`'s
  `encryptCard`, its device-data-collection call, and its challenge API
  mounted into an iframe instead of a native modal.

## Data flow

New BFF routes under `src/app/bff/payments/card/`, each following the exact
pattern of the existing `src/app/bff/payments/intent/route.ts`
(`callWithSession` for cookie-based auth/refresh, forwarding to the matching
backend endpoint, no client-supplied amounts trusted — the backend already
enforces this):

- `POST bff/payments/card/encryption-key` → backend
  `GET /payments/card/encryption-key`
- `POST bff/payments/card/guest` → backend `POST /payments/card/guest`
- `POST bff/payments/card/3ds-enrollment` → backend
  `POST /payments/card/3ds-enrollment`, forwarding the Cybersource device
  headers (`POK_DEVICE_HEADER_NAMES`) unchanged in both directions
- `POST bff/payments/card/confirm` → backend `POST /payments/card/confirm`,
  same device-header forwarding

`bff/payments/intent` is reused unchanged — its `checkoutUrl` field is
simply never read by the new wizard.

A new `bff/payments/provision` POST route needs to be created: today,
`POST /payments/provision` is only called inline inside
`src/app/checkout/return/route.ts` (the hosted-redirect return handler), not
exposed as its own reusable BFF route. The new wizard's Receipt step needs
to call it directly. `checkout/return/route.ts` itself is deleted along with
the rest of the hosted-redirect path (per "remove entirely" above), so there
is no dual-path reconciliation to do — the new route simply replaces that
inline call as the only caller of backend `/payments/provision`.

Full sequence, matching mobile's actual ordering (`PlanCheckoutScreen.tsx`
creates the payment intent from the Card step's submit handler, not before
Billing):

1. Billing step: `GET bff/user/billing-address` prefill → user edits/confirms
   → `PUT bff/user/billing-address`
2. Card step submit: `POST bff/payments/intent` → `paymentId`, amount/currency
3. `POST bff/payments/card/encryption-key` → Flex JWK
4. Encrypt card client-side (JS SDK) → JWE, raw PAN never sent to our servers
5. `POST bff/payments/card/guest` → `cardId`, possible `deviceDataCollection`
6. If requested: invisible DDC iframe → `sessionId`
7. `POST bff/payments/card/3ds-enrollment` (+ device headers) → `stepUpRequired?`
8. If required: visible 3DS challenge iframe → `consumerAuthenticationInformation`
9. `POST bff/payments/card/confirm` (+ device headers) → `isCompleted`, `order`
10. If `order` absent: `POST bff/payments/provision` (idempotent by `payment_id`)
11. Receipt step renders the completed order

## Error handling

Ported from mobile's `src/services/paymentErrors.ts` (`normalizePokCardError`)
and `pokCardFlow.ts` guard logic:

- **Not yet charged** (declined card, validation errors from steps 3–8):
  shown inline on the Card step; user can retry with different card details.
- **Charged but provisioning failed** (step 10 fails after step 9 succeeded):
  never re-run the card charge. Receipt step shows a failure state with a
  "retry" action that only re-calls `bff/payments/provision` — idempotent by
  `payment_id`, safe to retry any number of times.
- **3DS challenge dismissed/cancelled**: treated as a deliberate user action,
  not an error — silently returns to the Card step with no error message,
  matching mobile's `info.silent && !charged` handling.
- **`chargedPaymentId` guard**: once step 9 reports `isCompleted`, the flow
  records the `paymentId` and refuses to re-run the charge sequence for it
  even if the component re-renders or the user double-clicks — ported as-is
  from mobile.
- **JS SDK fails to load/init**: shown as an inline error on the Card step
  ("Payment couldn't be initialized — check your connection and reload") with
  a reload action. No fallback to a hosted page, per the "remove entirely"
  decision above.

## Testing

- No backend test changes expected — the card endpoints are already covered
  by mobile's integration against them.
- New unit tests for `src/payments/pokCardFlow.ts`'s state transitions,
  structured after mobile's existing test suite for the same state machine
  (success, decline, cancelled-3DS, charged-but-provisioning-failed, retry).
- New tests for the BFF card routes: cookie-forwarding/refresh behavior
  (same shape as any existing test for `bff/payments/intent`), device-header
  pass-through, and error-status mapping.
- Manual test plan against PokPay's sandbox: one purchase with a test card
  that triggers no 3DS step-up, one that triggers a step-up challenge, and
  one that gets declined — confirming inline error/receipt states for each,
  and that no navigation away from `/checkout` occurs in any case.
