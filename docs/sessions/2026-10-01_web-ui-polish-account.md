# 2026-10-01: Web UI polish, phase 6: account + profile

## Goal
Spec section 6: a sidebar dashboard on desktop (B) and the app's My eSIMs plus grouped settings on phones (A), for `/account`, `/account/[orderId]`, `/profile`, `/profile/billing` and `/profile/deleted`. Content and flows are unchanged. Plan: `docs/superpowers/plans/2026-10-01-web-ui-polish-phase6-account.md`.

## Bug fixed
**"0 MB of 0 MB remaining" on every live plan.** `summariseUsage` read `total`/`remaining`, but the backend sends `data_total_mb` / `data_remaining_mb` / `is_unlimited`. I confirmed the field names in `E-SIM backend/src/services/airalo.service.ts`. It now reads both shapes, and unlimited plans show "No data cap". Commit `379607c`, fact f220, plus a troubleshooting entry.

## What changed
- **`lib/accountEsims.ts`**: status, days left, Buy again, the primary-action rule, the usage meter, and top-up rows.
- **`lib/accountNav.ts`**, `AccountShell`, `accountShellItems`, `SettingsGroup`, and the `nav`/`row` sign-out appearances.
- **`UsageRing`**, `ActiveEsimCard`, `StatusBadge`, `EsimFlag`.
- **`/account`**: the ring dashboard at lg and the app's My eSIMs on phones. The fetch block is unchanged and `PlanCard.tsx` is deleted.
- **`/account/[orderId]`**: usage and install cards, top-ups as plan rows, a 44px copy button. Banners and `PurchaseConversion` are unchanged.
- **`/profile`**: `?tab=` sections in the sidebar, grouped settings on phones. `SettingsSection.tsx` is deleted.
- **`/profile/billing`** sits in the shell. **`/profile/deleted`** is a status card and stays static.

## Decisions
1. **Gradient = the first unfinished step:** the newest ready plan's Install, otherwise Top up. Easy to flip.
2. **Usage fills with data left,** like the app.
3. **Follow-up:** the order page's H1 is still the raw package id. A one-line swap to the friendly name is suggested.

## Verification (no real account, f223)
- `pnpm test`: 92 files, 693 passed. The one failure is the known one in `landing.test.ts`, caused by the owner's uncommitted homepage WIP, not by this phase. `tsc` is clean.
- `pnpm build`: route types are unchanged, and `/profile/deleted` stays ○.
- **Mock-backed Playwright matrix**: 44 page/width checks across 3 fixtures, the order page, profile tabs, billing, deleted and the guard redirect. Result: 0 issues (no horizontal scroll, CLS 0, at most 1 gradient, no control under 44px) and 0 refused writes.
- **Lighthouse on mock-backed `/account`**: a11y 1.0, CLS 0, LCP 2.61s.

## Owner WIP in the tree (not committed by this work)
`src/app/page.tsx`, `src/app/how-it-works.test.ts`, `public/images/app-store.png` (160 KB → 4.6 MB, should be compressed) and `public/images/how-it-works-app-screens.png`. They cause the one known `landing.test.ts` failure. Phase 7 (homepage blocks) overlaps this WIP, so check with the owner first.

## Commits
`d78d026` plan, `379607c` usage fix, `6082713` rules, `9a00411` shell, `ea7cc1a` usage cards, `3d3b557` /account, `b7bd316` order detail, `1fa800a` profile, `0b84e69` billing/deleted, then this docs/feedAI commit.
