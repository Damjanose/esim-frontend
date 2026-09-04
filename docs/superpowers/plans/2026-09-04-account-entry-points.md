# Account Entry Points Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the already-built sign-in/account system reachable and enforce sign-in before, not after, filling out the partner request form.

**Architecture:** Two independent, surgical changes to existing code — no new routes, components, or auth mechanism. (1) Add `/partners/request` to the existing route-guard's protected-prefix list. (2) Re-enable a commented-out nav link that already points at a guarded route (`/profile`), letting the pre-existing middleware guard handle signed-in/signed-out branching.

**Tech Stack:** Next.js 15 App Router, TypeScript, Vitest (node environment, source-string assertion pattern — no React Testing Library in this repo).

**Spec:** `docs/superpowers/specs/2026-09-04-account-entry-points-design.md`

---

### Task 1: Gate `/partners/request` behind sign-in

**Files:**
- Modify: `src/lib/route-guard.ts:1-5` (comment + `GUARDED_PREFIXES` array)
- Modify: `src/app/partners/request/page.tsx:20-27` (stale comment only — logic unchanged)
- Test: `src/lib/route-guard.test.ts`

- [ ] **Step 1: Write the failing test**

Add to `src/lib/route-guard.test.ts`, inside the existing `describe("guardedRedirect", ...)` block:

```ts
  it("sends anonymous visitors from the partner request form to sign-in", () => {
    expect(guardedRedirect("/partners/request", "", false)).toBe(
      "/signin?next=%2Fpartners%2Frequest"
    );
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- route-guard`
Expected: FAIL — `/partners/request` currently resolves to `null` (unguarded), not a redirect string.

- [ ] **Step 3: Update `route-guard.ts`**

Current top of file:

```ts
// "/partners/status" is guarded but "/partners/request" deliberately isn't:
// the request page is reachable while signed out (it only requires sign-in at
// submit, so a visitor can see what partnering involves first), while the
// status page always needs a session to mean anything.
const GUARDED_PREFIXES = ["/account", "/checkout", "/profile", "/partners/status"];
```

Replace with:

```ts
const GUARDED_PREFIXES = [
  "/account",
  "/checkout",
  "/profile",
  "/partners/status",
  "/partners/request"
];
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- route-guard`
Expected: PASS (all cases in `route-guard.test.ts`, including the new one)

- [ ] **Step 5: Update the stale comment in `partners/request/page.tsx`**

Current comment (lines ~20-27 of `src/app/partners/request/page.tsx`):

```tsx
  // A visitor who already has a Partner row (any status) belongs on the
  // status page, not back on the request form — check without forcing a
  // sign-in redirect here, since a signed-out visitor should still be able
  // to see the form (they'll be sent to sign in on submit instead).
  const jar = await cookies();
```

Replace with:

```tsx
  // middleware.ts already guarantees a session cookie is present by the time
  // this renders (see GUARDED_PREFIXES in route-guard.ts). This check exists
  // for a different reason: a visitor who already has a Partner row (any
  // status) belongs on the status page, not back on the request form.
  const jar = await cookies();
```

No other logic in this file changes — the existing partner-row lookup and
expired-access-token refresh redirect both still apply exactly as before.

- [ ] **Step 6: Confirm the rest of the file's behavior is untouched**

Run: `pnpm test -- partners-pages`
Expected: PASS (existing assertions in `src/app/partners/partners-pages.test.ts` are about page structure/content, not the guard, so none should break)

- [ ] **Step 7: Commit**

Ask the user for confirmation before running `git commit` (per repo working practices — every commit needs explicit confirmation, no exceptions for plan-driven work).

```bash
git add src/lib/route-guard.ts src/lib/route-guard.test.ts src/app/partners/request/page.tsx
git commit -m "$(cat <<'EOF'
fix: require sign-in before showing the partner request form

Previously a signed-out visitor could fill out the whole partner
request form and only discover they needed to sign in at submit time,
losing their input. Gating /partners/request the same way as every
other account route (/account, /checkout, /profile, /partners/status)
sends them to sign-in first instead.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01S211HsVTvYcaeXuXHpi5u9
EOF
)"
```

---

### Task 2: Re-enable the account entry point in the navbar

**Files:**
- Modify: `src/app/components/Navbar.tsx:1-2` (import), `:100-118` (uncomment block)
- Test: `src/app/public-shell.test.ts`

- [ ] **Step 1: Write the failing test**

Add to `src/app/public-shell.test.ts`, inside the existing `describe("public navigation shell", ...)` block:

```ts
  it("links to the account entry point, letting the route guard handle signed-in vs signed-out", () => {
    const navbar = readFileSync("src/app/components/Navbar.tsx", "utf8");

    expect(navbar).toContain('href="/profile"');
    expect(navbar).toContain("UserRound");
    expect(navbar).not.toContain("Showroom mode");
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- public-shell`
Expected: FAIL — `Navbar.tsx` currently has the profile link commented out, so `href="/profile"` and `UserRound` are absent (or only present inside a comment, which `toContain` would still match — but the `not.toContain("Showroom mode")` assertion will fail against the current file).

- [ ] **Step 3: Update the import in `Navbar.tsx`**

Current:

```tsx
import { landingContent } from "@/content/landing";
import { Handshake } from "lucide-react";
import { LinkButton } from "./Button";
```

Replace with:

```tsx
import { landingContent } from "@/content/landing";
import { Handshake, UserRound } from "lucide-react";
import { LinkButton } from "./Button";
```

- [ ] **Step 4: Replace the commented-out block**

Current block (immediately after the "Partner with us" `<a>` and before `<LinkButton>`):

```tsx
          {/* Showroom mode: no purchase/account functionality yet, so the profile
              entry point is commented out rather than deleted.
              Static on purpose: the navbar renders on statically generated public
              pages, so it must not read cookies. Signed-out visitors are sent on
              to sign-in by the route guard.
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
          */}
```

Replace with:

```tsx
          {/* Static on purpose: the navbar renders on statically generated public
              pages, so it must not read cookies. The link always points at
              /profile — the middleware guard sends signed-out visitors to
              /signin?next=/profile and lets signed-in visitors straight through. */}
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

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm test -- public-shell`
Expected: PASS

- [ ] **Step 6: Run the full test suite**

Run: `pnpm test`
Expected: PASS (no regressions elsewhere — this is the last change in the plan)

- [ ] **Step 7: Manual check in the dev server**

Run: `pnpm dev`, open the site in a browser.
- Signed out: click the new account icon in the navbar → redirected to `/signin?next=%2Fprofile`.
- Complete sign-in → landed on `/profile`.
- Reload any public page while signed in → account icon click goes straight to `/profile`, no redirect.

- [ ] **Step 8: Commit**

Ask the user for confirmation before running `git commit`.

```bash
git add src/app/components/Navbar.tsx src/app/public-shell.test.ts
git commit -m "$(cat <<'EOF'
feat: restore the account entry point in the site navbar

The profile/account link was commented out with a "showroom mode, no
account functionality yet" note that's stale — sign-in, account, and
purchase flows already exist and share the mobile app's backend
identity. Re-enabling the link makes them discoverable; the existing
middleware guard on /profile (already used by /account and /checkout)
handles signed-in vs signed-out with no new logic in the navbar itself.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01S211HsVTvYcaeXuXHpi5u9
EOF
)"
```

---

## After both tasks

- Update `feedAI/facts.jsonl` with a fact describing the new invariant: `/partners/request` now requires sign-in like every other account route, and the navbar always exposes a `/profile` entry point (per root `CLAUDE.md`'s "shipping a new feature" working practice — this is a behavior change worth a future session knowing without re-reading the diff).
- Append a session doc: `docs/sessions/YYYY-MM-DD_account-entry-points.md`, plus a row in `docs/sessions/INDEX.md`.
