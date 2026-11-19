# 2026-11-19 — /xactivityy email+version, /xversion outdated users with per-row Notify

**Branch:** feat/admin-version-users · **Facts:** f366 · **Spec/plan:** `docs/superpowers/specs|plans/2026-11-19-admin-activity-version-users*`
**Backend counterpart:** E-SIM backend, same branch name (f428). Deploy backend first.

## What changed
- `/xactivityy`: Email and App version columns, Outdated badge.
- `/xversion`: `VersionUsersSection` with filters and a per-row Notify form (prefilled, editable). No bulk send by design.
- BFF `bff/admin/app-version/users`; helpers in `src/lib/version-users.ts`.

## Caveats
Anonymous / unlinked devices can't be notified. For email rows the Identifier and Email cells show the same address.
