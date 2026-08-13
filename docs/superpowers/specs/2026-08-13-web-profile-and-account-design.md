# Web profile & account area — design

**Date:** 2026-08-13
**Repos touched:** `E-SIM-frontend/` (primary), `E-SIM backend/` (phase 4 only)

## Goal

Bring the web app to parity with the mobile app's Profile and My eSIMs experience:
sign in / sign out, an account hub, active plans and history, top-up, and billing
settings. The backend already exposes every endpoint this needs; with one exception
(phase 4) this is frontend work.

## Current state

- `/signin` — email OTP only.
- `/account` — flat list of all orders, no active/expired split, sign-out button.
- `/account/[orderId]` — QR install + usage.
- No profile hub, no top-up, no billing settings, no account deletion.

## Endpoints available today

| Endpoint | Used for |
|---|---|
| `GET /orders`, `GET /orders/active` | plan list, active/history split |
| `GET /orders/:id`, `/usage`, `/instructions`, `/packages` | detail page |
| `GET /orders/:id/topups` | available top-up packages |
| `POST /payments/topups/intent`, `/topups/provision` | top-up purchase |
| `GET/PUT /user/billing-address`, `/purchase-details`, `/card-details` | billing settings |
| `DELETE /user/account` | account deletion |
| `GET /auth/identities`, `DELETE /auth/identities/:provider` | linked providers |
| `POST /auth/social/google`, `/social/apple` | social sign-in |
| `POST /auth/link/otp/send`, `/link/otp/verify` | claim-by-OTP after social sign-in |

## Routes

| Path | Change | Purpose |
|---|---|---|
| `/profile` | new page | Account hub: email, linked providers, billing links, legal, delete, sign out |
| `/profile/deleted` | new page | Post-deletion goodbye (mirrors mobile `AccountDeletedGoodbyeScreen`) |
| `/account` | edit | Split into **Active plans** and **History** |
| `/account/[orderId]` | edit | Add top-up panel and package history |
| `/account/topup/return` | new handler | Pokpay return for top-ups |
| `/signin` | edit | Google + Apple buttons |
| `/signin/link-email` | new page | Email claim when the provider returns `linkRequired` |

New API proxies, each following the existing `/api/payments/intent` pattern
(`readSessionTokens` → `callWithSession` → `applyCookies`):

`/api/payments/topups/intent`, `/api/user/billing-address`,
`/api/user/purchase-details`, `/api/user/card-details`, `/api/user/account`,
`/api/auth/identities/[provider]`, `/api/auth/social/google`,
`/api/auth/social/apple`, `/api/auth/link/otp/send`, `/api/auth/link/otp/verify`.

## Identity display

There is no `/user/me`. The access token is `dev-auth.<base64url {email}>.<sig>`,
so `/profile` decodes the email from the httpOnly cookie **server-side, for display
only**. It is never an authorization decision — every backend call still validates
the token. Linked providers come from `GET /auth/identities`. Unlinking the only
sign-in method is refused by the backend with 409; the UI surfaces that message.

## Top-up flow

Mirrors the existing purchase flow:

1. Detail page server-fetches `/orders/:id/topups`.
2. Client `TopUpPanel` lists packages; selecting one POSTs
   `/api/payments/topups/intent` with `{order_id, package_id, return_url}`.
3. Full-page navigation to the Pokpay `checkoutUrl` (popups are unreliable in
   mobile and in-app browsers — same reasoning as `PayButton`).
4. Pokpay returns to `/account/topup/return`, which POSTs
   `/payments/topups/provision` and redirects to `/account/:id?topup=1`.

Two supporting pieces:

- An `esim_pending_topup` cookie carrying the order id, so the return handler knows
  where to send the buyer. Same short-lived shape as `PENDING_PAYMENT_COOKIE`.
- `/account/topup/return` added to `UNGUARDED_PATHS` in `route-guard.ts`. It sits
  under the guarded `/account` prefix but must stay reachable if the session lapsed
  while the buyer was on Pokpay — it authenticates by its own payment cookie.

## Social sign-in constraints

- **Google** — `config.google.audiences` already includes `GOOGLE_WEB_CLIENT_ID`, so
  a Google Identity Services token from the browser verifies with **no backend
  change**. Requires `GOOGLE_WEB_CLIENT_ID` set on both sides and the site origin
  listed under authorized JavaScript origins.
- **Apple** — the backend verifies `aud === APPLE_BUNDLE_ID` only. Sign in with
  Apple JS mints tokens whose `aud` is a **Services ID**, so web tokens are rejected
  today. Requires a backend change: accept `APPLE_SERVICES_ID` as a second audience.
  Also requires an Apple Services ID with domain verification and a return URL.

Both buttons render conditionally on a configured client id (same approach as
mobile's `isGoogleSignInConfigured()`), so an unconfigured deploy shows OTP-only
rather than a button that 503s.

The `linkRequired` response must be handled or Apple sign-in dead-ends: the backend
returns `{linkRequired, linkTicket, suggestedEmail}` when the identity has no linked
account, and the client must collect an email and run `/auth/link/otp/*`.

## Structure

Shared card and section primitives move to `src/app/components/` so `/profile`,
`/account` and the detail page stop repeating the same long Tailwind class strings.
Client components stay small and single-purpose: `BillingForm`, `LinkedProviders`,
`DeleteAccountCard`, `TopUpPanel`, `SocialSignInButtons`.

## Testing

Follows the repo's existing logic-level vitest style: route handlers are imported
and called directly with a mocked `fetch` (see `checkout-flow.test.ts`), pure
functions are asserted directly (see `route-guard.test.ts`).

## Phases

Each phase is independently shippable and independently verifiable.

### Phase 1 — Profile hub
`/profile` page, email display from the session cookie, sign out, legal links,
navigation between `/profile` and `/account`, middleware guard entry for `/profile`.
Verifiable with no new credentials.

### Phase 2 — Active plans & history
Split `/account` into active and expired sections using `GET /orders/active`, with
usage summaries. Add package history to the detail page.

### Phase 3 — Top-up
`TopUpPanel`, the intent proxy, the pending-topup cookie, the return handler, and
the guard exemption. The largest behavioural change and the one carrying money.

### Phase 4 — Billing settings & account deletion
`/user/*` proxies and forms for billing address, purchase details and saved card;
delete-account flow with confirmation, cookie clearing, and `/profile/deleted`.

### Phase 5 — Google & Apple sign-in
Browser Google Identity Services and Sign in with Apple JS, the token-exchange
proxies, the `linkRequired` claim flow, and the backend `APPLE_SERVICES_ID`
audience change. Cannot be verified end-to-end without credentials (see
`GOOGLE_APPLE_AUTH_READINESS.md`); ships behind conditional rendering.
