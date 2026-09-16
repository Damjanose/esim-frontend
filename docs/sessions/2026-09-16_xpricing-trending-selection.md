---
date: 2026-09-16
tags: [admin, api, docs]
status: complete
---

# Session: xpricing-trending-selection

## What existed before
The hidden `/xpricing` page edited package sell prices and discount settings,
but it had no merchandising control for the mobile Marketplace.

## What was done
- Added a per-package Trending checkbox to the existing pricing table.
- Included the boolean in the existing row draft and PUT payload.
- Kept the existing BFF proxy routes and admin session behavior unchanged.

## Outcome
Admins can decide which packages feed the mobile Trending destination rail
directly from `/xpricing`; the backend returns the saved value in both admin
pricing rows and public package catalog rows.
