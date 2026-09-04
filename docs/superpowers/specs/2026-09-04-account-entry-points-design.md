# Account entry points: nav sign-in link + partnership pre-auth gate

## Context

The web app already has a fully working user-facing account system, sharing the
same backend identity as mobile (normalized email; OTP + Google/Apple converge
on one `User` row):

- `/signin` — email OTP + Google/Apple sign-in
- `/account`, `/account/[orderId]`, `/account/topup` — order tracking, top-ups
- `/profile`, `/profile/billing` — profile management, linked providers
- `/checkout` — reachable from `/destinations` plan cards, same Pokpay/Airalo flow as mobile
- Session model: `esim_at`/`esim_rt` httpOnly cookies (`src/lib/session.ts`),
  enforced by `src/middleware.ts` + `src/lib/route-guard.ts` for
  `GUARDED_PREFIXES = ["/account", "/checkout", "/profile", "/partners/status"]`

Investigation found two concrete gaps rather than a missing system:

1. **`src/app/components/Navbar.tsx`** has the profile/account link commented
   out entirely, with the note *"Showroom mode: no purchase/account
   functionality yet"* — that's stale; the functionality exists. Result:
   there is no sign-in entry point anywhere in the public site nav.
2. **`src/app/partners/request/page.tsx`** deliberately allows signed-out
   visitors to fill out the partner request form and only checks
   authentication at submit time, redirecting to `/signin` and losing the
   filled-in form. `src/lib/route-guard.ts` explicitly excludes
   `/partners/request` from `GUARDED_PREFIXES` for this reason.

This spec covers closing both gaps. It does not touch the `x*` admin
dashboard, the BFF layer, or the backend — no new auth mechanism, no new
routes, no new pages.

## Change 1 — Gate `/partners/request` before render

**File:** `src/lib/route-guard.ts`

Move `/partners/request` into `GUARDED_PREFIXES`, removing the comment/logic
that special-cased it as deliberately unguarded. A signed-out visitor hitting
`/partners/request` is now redirected by `middleware.ts` to
`/signin?next=/partners/request` before the page renders at all — consistent
with how `/partners/status`, `/account`, `/profile`, and `/checkout` already
behave.

**File:** `src/app/partners/request/page.tsx`

No functional change needed: by the time this server component runs, the
middleware guard guarantees a session cookie is present. The existing logic
(redirect to `/partners/status` if a `Partner` row already exists; refresh an
expired access token via `/bff/auth/refresh` before giving up) still applies
unchanged — it already assumes a signed-in-or-refreshable visitor. Only the
outdated code comment describing the old "signed-out visitors can still see
the form" behavior should be removed/updated to reflect the new gating.

**Result:** sign-in happens first, the partner form is never shown to a
signed-out visitor, and the session cookie set at sign-in persists across
future visits (no per-visit re-login) — this is what "remembered" means here,
identical to every other guarded route.

## Change 2 — Re-enable the account entry point in the navbar

**File:** `src/app/components/Navbar.tsx`

Un-comment and restore the icon link currently disabled with the "Showroom
mode" note. It links to `/profile` — the *same* URL regardless of auth state.

```tsx
<a
  aria-label="Your profile"
  className={[
    "grid h-11 w-11 place-items-center rounded-full border transition",
    isDark
      ? "border-white/30 text-white/80 hover:border-white/60 hover:text-white"
      : "border-outline text-onSurfaceVariant hover:border-brandBlue/40 hover:text-brandBlue",
  ].join(" ")}
  href="/profile"
>
  <UserRound aria-hidden="true" size={19} />
</a>
```

(Restore the `UserRound` import from `lucide-react` alongside the existing
`Handshake` import.)

No new client-side auth check is added to the navbar. `Navbar` stays a static
server component with no cookie read, matching its existing documented
constraint (it renders on statically generated public pages). The
signed-in/signed-out branch is handled entirely by the pre-existing
middleware guard on `/profile`:

- Signed out → redirected to `/signin?next=/profile`
- Signed in → lands on their profile directly

Because the guard already exists, this is a pure UI re-enable with no new
logic anywhere.

## Out of scope

- No changes to `/signin`, `/account`, `/checkout`, the BFF layer
  (`src/app/bff/*`), or the backend.
- No changes to the `x*` admin dashboard or its separate `bff/admin/*` auth.
- No client-side session-state detection (e.g. showing "My Account" vs "Sign
  In" with different labels) — out of scope per user's confirmed design; the
  icon link resolves correctly either way via the guard, just with one static
  label/icon.
- No homepage CTA changes — user confirmed header/nav-only for this pass.

## Testing

- Existing route-guard tests (`src/lib/route-guard.test.ts` if present, or
  equivalent) should gain a case asserting `/partners/request` now redirects
  when signed out.
- `Navbar` test coverage (if present) should assert the profile link renders
  and points to `/profile`.
- Manual check: sign out, visit `/partners/request` directly → redirected to
  `/signin?next=/partners/request`; complete sign-in → landed back on the
  partner request form with an empty (never-submitted) form, as expected.
- Manual check: click the new nav icon while signed out → `/signin`; while
  signed in → `/profile`.
