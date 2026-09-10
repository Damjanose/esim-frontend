---
date: 2026-09-10
tags: [admin, notifications]
status: complete
---

# Session: force-logout unlinked

## What existed before
The Individual tab on `/xnotificationy` showed `no device linked` per search hit. There was no control to make those accounts sign in again.

## What was done
- Added `Force-logout unlinked` (confirm, then POST `/bff/admin/users/force-logout-unlinked`).
- BFF proxies to backend `POST /admin/users/force-logout-unlinked`.

## How it was done
The button lives on the Individual compose card so it is available while reviewing unlinked users. The backend stamps `User.sessionInvalidBefore`; the app already signs out on 401 after a failed refresh.

## Outcome
Admins can bulk-invalidate sessions for accounts with no related device token. Needs the backend migration deployed.
