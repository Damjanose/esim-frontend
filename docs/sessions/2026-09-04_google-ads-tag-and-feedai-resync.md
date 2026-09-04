---
date: 2026-09-04
tags: [analytics, feedai, admin, partners]
status: complete
---

# Session: google-ads-tag-and-feedai-resync

## What existed before

Google Ads sent a "set up a Google tag" reminder for tracking id `AW-11016325088`,
with no gtag.js anywhere on the site and no purchase-conversion event. Separately,
feedAI's own health check (`feedAI/check-health.sh`, run from the pre-commit hook)
was blocking on 19 undocumented commits since the last 2026-09-02 sync: the full
affiliate/partner program (built in one day, 2026-09-03) and the `/xactivityy`
admin page had never gotten facts.jsonl entries, and `index.json` was missing three
topic files (`public-content-pages`, `admin-dashboard-ui`, `account-profile-pages`)
that `brain.json`'s route map already pointed at.

## What was done

**Google Ads tag:**
- `src/lib/analytics.ts` — tracking id/label constants, overridable via
  `NEXT_PUBLIC_GOOGLE_ADS_ID` / `NEXT_PUBLIC_GOOGLE_ADS_PURCHASE_LABEL`.
- `src/app/GoogleTag.tsx` — loads gtag.js via `next/script`, mounted in the root
  layout's `<head>`.
- `src/app/account/[orderId]/PurchaseConversion.tsx` — fires a `conversion` event
  (transaction_id = order code) on the `?new=1` checkout-confirmation view, deduped
  per order via `sessionStorage`.
- Pinned the same id/label explicitly in `.env.production`, per this repo's own
  invariant that a prod `NEXT_PUBLIC_*` value must be committed there or it simply
  doesn't exist in production (f029).

**feedAI resync (19 commits, 2026-09-02 through 2026-09-04):**
- Added `feedAI/topics/partners.json`, a new topic covering both the `/xpartnersy`
  hidden admin page and the full customer-facing partner program (`/partners/request`,
  `status`, `dashboard`, `buy`, `withdraw`, `materials`, plus the wallet subsystem)
  and every BFF proxy behind them.
- Backfilled `admin-dashboard-ui.json` with short entries for `/xactivityy` and a
  pointer to `partners.json` for `/xpartnersy`, trimmed to stay under the 10KB budget.
- Added a `promo_code` and `conversion_tracking` section to `account-flows.json` for
  the checkout promo-code feature and this session's Google Ads work.
- Added `facts.jsonl` entries f091-f095.
- Fixed `index.json`'s topic list, which had drifted out of sync with `brain.json`'s
  route map (3 pre-existing topic files were undiscoverable via the index).
- Bumped `brain.json`'s `sync` block and `phase.next`.

## How it was done

Read each undocumented commit's diff and (already very thorough) commit message
directly rather than re-deriving behavior from scratch — the commits themselves
had good "why" context, just no feedAI trace. Kept `partners.json` as its own file
instead of growing `admin-dashboard-ui.json` (already near budget) or
`account-flows.json` past their 10KB limits.

**Known follow-up, not done in this pass:** `brain.json` itself is ~22KB, well over
its own 10KB budget in MAINTAIN.md — `note_latest` has been an accumulating history
string across many sessions. `check-health.sh` only checks `topics/*.json` sizes, so
this was never caught automatically. Trimming that history (without violating the
"never delete without a facts.jsonl line" rule) is a distinct task, flagged in
`brain.json -> phase.next` for a future session.

## Outcome

`pnpm exec tsc --noEmit`, `pnpm build`, and `pnpm test` (430/430) all pass.
`feedAI/check-health.sh` exits clean (budget, staleness, and unmentioned-files
checks all pass). Pre-commit hook unblocked.
