# 2026-10-01: Web UI polish, phase 4: country plans

## Goal
Spec option A: app-style plan rows, a photo country banner, a sticky desktop sidebar, and a collapsed country bar on phones. It covers the static `/esim/[slug]`, the live `/destinations?country=…` view and `/pkg/[id]`. Plan: `docs/superpowers/plans/2026-10-01-web-ui-polish-phase4-plans.md`.

## What changed
- **`lib/planRow.ts`** (TDD): `planRowTags`, `planDataDisc`, `planDurationText`, `planSubtitle` and `planCoverageNote`. The discount helpers' types are widened to `DiscountPricedPlan`.
- **`destinations/planList.ts`**: the live view's filters and sorts, moved out unchanged.
- **`lib/destinationPricing.ts`**: the `/esim` rows now carry data, days, voice/SMS and discount, plus `getDestinationFlag`.
- **`components/PlanRow.tsx`** (no hooks) and its cell pieces.
- **`components/CountryBanner.tsx`** and **`components/CollapsedCountryBar.tsx`**.
- **`/esim/[slug]`**:
  - It uses the banner and keeps its real `<table>`, `<caption>` and sr-only Buy header. The rows are styled as cards, with ARIA table roles below sm.
  - It has a sticky sidebar.
  - The sections, JSON-LD and Buy hrefs are unchanged.
- **Live view**: `PlanFilterBar`, `PlansSidebar`, `PlansStates` and `useCountryHeroImage` are now separate files. `DestinationPlans` went from 1443 to 333 lines.
- **`/pkg/[id]`**: the plan shows as a `PlanRow` with `showTitle={false}` and no Buy, because the page keeps its own actions.

## Review findings fixed
- **Teal disc unit failed contrast** (2.1:1). It now uses `onSurfaceVariant`; this was decided before implementation and is written into the plan.
- **Identical-looking rows.** A local plan and a regional bundle with the same data, days and backend title appeared as duplicates at different prices. Rows now show the plan title, plus "Regional bundle · <coverage>" from `filters` and `country`. Fact: f214.
- **Text column only about 90px wide at 320px.** On phones the price and Buy now sit on their own line.
- **Footer text contrast regression from phase 1.** `onSurfaceVariant/70` on `surfaceBright` measured 3.81:1. The consent "Privacy" label measured 2.34:1. Both fixed in `d2b95cb`.

## Verification
- `pnpm test`: 78 files, 620 tests passing. `tsc` is clean.
- `pnpm build`: `/` stays ○, `/esim/[slug]` stays ● (SSG), and `/destinations` and `/pkg/[id]` stay ƒ.
- Headless Playwright (the Chrome extension was disconnected after an account switch), at 320/375/768/1024/1440:
  - no horizontal scroll;
  - exactly 1 gradient Buy per list;
  - the collapsed bar appears below lg after scrolling past the banner;
  - the sidebar sticks at 24px at lg+.
- Live-view filters, tested by clicking each chip: all plans 65, Unlimited 18, Fixed 47, 1–7 days 20, 16+ days 31, back to All 65. `aria-pressed` is correct on each.
- **Lighthouse mobile:**
  - `/esim/usa`: LCP 3.684s → 2.77–2.87s, CLS 0, a11y 1.0.
  - Live view: a11y 1.0.
  - `/`: LCP 3.66s and CLS 0.
- **Remaining a11y debt on `/`** (score 0.97) is in the How-it-works mockup labels and the App Store/Play badge labels. It goes to phase 7.

## Commits
`945f0df` and `5020fe8` plan, `9968f17` planRow, `a2a22ae` planList, `f53b151` pricing rows, `5aa519e` PlanRow, `765b4ff` banner and bar, `e41d6fd` /esim, `846cd48` live pieces, `b6aefdd` live view, `c61ad37` row title and coverage fix, `ebfe02c` /pkg, `d2b95cb` contrast fix, then this docs/feedAI commit.

## Next
Phase 5: checkout + sign-in. One-page Stripe-style layout, sticky Pay on phones, dock hidden.
