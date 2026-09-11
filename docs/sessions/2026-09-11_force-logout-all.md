---
date: 2026-09-11
tags: [admin, notifications]
status: complete
---

# Session: force-logout all

## What existed before
The Individual tab on `/xnotificationy` could force-logout accounts with no linked device.

## What was done
- Added `Force-logout all` (confirm, then POST `/bff/admin/users/force-logout-all`).
- BFF proxies to backend `POST /admin/users/force-logout-all`.

## How it was done
The button sits beside `Force-logout unlinked` on the Individual compose card. Confirm copy makes it clear every signed-in account must sign in again. The admin dashboard session is not a customer HMAC token, so the operator stays signed in.

## Outcome
Admins can bulk-invalidate every customer session from the same tab as unlinked force-logout.
