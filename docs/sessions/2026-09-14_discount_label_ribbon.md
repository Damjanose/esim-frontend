---
date: 2026-09-14
tags: [dashboard, backend, docs]
status: complete
---

# Session: discount-label-ribbon

## What existed before
The hidden pricing table edited sell-price adjustments but did not expose the mobile display-label setting.

## What was done
- Added a per-row `Discount label` checkbox under the adjustment controls.
- Included the checkbox value in the existing package-pricing PUT payload.
- Extended the source assertion test and verified the frontend test suite and TypeScript build.

## Outcome
Admins can independently enable or disable the mobile SALE label without changing the pricing calculation.
