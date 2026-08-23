---
date: 2026-08-23
tags: [deploy, testing-deployment]
status: complete
---

# Session: merge-and-deploy-to-production

## What existed before
The admin premium redesign + `/xpricing` work lived only on
`feature/mobile-design-parity-phase1`, 18 commits ahead of `main`. Production
(`update.sh` on the server) only ever deploys `main`.

## What was done
- Merged `feature/mobile-design-parity-phase1` into `main` (fast-forward, no
  conflicts) at the user's explicit choice, after flagging that this also ships
  the broader in-progress mobile-parity migration, not just the admin redesign.
- The merge surfaced 5 pre-existing test failures (already broken on the
  feature branch, not caused by the merge). Fixed all 5:
  - 3 in `src/content/landing.test.ts` — checked `page.tsx` for markup that had
    since moved into `src/app/components/Navbar.tsx`, or checked literal
    `AppleStoreIcon`/`GooglePlayIcon` function names that had been inlined as
    raw `<svg>`, or an old `#download` anchor that had been renamed
    `#download-app`.
  - 1 in `src/app/hero-package-search.test.ts` — literal z-index/width class
    strings from before a hero-layout redesign.
  - 1 in `src/app/core-web-vitals.test.ts` — pointed at a deleted hero asset.
    This one uncovered a real regression: the redesigned hero's `priority`
    (LCP) image was a 2MB PNG (`hero-map.png`) instead of a compressed WebP.
    Converted it with `cwebp -q 82` to `hero-map.webp` (225KB), deleted the PNG
    and the now-fully-unused old `hero-3.webp`.
- Committed the fixes (`1ec4e9c`), pushed `main`, deployed via
  `ssh root@72.61.183.120` → `/var/www/esim-frontend/update.sh`.

## How it was done
Investigated every failure before touching anything — each literal-string
assertion was checked against the actual current file to determine "stale test
following an intentional refactor" vs. "real bug." Only the hero-image size was
a genuine issue; the rest were updated to assert the same underlying guarantee
against the current (correct) structure.

## Outcome
`pnpm exec tsc --noEmit` clean, `pnpm build` succeeds, all 237 tests pass,
`pnpm test` green. Deployed and verified live: `/`, `/xloginy`, `/xerrors`,
`/xpricing` all return 200 on `https://esim.uplisoft.com`.
