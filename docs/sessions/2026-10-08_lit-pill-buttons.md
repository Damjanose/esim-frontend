---
date: 2026-10-08
tags: [ui, design-system, buttons]
focus: web
status: complete
---

# Session: lit-pill buttons on web

## What existed before
`Button` / `LinkButton` / `resolveButtonClasses` had the old mobile `AppButton` design. `primary` was a diagonal blue→cyan→teal gradient and `flat` was a white button with a thin outline, both with 12px corners and font-black text. Around ten hand-built buttons used their own classes.

## What was done
- Ported mobile's new lit pill (velocity-eSim `da61b02`) into `buttonClasses.ts` and `Button.tsx`. The props are `variant` lit/tint/ghost, `tone`, `size`, `surface` light/dark and `hero`, plus `loading` on Button. The new tokens are in `tailwind.config.ts`.
- Renamed every call site from `primary` to `lit` and from `flat` to `tint`, and updated the tests that check source text.
- Moved spinner-plus-"…ing" labels to `loading`: CardStep Pay, sign-in Send code/Verify, LinkEmailStep, wallet Buy, trip-plan Unlock, top-up rows and the final delete confirm.
- Added `hero` (orbit dot) to the main buy/pay/send actions.
- Replaced hand-built buttons:
  - the Top up and Details buttons on the blue ActiveEsimCard (now `surface="dark"`)
  - the cookie banner (Accept and Reject kept equal weight on purpose)
  - the OpenInAppBanner
  - the TripPlanList delete confirm
  - the pkg and eSIM open-in-app actions (still raw links, using `resolveButtonClasses`)
- Repainted the assistant chat action and primary chip with the lit tokens.
- The final "Yes, delete my account" is now the red lit button, which matches mobile. The earlier delete steps stay a red tint.

## How it was done
A Haiku `searcher` agent built the inventory of hand-built buttons. The work itself was done in the main session. Admin x* pages were deliberately left alone.

## Outcome
`tsc --noEmit` is clean apart from stale `.next/types` errors that predate this work, and vitest passes 111 files / 858 tests. There is no lint script. **Not yet checked in a browser:** the glow, the press sink, the orbit dot, the dark cookie banner and the blue eSIM card.
