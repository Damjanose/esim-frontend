# Account entry points: nav sign-in link + partnership pre-auth gate

**Date:** 2026-09-04

## What happened

User asked to add a login form to the web app so account state syncs with mobile, users can purchase/track packages on web, and the partnership request flow requires sign-in first and remembers it — "as now has to submit form after to login."

Investigation (before writing any code) found the whole account system already exists and shares identity with mobile: `/signin` (OTP + Google/Apple), `/account`, `/account/[orderId]`, `/account/topup`, `/profile`, `/profile/billing`, and checkout, all wired through the BFF to `E-SIM backend`. Two concrete gaps explained the user's experience:

1. `/partners/request` deliberately let a signed-out visitor fill out the whole form and only discovered at submit time that sign-in was required — losing their input. This was documented in `route-guard.ts` as intentional.
2. `Navbar.tsx`'s profile/account link was commented out behind a stale "Showroom mode: no purchase/account functionality yet" note — so there was no sign-in entry point anywhere on the public site.

## What changed

Went through brainstorming → spec → plan → subagent-driven-development (per the superpowers skills), with a visual companion for the navbar mockup, a spec review, a plan review, and per-task spec-compliance + code-quality reviews, plus a final holistic review across both commits.

1. **`src/lib/route-guard.ts`** — added `/partners/request` to `GUARDED_PREFIXES` (alongside `/account`, `/checkout`, `/profile`, `/partners/status`), removing the comment explaining why it used to be deliberately excluded. Middleware now redirects a signed-out visitor to `/signin?next=/partners/request` before the page renders at all.
2. **`src/app/partners/request/page.tsx`** — updated a comment only; the existing partner-row lookup / refresh-token logic (redirecting an existing partner to `/partners/status`) is unchanged, since it was always orthogonal to the sign-in guard.
3. **`src/app/components/Navbar.tsx`** — restored the commented-out profile/account icon link (`href="/profile"`, `UserRound` icon). No client-side auth-state detection was added — the navbar stays a static, cookie-free server component; the pre-existing middleware guard on `/profile` does all the signed-in/signed-out branching.
4. Tests: one new case in `src/lib/route-guard.test.ts`, one new case in `src/app/public-shell.test.ts`. Full suite: 432/432 passing.

Commits: `6358139` (Task 1), `39c2852` (Task 2).

## Docs

- Spec: `docs/superpowers/specs/2026-09-04-account-entry-points-design.md`
- Plan: `docs/superpowers/plans/2026-09-04-account-entry-points.md`
- feedAI: `f100` in `facts.jsonl`; updated `topics/partners.json` (the `request` entry, which was stale — said "deliberately excluded from route-guard.ts"), `topics/routing.json` (`guarded_prefixes` list), and `brain.json`'s `sync` block.

## Notes for future sessions

- `PartnerRequestForm.tsx`'s existing submit-time 401 → sign-in redirect is still meaningful post-change (a session can expire between page load and submit) — do not remove it as "now-dead code."
- `feedAI/` staleness gate (`check-health.sh`) was already tripped by unrelated same-day commits before this session started; both commits here were made with `--no-verify` after explicit user confirmation each time, since the gate's complaint predates this work. A full-day feedAI resync is still outstanding as separate follow-up work.
