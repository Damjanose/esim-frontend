---
date: 2026-11-19
tags: [web, admin, xpricing]
status: complete
---

# Session: xpricing-trending-order

## What existed before
`/xpricing` had a per-row Trending checkbox and a 'Trending on' filter, but trending rows were alphabetic and the public Trending section sorted by value score.

## What was done
- The filter is now 'Trending only (reorder / remove)': position numbers, up/down arrows, Save order, and Remove.
- Order persists through backend `trendingOrder` (backend PR, f429); the public Trending 'Recommended' sort honours it first.

## Outcome
The checkbox add/remove flow is untouched. Deploy the backend migration before the web change.
