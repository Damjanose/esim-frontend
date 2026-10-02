# 2026-10-01: Web UI polish, phase 2: homepage hero

## Goal
Replace the dark, centered photo hero with the light split hero (spec option C). The copy stays the same, and a new tune button opens the existing Help Me Choose wizard. Plan: `docs/superpowers/plans/2026-10-01-web-ui-polish-phase2-hero.md`.

## What changed
- `destinations/planWizardOpener.ts` (+ tests): a window CustomEvent opener (`requestPlanWizard` / `onPlanWizardRequest`). Requests are not queued (f210).
- `DestinationBrowse.tsx`: subscribes and holds a request until loading ends. It is still the only `<HelpMeChooseWizard>`.
- `HeroTuneButton.tsx`: the app's filter tile next to search. It's 78px tall, 60px wide below sm and 78px from sm up.
- `HeroDestinationChips.tsx`: 44px light pills. Below sm they form one sideways-scrolling row with `[contain:inline-size]`, and the placeholders match that height (CLS 0).
- `page.tsx` `Hero`:
  - white two-column layout;
  - eyebrow pill;
  - gradient second headline line with `text-balance`;
  - search + tune;
  - chips;
  - a rounded photo card with a trust overlay. The card is 460×520 at lg+; below lg it comes first at 21:9.
  - All four trust signals are kept.
- Tests: `planWizardOpener.test.ts`, the wiring test, the tune-button and hero contracts in `hero-package-search.test.ts`, and the chip/`sizes` contracts in `core-web-vitals.test.ts`. Old assertions were changed deliberately; see the plan.

## Review findings fixed during the phase
- **Chips wrapped to as many as 4 rows (about 200px) on phones.** They're now one scrolling row, as in the mockup. `contain:inline-size` keeps that row from widening the grid or flex column, which would cause horizontal page scroll.
- **On 640–667px-tall phones the search box sat behind the bottom dock** (bottom edge at 579–599px vs. a dock top of 568–595px). Phone-only sizing fixed it: 28px H1, `text-sm` sub-copy, tighter gaps, a smaller photo overlay. The search box now ends at 540px.
- **On desktop at 1440px the headline left "travel" alone on a line.** Fixed with `xl:text-[52px]` and `text-balance`.
- **Known and accepted:** like the existing button, the tune button opens the wizard even when destinations failed to load.

## Verification
- `pnpm test`: 69 files, 569 tests passing. `tsc` is clean. `pnpm build` passes and `/` stays ○ static.
- Browser, prod build:
  - Phone widths (~300px at 640 and 667px tall): no horizontal scroll, and the search box clears the dock.
  - 980px: the photo card is on top.
  - 1440px: two columns, 460×520 card, dock hidden.
  - The tune click opens exactly one dialog.
- Lighthouse mobile on `/` (4 runs): CLS 0.000 on every run. LCP was 3.53–3.58s warm (baseline 3.54s). The LCP element is still the hero `<img>`.

## Commits
`0822071` plan, `1dd05dc` opener, `ac85687` DestinationBrowse listener, `92f190b` tune button, `430fec6` chips, `9857245` hero, then this docs/feedAI commit.

## Next
Phase 3: destination browse photo-tile carousels (lazy `/bff/country-image`).
