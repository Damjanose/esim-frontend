# 2026-10-02 — Mobile full-screen destination search

## Problem
On phones, focusing the hero search opened the results dropdown inline under the field, inside the hero. It covered the photo and the chips and made the layout jump.

## What changed
- `src/app/HeroMobileSearch.tsx` (new) is a full-screen search dialog that is portaled to `<body>`, so it sits above the navbar and BottomDock. It locks page scroll, and Cancel or Escape closes it and returns focus to the trigger.
  - With an empty query it shows Recent (localStorage, up to 3), Popular (US, UK, IT, ES, FR, DE, GR, TR by catalog slug) and an A–Z list of every destination.
  - When typing, matches that start with the query come first and the matched letters are highlighted. Enter picks the top match.
- `src/app/HeroPackageSearch.tsx`: below `sm` the field is a button that opens the dialog. It mounts the dialog with `flushSync` and focuses the input inside the same tap, which is what lets iOS raise the keyboard. The input and inline dropdown only render from `sm` up, so desktop is unchanged. Selecting a destination now saves it to recents.
- Test: `hero-package-search.test.ts`, "opens a full-screen search on phones instead of the inline dropdown".

## Gotchas
- Package `countryCode` values are slugs (`united-states`), not ISO codes. The first version of the popular list used ISO codes and showed nothing.
- `type="search"` adds the browser's own clear X next to ours, so the input is `type="text"` + `inputMode="search"`.

## Verification
- `tsc --noEmit` clean, vitest 757/757.
- Headless Chromium at 390×844: tapping the field opens the dialog with the input focused. Typing "ita" shows Italy and Mauritania highlighted, Enter goes to `/destinations?country=italy`, and the body scroll lock is released. The "Recent: Italy" chip appears when the dialog is reopened. At 1280px the inline dropdown is unchanged.
- Not tested on a real iPhone: the keyboard behavior is still unverified.

Design canvas: https://claude.ai/artifact/MZcA35C74htc79oAeK8yUe (option A)
