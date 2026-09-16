---
date: 2026-09-17
tags: [destinations, merchandising, pricing]
status: complete
---

# Session: trending-packages-section

## What existed before
The hidden `/xpricing` admin page already saved a per-package `trending` boolean,
but:
- the public web destination directory did not expose a dedicated section for
  those plans, and
- the hidden `/xpricing` table could not quickly filter rows by merchandising
  toggles.

## What was done
- Extended the shared package mapping (`src/services/packages.ts`) to carry the
  backend `trending` flag into `HeroPackageOption`.
- Added a new "Trending now" block in `DestinationBrowse` that shows only plans
  with `trending === true`.
- Added an independent sort selector for the trending block:
  - Recommended (value score)
  - Price low to high
  - Price high to low
  - Longest validity
- Added a row filter dropdown in `/xpricing`:
  - All rows
  - Adjust on
  - Trending on
  - Discount label on
- Made that row filter evaluate current row drafts, so unsaved checkbox changes
  immediately update the visible list.
- Added a unit test in `src/services/packages.test.ts` verifying that the
  `trending` flag is preserved during package mapping.
  Also updated `src/app/xpricing/admin-package-pricing.test.ts` to cover the
  new filter UI strings.

## Outcome
Web users can now quickly see packages the team has marked as trending in
`/xpricing` and change how those cards are sorted without affecting the
existing destination rails. Admins can also quickly isolate rows where Adjust,
Trending, or Discount label are enabled when managing pricing.
