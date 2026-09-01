---
date: 2026-09-01
tags: [public-content-pages]
status: complete
---

# Session: discount_price_display

## What existed before
Backend `toESIMPackage()` has computed `hasDiscount`/`retailPrice`/
`discountType`/`discountValue` per package since 2026-08-23 (admin package
pricing overrides, `/xpricing`), and both `GET /api/packages` and
`GET /api/packages/groups` already return them. But the public web
frontend's `HeroPackageOption`/`ApiPackage` types (`services/packages.ts`)
never carried those fields through, so nothing on the public site — Hero
search, destination pages, checkout — could ever show a discount even when
one was active. Confirmed live that the current catalog has zero discounted
packages (`hasDiscount: false` on all 2005), so there was nothing to
observe either way before this session.

## What was done
- `services/packages.ts`: added `hasDiscount?`/`retailPrice?` to both
  `HeroPackageOption` and `ApiPackage`, and copied them through in
  `mapPackageToOption` — guarded so a malformed backend response (e.g.
  `hasDiscount: true` with no `retailPrice`, or a `retailPrice` that isn't
  actually higher than the current price) never produces a nonsensical
  "was €0, now €5" display.
- New `services/discountPricing.ts`: `hasActiveDiscount()` (type guard),
  `formatOriginalPrice()` (formats `retailPrice` reusing whatever currency
  prefix the already-formatted `price` string carries, since the backend
  only sends `price` pre-formatted), `discountPercentOff()` (computed from
  the actual before/after amounts rather than `discountType`/`discountValue`,
  so it's correct for both percentage and flat discounts).
- Wired into the three public price displays that share `HeroPackageOption`:
  `checkout/page.tsx`'s total row, and `DestinationPlans.tsx`'s
  `FeaturedPlan` and `CompactPlanCard`. Each shows a `-N%` badge plus a
  strikethrough original price next to the current price when
  `hasActiveDiscount(plan)`, otherwise unchanged.
- Tests: `discountPricing.test.ts` (7, pure formatting/percent logic) +
  `discount-display-wiring.test.ts` (3, source-string wiring checks, same
  pattern as this repo's other component-wiring tests).

## How it was done
Branch `feature/homepage-redesign`, same session. **Could not verify
against real discount data**: the live catalog currently has zero
discounted packages, and setting one requires the hidden `/xpricing` admin
dashboard, which needs a login I don't have credentials for and won't enter
on the user's behalf regardless. Confidence instead comes from: full
TypeScript coverage through the data flow, 7 unit tests on the formatting/
percent-off math, `tsc --noEmit` clean, `pnpm build` succeeds. Asked the
user to set a test discount via `/xpricing` themselves and check
`/destinations?country=X` + `/checkout?package=...` for the package they
discount.

Unrelated to this feature: hit the same `.next` build-cache race as earlier
sessions today (`pnpm build` run while `next dev` was live) — fixed the
same way, `rm -rf .next` + restart.

## Outcome (first pass)
`pnpm exec tsc --noEmit` clean, `pnpm exec vitest run` — 282/282 pass (10
new), `pnpm build` succeeds. **Not** browser-verified against a real
discount — flagged to the user as an open item pending their own test via
`/xpricing`.

## Follow-up: real bug in the first pass's guard
User reported live: packages they know are discounted (backend confirmed
supporting it, and already working correctly on the `velocity-eSim` mobile
app) still only showed the plain price on the web frontend — no
strikethrough/badge.

Root cause: `mapPackageToOption` (`services/packages.ts`) only copied
`hasDiscount`/`retailPrice` through when `retailPrice > priceNumeric`. That
guard was extra caution added in the first pass that mobile's equivalent
(`formatRetailPriceLabel` in `velocity-eSim/src/currency/formatPrice.ts`)
does **not** have — mobile trusts the backend's `hasDiscount` flag directly,
with no magnitude comparison. An admin discount can also mark a price *up*
(`discountDirection: 'increase'`, still `hasDiscount: true` on the backend,
per backend fact f107) — for that case, and any other where `retailPrice`
ends up `<= priceNumeric`, the web guard silently dropped the entire
discount display (badge *and* strikethrough) instead of just hiding the "-N%"
badge the way mobile does.

Fixed by removing the magnitude guard from `mapPackageToOption` entirely
(now matches mobile: `hasDiscount && retailPrice != null`, nothing else) and
splitting `discountPricing.ts`'s two pieces so they degrade independently,
same as mobile's `formatRetailPriceLabel`/`formatDiscountBadge` split:
`hasActiveDiscount` still gates the strikethrough original price
unconditionally; `discountPercentOff` now returns `null` (hiding just the
badge) when the computed percent isn't positive, instead of the whole
discount UI depending on that check. All three call sites
(`checkout/page.tsx`, `DestinationPlans.tsx`'s `FeaturedPlan`/
`CompactPlanCard`) updated to render the strikethrough regardless and the
badge only when non-null.

## Outcome (final)
`pnpm exec tsc --noEmit` clean, `pnpm exec vitest run` — 286/286 pass (4
more added: the increase-direction case in both `discountPricing.test.ts`
and `packages.test.ts`). Still not verified against a real discount in this
session (same access limitation as the first pass) — but the logic now
exactly mirrors mobile's already-proven implementation rather than adding
independent (and, as it turned out, buggy) caution.
