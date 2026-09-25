# Admin httpOnly session cookie + password visibility

Date: 2026-09-25
Status: approved (conversation)
Repos touched: `E-SIM-frontend` only

## Problem

Admin dashboards (`/xloginy` and siblings) keep the admin access token in
`sessionStorage` under `velocity-admin-dashboard-token`. Closing the tab clears
it, so admins must re-enter credentials every visit. The token is also
JS-readable (XSS risk), unlike the public user session which already uses
httpOnly cookies (`esim_at` / `esim_rt`).

The login password field has no show/hide control.

## Goal

1. Persist the admin session across browser restarts until explicit logout,
   token expiry (~12h), or a 401 from the BFF.
2. Keep the admin token out of JavaScript-accessible storage by using an
   httpOnly cookie set by the BFF (same trust model as public auth).
3. Add a password visibility toggle (eye icon) on `AdminLoginCard`.

## Non-goals

- Changing backend admin token format, signing, or TTL.
- “Remember me” checkbox or indefinite sessions beyond the backend TTL.
- Storing or encrypting the admin password.
- Migrating public user auth (already cookie-based).

## Cookie contract

Mirror `src/lib/session.ts`:

| Property | Value |
| --- | --- |
| Name | `esim_admin_at` |
| httpOnly | `true` |
| sameSite | `"lax"` |
| path | `"/"` |
| secure | `true` only when `NODE_ENV === "production"` (local/LAN http must work) |
| maxAge | backend `expiresInSeconds` (admin dashboard token TTL = 12 hours) |

Helpers (same shapes as user session):

- `ADMIN_ACCESS_COOKIE = "esim_admin_at"`
- `buildAdminSessionCookie(token, expiresInSeconds)`
- `buildClearedAdminSessionCookie()`

Prefer extending `session.ts` (or a small adjacent `admin-session.ts` if that
keeps user-session tests cleaner) — do not invent a third cookie-options path.

## BFF routes

### `POST /bff/admin/login` (existing — change behavior)

- Proxy credentials to backend `POST /admin/login` as today.
- On success: set `esim_admin_at` via `successJson` / `applyCookies`.
- Response body must **not** include the token (mirror OTP verify:
  “Tokens go into httpOnly cookies only — never into the response body”).
- Body may include non-secret success metadata if useful (e.g. empty object or
  `{ expiresInSeconds }`); never `data.token`.

### `POST /bff/admin/logout` (new)

- Clears `esim_admin_at` (`maxAge: 0`).
- No backend call required.

### `GET /bff/admin/session` (new)

- If cookie present and non-empty → `{ status: "success", data: { authenticated: true } }` (200).
- Otherwise → 401 with `{ status: "error", … }`.
- Optional hardening: probe a cheap backend admin endpoint with the cookie
  token; not required for v1 if 401s from real page loads already clear state.
  Prefer a real validation probe if cheap (avoids showing the dashboard shell
  with a stale cookie until the first data fetch fails).

### All other `/bff/admin/*` proxies

Update `readAdminBearer` in `src/lib/admin-bff.ts`:

1. Prefer `esim_admin_at` cookie.
2. Fall back to `Authorization: Bearer …` during migration, then remove the
   fallback once all client pages stop sending it (same PR is fine if every
   caller is updated).

BFF continues to forward `Authorization: Bearer <token>` to Express —
**no backend route changes**.

## Client session (`useAdminSession`)

- Remove reads/writes of `sessionStorage` / `ADMIN_TOKEN_STORAGE_KEY`.
  On boot, `sessionStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY)` once for
  cleanup of old installs.
- Replace `token: string` with `isAuthenticated: boolean` (plus a short
  `isChecking` while the session probe runs, so pages don’t flash the login
  form before hydration).
- Mount: `GET /bff/admin/session` → set `isAuthenticated`.
- Login: `POST /bff/admin/login`; on success set `isAuthenticated = true`
  (no token handling).
- Logout / `handleUnauthorized`: `POST /bff/admin/logout` (best-effort), clear
  local auth state.

## Admin pages

Every admin surface that currently does
`headers: { Authorization: \`Bearer ${token}\` }` must stop sending that
header. Same-origin `fetch` already includes cookies.

Gate UI on `isAuthenticated` instead of `token` (including loading: wait for
`isChecking` before showing the login card).

Touched surfaces (non-exhaustive; grep for Bearer / `useAdminSession`):

- `xloginy`, `xerrors`, `xpricing`, `xversion`, `xnotificationy` (+ individual tab),
  `xactivityy`, `xpartnersy`, `xsupport`, `xtestimonialsy`, `xtripplany`

Optional: a small `adminFetch(input, init)` helper that centralizes
`credentials: "same-origin"` and 401 → caller’s `handleUnauthorized`. Nice to
have; deleting Bearer headers alone is sufficient if pages already handle 401.

## Password visibility (`AdminLoginCard`)

- Local `showPassword` state.
- Input `type={showPassword ? "text" : "password"}`.
- Toggle button with lucide `Eye` / `EyeOff`, positioned inside the password
  field row (absolute right), matching existing admin form styling
  (rounded-xl, cyan focus ring).
- Accessible: `aria-label` “Show password” / “Hide password”,
  `type="button"` so it does not submit the form.

## Error handling

| Case | Behavior |
| --- | --- |
| Bad credentials | Login form error; no cookie set |
| Expired / invalid cookie | Session probe or data fetch 401 → logout path → login form |
| Mid-session 401 | `handleUnauthorized` clears cookie + state |
| Network error on logout | Still clear local `isAuthenticated` so UI unlocks |

## Testing

- Cookie builder unit tests (httpOnly, maxAge, clear, secure-in-prod) following
  `session.test.ts`.
- Login route: sets httpOnly cookie; body has no token.
- Logout route: clears cookie.
- Session route: 200 vs 401.
- `readAdminBearer`: cookie preferred over header (if fallback kept briefly).
- Update existing source-contract tests that assert `sessionStorage` or client
  Bearer usage (`xloginy/admin-dashboard.test.ts`, etc.).
- Manual: login → close tab → reopen still authenticated; Logout clears;
  password eye toggles.

## Risks

- Large touch surface on admin pages (many Bearer headers). Prefer one PR that
  finishes the cutover so cookie and client stay in sync.
- Stale cookie until first 401 if session probe is cookie-presence-only —
  mitigate with a real backend probe on `/bff/admin/session` when practical.
