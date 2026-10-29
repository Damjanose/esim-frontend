# 2026-10-30: Admin operations review fixes

## What changed
- Navigation logout now uses the operations dashboard's owning session, including immediately after sign-in.
- Dashboard and provider fetches ignore obsolete responses before authorization effects. Leaving a purchase queue aborts its pending checks; late completion cannot remove a replacement request.
- Provider results with per-SIM errors use a 30-second client cache lifetime; successful results retain the 20-minute lifetime.
- Added behavioral regressions for rendered logout availability/ownership, provider cache lifetimes, cancellation, stale 401s, request coalescing and serial scheduling. No dependencies added.

## Validation
- The logout availability regression and four asynchronous regressions failed before their fixes, then passed.
- `pnpm exec tsc --noEmit` passed; full `pnpm test` passed with 139 files and 1,083 tests.
- `pnpm build` passed, including optimized compilation, lint/type validation and all 181 static pages.
- `git diff --check` passed; independent second review found no remaining material issue.
