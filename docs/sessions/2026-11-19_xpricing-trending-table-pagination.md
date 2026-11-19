---
date: 2026-11-19
tags: [web, admin, xpricing]
status: complete
---

# Session: xpricing-trending-table-pagination

## What existed before
Trending reorder lived inside the packages table behind a filter option that was hard to find. The table rendered all ~2,095 rows.

## What was done
- New 'Trending order' table at the top of `/xpricing` (arrows, Remove, Save order); old filter option and in-row arrows removed.
- Packages table paginates at 30 rows; search/filter persist across page changes and reset to page 1 when they change.
- Save order now enables when the shown order was never saved (all trendingOrder null), the root cause of the mobile mismatch.

## Outcome
Admin must click Save order once to persist the initial order. Mobile side: velocity-eSim PR (fix/trending-destinations-order).
