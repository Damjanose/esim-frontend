# 2026-10-02: Web UI polish, phase 9: partner pages

Built in fast mode, with no separate plan document (owner asked for a cheaper model and a faster pace).

## What changed
- **`partners/partnerShellItems.ts`**: the sidebar items for `AccountShell`.
- **Dashboard**: in the shell, with the wallet as the blue card, white tiles, and a "Partner tools" list on phones.
- **Buy for a customer**: the picker uses `PlanDataDisc`/`PlanPrice`.
- **Withdraw, request, status, materials**: restyled with field classes, 44px controls and one gradient per view.

API calls, gating and copy are unchanged. One test assertion changed: `WalletPanel` now takes `walletBalanceCents`.

## Verification
- `pnpm test`: 101 files, 742 passed. The one failure is the known one, from the owner's homepage WIP. `tsc` is clean.
- **Read-only mock backend**: covers `/partners/me`, `/partners/me/dashboard` and `/partners/me/payouts`, with an Active partner fixture.
- **Playwright**: 6 pages × 5 widths. No horizontal scroll, no control under 44px in page content, at most 1 gradient, 0 refused writes.
- **Script note**: the navbar's own links counted as "small" because the navbar renders inside `<main>`. The navbar logo link is 36px on phones; that's for the final pass.

## Commits
`d8d9a51` nav items, `9d7c816` dashboard, `9c94c72` buy, `c6760de` other pages, then this docs commit.
