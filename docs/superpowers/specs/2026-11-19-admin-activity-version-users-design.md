# Admin: richer /xactivityy + outdated-users list on /xversion

Date: 2026-11-19 · Repos: `E-SIM backend` (API), `E-SIM-frontend` (admin UI) · Mobile: no change

## Goal
- `/xactivityy` shows each row's app version, platform, and the user's email when signed in.
- `/xversion` lists users/devices with their app version so the admin can push an individual "please update" notification to those on an old version.

## Data model (no migration)
- `AppVersionCheckIn(deviceId, platform, version, updatedAt)` — version per device.
- `DeviceToken(deviceId, userEmail?)` — links a device to a signed-in user.
- `UserActivity(identifier, identifierType: email|device, ...)` — activity rows.
- `AppMinVersion` — singleton minimum version; "outdated" = version < min (`compareVersions`).
- Mobile already sends the same `deviceId` on check-in, activity ping and push-token registration.

## Backend
1. `GET /admin/activity`: each row additionally returns `email`, `appVersion`, `platform`, `isOutdated`.
   - `identifierType=device`: look up check-in by `deviceId`; `email` is the `DeviceToken.userEmail` if linked, else null.
   - `identifierType=email`: devices via `DeviceToken(userEmail)` → check-ins; use the lowest version; `email` = identifier.
   - Batch the lookups (no N+1).
2. New `GET /admin/app-version/users[?outdated=true]`: one row per check-in device: `deviceId, platform, version, email|null, lastSeen (updatedAt), isOutdated`. Sorted outdated first, then oldest version first.
3. Reuse existing `POST /admin/users/:email/notify` for sending (no change).

## Web
4. BFF: `GET /bff/admin/app-version/users` (pass-through, forwards `outdated` query). `/bff/admin/users/:email/notify` proxy — reuse if it exists, otherwise add.
5. `/xactivityy`: add Email and App version columns plus an "Outdated" badge; device rows without email read "Anonymous install".
6. `/xversion`: new "Users on old versions" section under the version report.
   - Filter: All / Outdated only (default Outdated), platform filter.
   - Per-row **Notify** button (rows with an email only) opens an inline form prefilled with "A new version of eSIM2you is available, please update" (editable title + body), Send/Cancel, shows sent/failed count. **Per row only — no bulk send.**
   - Rows without email show "Not signed in — can't be notified".

## Limits
- Only devices that checked in since tracking started (or since "Clear tracking") appear.
- A user can be notified only if a push token is linked to their email.

## Testing
- Backend: unit tests for the join/`isOutdated` logic (service level, mocked prisma) and route shape.
- Web: pure-function tests for filtering/formatting helpers, following the existing `admin-*.test.ts` pattern.

## Docs
- feedAI fact in both repos (backend: new endpoint + join rule; web: new columns/section).
