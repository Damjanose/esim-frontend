# 2026-10-02 — Bottom dock matches the app tab bar

**Focus:** web (phones/tablets, <lg)

## What changed
- `src/app/components/BottomDock.tsx` restyled from the app's `BOTTOM_TAB_STYLE` (velocity-eSim `src/components/bottomTabLayout.ts` + `BottomTabBar.tsx`):
  - Frosted capsule: `border-white/60`, lit top rim (`::before`, inset 18%), shadow ink/0.28 y10 r20, min-h 60, px-4.
  - Center: 66px white ring with 3px teal border + teal glow; 52px inner circle **solid** brand blue when active, `#9FB4DA` when inactive (gradient removed); 28px icon.
  - Side tabs: 22px icon, 11/13px regular label, active = brand blue lifted 2px + scale 1.08; inactive `#5C6B8A`; 180ms ease-out; pressed opacity 0.75.
- Icons: the app's filled MaterialIcons glyphs inlined as SVG in `components/dockIcons.tsx` (home, sim_card, storefront center, support_agent, person), tint-only. Replaces lucide in the dock.
- `PhotoTile.tsx`: removed `shadow-brandCard`; the carousel's overflow-x-auto track clipped it into a grey band behind the rail.
- `tailwind.config.ts`: `dock`/`dockCenter` shadows updated; new `dockMuted`, `dockCenterInactive` colors.

## Decisions
- Fill is white/60 (white/88 without backdrop-filter) instead of the app's 0.35: iOS BlurView adds its own white tint, CSS blur doesn't, so 0.35 was see-through over photo tiles.
- Center `<li>` is `relative z-10` so the absolutely positioned rim doesn't paint over the ring.

## Verified
- vitest 751/751, `tsc --noEmit` clean.
- Playwright screenshots at 375px (`/`, `/support`) and 320px (`/destinations`): fits, active states correct, no rim over ring.

## Gotcha
- Don't run a second `next dev`/`next build` in this repo while the owner's dev server is up: they share `.next` and the page throws `can't infer type of chunk from URL app-pages-internals`. Test against the owner's server (:3000) instead.
