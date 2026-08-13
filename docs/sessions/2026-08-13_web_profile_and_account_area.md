# Web profile and account area

**Date:** 2026-08-13

Brought the website to parity with the mobile app's Profile and My eSIMs screens:
a profile hub, active/history plan sections, top-up, billing settings, account
deletion, and Google/Apple sign-in. Delivered in five phases. Design spec:
`docs/superpowers/specs/2026-08-13-web-profile-and-account-design.md`.

The backend already exposed every endpoint this needed, with one exception (see
phase 5).

## Phase 1 — Profile hub

- `src/app/profile/page.tsx` — account card, sign out, rows to eSIMs, support, legal.
- `src/lib/session-identity.ts` — `readEmailFromAccessToken`. There is no
  `/user/me`, so the signed-in address is decoded from the `dev-auth.<payload>.<sig>`
  access token server-side. **Display only**: the signing secret is not on the web
  side, so the signature cannot be checked here.
- `src/app/components/SettingsSection.tsx` — section/row primitives.
- `SignOutButton` moved `account/` → `components/`. Sign-out now lives only on the
  profile, so one page owns the session; `/account` links across to it.
- `/profile` added to `GUARDED_PREFIXES` and `privateRoutePrefixes`.

The navbar profile icon is a **static** link for signed-in and signed-out visitors
alike, letting the route guard bounce anonymous ones. Making it session-aware would
have forced every statically generated public SEO page into dynamic rendering.

## Phase 2 — Active plan and history

`/orders/active` returns a *single* order, not a list — the backend allows one live
plan at a time. `/account` became three sections: Active plan (with usage bar),
Ready to use, History.

`src/lib/order-groups.ts` holds the logic. The subtlety: `/orders/active` expires a
depleted plan **as a side effect** of being called, so it knows about expiries the
`/orders` list does not. It is fetched first, and `resolveOrderSections` treats it
as the authority — demoting a plan the list still calls active, promoting one the
list has not caught up with, and falling back to the list grouping when the active
lookup fails.

Usage is fetched for the live plan only; per-order usage is one upstream round-trip
each, so the rest load theirs on the detail page. The detail page also gained plan
history from `/orders/:id/packages`.

Deviation from mobile: stacked sections rather than filter tabs, so no client state
is needed.

## Phase 3 — Top-up

`TopUpPanel` → `/api/payments/topups/intent` → Pokpay → `/account/topup/return` →
`/payments/topups/provision` → `/account/:id?topup=1`.

The provisioning response **cannot identify the eSIM**: it returns the provider's
top-up record, and the payment reference the backend parses yields only the ICCID.
So `esim_pending_topup` carries `orderId:paymentId`, set at intent time and cleared
on return. It doubles as the payment-id fallback when Pokpay returns without one.

Carried over from the purchase flow: only a 402 reports `reason=unpaid`; any other
failure reports `reason=provisioning`, because anything else may have taken the card.

`/account/topup/return` is in `UNGUARDED_PATHS`. It sits under the guarded
`/account` prefix and would otherwise bounce a buyer to sign-in *after paying* if
their session lapsed during checkout. Next resolves the static `topup` segment ahead
of `[orderId]`.

`buildClearedSessionCookies` now also clears the top-up cookie, so signing out
cannot leave a payment reference behind.

## Phase 4 — Billing and account deletion

`PUT /user/card-details` returns **410 Gone** — saved cards are deliberately
disabled, cards are entered on Pokpay's hosted checkout. So `/profile/billing` has
an editable billing address form (`GET`/`PUT /user/billing-address`) and an
explainer panel for cards, matching mobile's `BillingSettingsScreen`, which is also
purely informational. Address validation stays on the backend, which owns the rules
and the messages.

Deletion is two-step and honest that service records may be retained for payment,
fraud, tax and provider obligations. Two details that would otherwise have been bugs:

- Cookies are cleared **only on success**. Clearing them after a failed deletion
  would strand the visitor outside an account that still exists.
- `/profile/deleted` is in `UNGUARDED_PATHS` — it is reached with the session
  deliberately destroyed.

`backendFetch` gained `PUT` in its method union.

## Phase 5 — Google and Apple sign-in

`SocialSignInButtons` (Google Identity Services + Sign in with Apple JS) on
`/signin`, with `LinkEmailStep` for the claim-by-OTP flow when the backend answers
`linkRequired`. The link ticket stays in component state and never reaches a URL.

Each button renders only when its client id is configured, so an unconfigured
deploy shows email sign-in alone rather than a button that 503s.

`/profile` gained a **Sign-in methods** section listing linked providers
(`GET /auth/identities`) with unlink (`DELETE /api/auth/identities/[provider]`).
The backend's 409 — refusing to unlink the only way into an account — is surfaced
verbatim. A private relay identity shows as "Hidden email", never as an inbox the
user would recognise. This closes the follow-up noted in
`GOOGLE_APPLE_AUTH_READINESS.md`, on web only; the mobile profile still has no
such UI.

**Not verifiable without credentials.** See `GOOGLE_APPLE_AUTH_READINESS.md`:

- Google needs `GOOGLE_WEB_CLIENT_ID` on the backend, `NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID`
  here, and the site origin in the Google Cloud authorized JavaScript origins.
- Apple needs a Services ID with domain verification and return URL, set as
  `APPLE_SERVICES_ID` on the backend and `NEXT_PUBLIC_APPLE_SERVICES_ID` here.

### Known limitation

The web Apple route deliberately does **not** send `authorizationCode`. The backend
exchanges codes against `APPLE_BUNDLE_ID` (the native client), and a code minted for
the web Services ID would be rejected by Apple. The consequence: a **web-only** Apple
account has no stored refresh token, so revoke-on-delete does not cover it.

Native sign-in is unaffected, and revocation is inert everywhere until
`APPLE_TEAM_ID`/`APPLE_KEY_ID`/`APPLE_PRIVATE_KEY` are set. Fixing it properly needs
a per-client client-secret JWT, a client-id parameter on the exchange, and a record
of which client minted each stored refresh token so revocation uses the right one.

## Verification

`pnpm exec tsc --noEmit` clean, `pnpm build` succeeds, 212 tests pass (126 before).
`/profile/deleted` builds static; `/`, `/destinations` and `/signin` stayed static.

Four failures in `landing.test.ts` and `hero-package-search.test.ts` **pre-date this
work** — confirmed by stashing and re-running on a clean tree. Untouched.

Not verified end to end: the top-up flow against a live Pokpay checkout, and social
sign-in against real provider credentials.
