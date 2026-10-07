---
date: 2026-10-07
tags: [admin, bff]
focus: web
status: complete
---

# Session: weekly base price + markup (xpricing)

## What existed before
`/xpricing` edited an absolute sell price per package as "profit" (sell = buy + profit), clamped
between buy and Airalo's suggested sell. A "Bulk profit" panel set or adjusted profit for many packages.

## What was done
- The backend now prices every package at weekly-frozen Airalo buy price × (1 + markup %), capped at
  Airalo's suggested sell (backend session `E-SIM backend/docs/sessions/2026-10-07_weekly-base-price-markup.md`).
- New **Pricing basis** panel: a "Default markup %" input with save (`bff/admin/pricing/settings`
  GET/PUT), "Airalo prices last updated" and **Refresh prices now** (`bff/admin/packages/pricing/refresh-base`).
- **Bulk markup** replaces Bulk profit (`bff/admin/packages/pricing/bulk-markup`, the renamed bulk-profit
  route). "Use default for selected" clears package markups.
- Table: "Buy price (weekly)", a per-row **Markup %** input (empty = default), Sell price with a
  `capped` badge, and Profit (sell − buy) as read-only text. The row preview mirrors the backend's
  `computeRetailPrice` and `roundUpToHalf`.
- The reset panel copy now says reset goes back to the default markup.

## How it was done
- `src/app/xpricing/page.tsx`, BFF routes under `src/app/bff/admin/pricing/settings` and
  `src/app/bff/admin/packages/pricing/{bulk-markup,refresh-base}`, and `admin-package-pricing.test.ts` updated.
- `pnpm test`: 854 passing. `tsc --noEmit` is clean apart from stale `.next/types` for the deleted
  bulk-profit route, which regenerate on the next dev or build run.

## Outcome
Admins set one default markup and override per package where needed. Prices only move when Airalo's
weekly snapshot is captured (Monday 03:00) or when an admin clicks "Refresh prices now".
