# Keep card fields filled on payment error

## Context

`2026-09-04-inline-pokpay-checkout-design.md` shipped `CardStep.tsx` mounting
`@nebula-ltd/pok-payments-js/react`'s `GuestCheckoutForm`, on the assumption
("the SDK's own form stays mounted so the buyer can retry without re-entering
billing") that the widget keeps its fields visible after a decline. In
practice it doesn't: decompiling the installed bundle (`lib/esm/index.js`,
v2.0.1) shows the widget's root render is a hard ternary —
`error ? <ErrorPanel/> : success ? <SuccessPanel/> : loading ? <Spinner/> :
<Form/>` — with no reset prop, no retry button, and no `FormRenderConfig`
flag for this. Once `onError` fires, the card-number/expiry/CVV fields are
gone for good; the buyer is stuck on a static "Error!" panel and has to
reload `/checkout` to try again.

This spec replaces `GuestCheckoutForm` with our own card inputs driven by the
package's lower-level `usePOK` hook, so a decline never unmounts the form.

Decompiling further confirms this is safe: the 3DS device-data-collection
iframe/postMessage logic (`cardinal_collection_iframe`,
`cardinalcommerce.com`/`cardinaltrusted.com`) lives in an internal helper
shared by both `GuestCheckoutForm` and `usePOK`'s `processPayment` — it is
not tied to the packaged form's own rendering. Switching to `usePOK` keeps
3DS handling intact; no custom challenge UI needs to be built.

Scope: `E-SIM-frontend` only, `src/app/checkout/steps/CardStep.tsx` and one
new validation module. No changes to `CheckoutWizard.tsx`'s data flow
(`/bff/payments/intent`, `/bff/payments/provision`, success navigation),
`BillingStep.tsx`, or the backend.

## Out of scope

- No new visible fields — still just card number, expiration, CVV (confirmed
  with the user; billing/email/country stay collected earlier and hidden,
  unchanged).
- No card-network detection/branding (Visa/Mastercard/Maestro icons) — the
  packaged widget did this cosmetically only; the backend/PokPay still
  reject unsupported types server-side.
- No changes to the "charged but provisioning failed" error path in
  `CheckoutWizard.tsx` (lines 129-135) — that's a separate, already-working
  case (provisioning retry, not a card decline) and isn't touched here.
- No i18n — this repo has no i18next setup (unlike `velocity-eSim`); the
  packaged widget's `locale` prop is dropped along with the widget itself.

## Design

### Card fields

`CardStep.tsx` renders its own three inputs (card number, expiration, CVV),
styled like `BillingStep.tsx`'s `INPUT_CLASSNAME` pattern, holding their own
`useState` string values. A new `src/lib/cardValidation.ts` mirrors
`billingValidation.ts`'s shape:

- `formatCardNumber(value)` — strips non-digits, re-inserts a space every 4
  digits, caps at 19 digits (matches the packaged widget's max).
- `formatExpiration(value)` — strips non-digits, inserts `/` after 2 digits,
  caps at `MM/YY` (4 digits total) — matches the widget's confirmed
  `MM/YY` format (`"20" + YY` parsed against `new Date()` for future-only).
- `validateCard({ cardNumber, expiration, securityCode })` → field-keyed
  errors (`required` | `invalid`): card number needs 13-19 digits;
  expiration needs valid `MM` (01-12) and to be in the future; CVV needs 3-4
  digits. Client-side only, a soft pre-check — the real validation is
  PokPay's via `processPayment`.

### Submit flow

`usePOK(paymentId, onSuccess, onError, env)` replaces the `<GuestCheckoutForm
orderId=.../>` mount. A "Pay" `Button` (matching the rest of checkout's
styling) calls `validateCard` then, if clean, `processPayment(cardNumber,
expiration.replace(/\D/g, ""), securityCode, billingInfo)` — `billingInfo`
built from the already-collected `billingAddress` prop, same shape passed to
`GuestCheckoutForm`'s `initialState` today. Button and all three inputs
`disabled={fetching}` while a submit is in flight (`fetching` from the hook).

### Error handling — the actual ask

On `onError({ type, message })`:

- Card number, expiration, and CVV state are **not** cleared — they stay
  exactly as typed, still editable, so the buyer can fix one wrong digit and
  resubmit without retyping everything (confirmed with the user — this is
  the core complaint the packaged widget's dead-end error screen caused).
- An inline banner renders above the fields (never replacing them): a
  once-through Lottie animation (see below) plus text — `message` when the
  SDK provides one (often the actual decline reason), else one generic
  fallback per `type`:
  - `VALIDATION_ERROR` → "Check your card details and try again."
  - `FORM_ERROR` → "Something's not right with this card. Please check it and try again."
  - `GENERAL_ERROR` / unset → "We couldn't process your card. Please try again."
- `handledRef` double-submit guard on `onSuccess` carries over unchanged from
  the current `CardStep.tsx`.

### Lottie animation

Per the user: reuse velocity's existing `assets/lottie/otp-error.json` (used
today for a failed OTP attempt in `VerificationStatusOverlay.tsx`, not
currently used for card errors on either platform — there is no
card-specific error Lottie to match against, so this is the closest existing
asset, not a literal port of an existing card-error treatment).

- Copy the file to `E-SIM-frontend/public/lottie/otp-error.json` (same
  asset, new location — this repo's Lottie files live in `public/lottie/`,
  imported by path, per `WizardWelcomeIntro.tsx`/`BoardingPassStepperCard.tsx`).
- Rendered via `lottie-react`'s `<Lottie animationData={otpErrorAnimation}
  loop={false} autoplay={!reduceMotion} style={{ width: 40, height: 40 }} />`
  — `loop={false}` matches velocity's non-looping "error" phase (velocity
  only loops during its "verifying" phase, which has no equivalent here).
- `reduceMotion` computed the same way as the two existing call sites in this
  repo (`WizardWelcomeIntro.tsx`, `HelpMeChooseWizard.tsx`): a local
  `useState` + `matchMedia("(prefers-reduced-motion: reduce)")` effect —
  this repo has no shared hook for it yet, so `CardStep.tsx` follows the
  existing duplicated pattern rather than introducing a new shared one
  out of scope for this fix.
- Banner layout: bordered box (`border border-error bg-error/5 rounded-[12px]
  p-3`, matching this repo's existing `text-error`/`border-error` convention
  in `BillingStep.tsx`/`PromoCodeField.tsx`), animation + text side by side.

## Testing

- No unit tests for `processPayment`/3DS itself — third-party black box,
  same as the existing spec's position.
- New unit tests for `cardValidation.ts` (`formatCardNumber`,
  `formatExpiration`, `validateCard`) — pure functions, cheap to test,
  matches this repo's existing `pnpm test` (vitest) setup.
- Manual test plan against PokPay's sandbox (`env: "staging"`), extending the
  existing spec's plan: one decline, confirming the three fields are still
  populated afterward and a resubmit with a corrected card succeeds without
  re-entering billing.
