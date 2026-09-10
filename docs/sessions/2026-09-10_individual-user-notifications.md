---
date: 2026-09-10
tags: [admin, routes, api, docs]
status: complete
---

# Session: individual-user-notifications

## What existed before

`/xnotificationy` could only compose reusable `NotificationMessage` drafts and
broadcast them to every registered device. There was no admin UI to search for
one user, send a one-off push, or read a send-history log.

Backend support for that flow landed in the sibling `E-SIM backend` repo in
the same-day session
(`docs/sessions/2026-09-10_individual-user-notifications.md` there):
`GET /admin/users/search`, `POST /admin/users/:email/notify`,
`GET /admin/notifications/individual`.

## What was done

- Added three BFF proxies, matching the existing `/bff/admin/notifications`
  pattern:
  - `GET /bff/admin/users/search`
  - `POST /bff/admin/users/[email]/notify`
  - `GET /bff/admin/notifications/individual`
- Extracted `IndividualNotificationsTab` (email search, compose form, send
  history) so `page.tsx` stays the broadcast surface.
- Added a Broadcast / Individual tab switcher on `/xnotificationy` (local
  component state, not persisted).
- Extended `admin-notifications.test.ts` with source-string assertions for
  the tab, search/send/history URLs, and the three new BFF files.

## How it was done

Followed the written plan in
`docs/superpowers/plans/2026-09-10-individual-user-notifications.md` and spec
`docs/superpowers/specs/2026-09-10-individual-user-notifications-design.md`.
UI and proxies were implemented first; Task 10 tests are the repo's usual
`readFileSync` + `toContain` guards, not component rendering.

## Outcome

An admin can switch to Individual, search by email (2+ characters, 300ms
debounce), send a title and/or body to that one user, and see history including
zero-device sends. Backend remains the source of truth for FCM and the
`UserNotification` log.
