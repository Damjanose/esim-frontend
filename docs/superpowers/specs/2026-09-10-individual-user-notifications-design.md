# Individual (per-user) admin notifications

Date: 2026-09-10
Status: draft
Repos touched: `E-SIM backend`, `E-SIM-frontend`

## Problem

The admin dashboard's `xnotificationy` page can only compose a message and
broadcast it to every registered device token. There's no way to send a
one-off push to a single specific user — e.g. following up on a support
ticket, or reaching one account individually without notifying everyone.

## Goal

Let an admin search for an existing user by email, compose a title/body, and
send a push notification to just that user's linked device(s). Keep a log of
what was sent to whom so admins have a history to refer back to.

## Non-goals

- Sending to multiple selected users in one send (each send targets exactly
  one user; can be revisited later if needed).
- Showing the notification anywhere inside the mobile app itself (no in-app
  inbox/list) — this is push-only, matching the existing broadcast behavior.
- Editing or reusing a sent individual notification (unlike broadcast
  messages, which are stored and can be edited/re-sent).

## Data model — `E-SIM backend`

New Prisma model, append-only send log:

```prisma
model UserNotification {
  id              String   @id @default(cuid())
  userEmail       String
  user            User?    @relation(fields: [userEmail], references: [email], onDelete: SetNull)
  title           String?
  body            String?
  sentCount       Int
  failureCount    Int
  sentByAdminEmail String?
  createdAt       DateTime @default(now())

  @@index([userEmail])
  @@index([createdAt])
}
```

`sentByAdminEmail` records which admin sent it — the existing partner routes
already read `(req as AdminRequest).admin?.email` for accountability logging
(e.g. `admin.ts` around the `/partners/:email/approve` handler); a send-history
feature without "sent by" would be missing the accountability it's meant to
provide, so this is populated from the same source, not left optional in
practice.

This is deliberately separate from `NotificationMessage` (which backs
reusable/editable broadcast messages with its own CRUD lifecycle). Individual
sends are compose-and-fire-once; conflating the two would mean every existing
broadcast query needs to filter out targeted sends.

`onDelete: SetNull` matches the existing `DeviceToken.userEmail` relation
behavior — deleting a `User` account doesn't need to cascade-delete their
notification history.

## Backend services

### `userSearch.service.ts` (new)

```ts
function searchUsers(query: string): Promise<{ email: string; hasDeviceToken: boolean }[]>
```

- `User.findMany` where `email` contains `query` (case-insensitive), ordered
  by email, limited to 10 results.
- `hasDeviceToken` per row via `deviceTokens: { some: {} }` — lets the admin
  see up front whether a send would even reach a device, before sending.
- Empty/whitespace query, or a query under 2 characters, returns `[]` without
  hitting the database — avoids a full-table `contains` scan on every
  single-keystroke debounce tick.
- No server-side rate limiting on this endpoint, matching the rest of
  `admin.ts` (no existing admin route is rate-limited beyond
  `requireAdminDashboardAuth`'s auth check) — noted here explicitly rather
  than left as a silent gap.

### `userNotification.service.ts` (new)

```ts
function sendUserNotification(input: {
  userEmail: string;
  title: string | null;
  body: string | null;
  sentByAdminEmail: string | null;
}): Promise<{ sentCount: number; failureCount: number }>
```

Mirrors `sendSupportReplyPush`'s shape:

1. Require at least one of `title`/`body`, validated in the route handler the
   same way the existing `/admin/notifications` POST route does — via the
   shared `optionalString()` helper already used there (`admin.ts` around
   line 668), not a new ad hoc trim/empty check.
2. `listDeviceTokensForUser(userEmail)` (already exists, used by support-reply
   push).
3. If zero tokens: skip the FCM call, still write a `UserNotification` row
   with `sentCount: 0, failureCount: 0` — a zero-token send is not an error,
   it's a real outcome the admin needs to see in the history.
4. Otherwise, `getFirebaseMessaging()` → `sendEachForMulticast` with
   `fcmAlertTransport(ANDROID_CHANNEL_ID)` (reuse the existing `'broadcast'`
   Android channel — this is the same "admin-sent alert" style as broadcast,
   just narrowed to one recipient) and `data: { type: 'admin_notification' }`.
5. Prune any `messaging/registration-token-not-registered` tokens via
   `deleteDeviceTokens`, same as broadcast/support-reply.
6. Write the `UserNotification` row with the final `sentCount`/`failureCount`.

### `listIndividualNotifications.service.ts` (or a function added to
`userNotification.service.ts`)

```ts
function listUserNotifications(limit = 50): Promise<UserNotification[]>
```

- Newest first (`createdAt desc`), capped at `limit` (default 50, no
  pagination UI in v1 — see Open questions).

## Backend routes (`src/routes/admin.ts`)

All behind the existing `requireAdminDashboardAuth` middleware, following the
exact pattern of the neighboring `/admin/notifications` and `/admin/partners`
routes:

- `GET /admin/users/search?q=<string>` → `{ users: [{ email, hasDeviceToken }] }`
- `POST /admin/users/:email/notify` body `{ title, body }` →
  `{ sentCount, failureCount }`; 400 if both title and body are empty. Reads
  `(req as AdminRequest).admin?.email` (same accessor the partner routes use)
  and passes it through as `sentByAdminEmail`.
- `GET /admin/notifications/individual` → `{ notifications: UserNotification[] }`

**Route ordering:** Express matches routes in declaration order, and the
existing `/notifications` group already has `:id`-style routes
(`PUT/DELETE /admin/notifications/:id`, `POST /admin/notifications/:id/send`).
`GET /admin/notifications/individual` must be declared *before* any
`/admin/notifications/:id...` route — otherwise `:id` greedily matches the
literal string `"individual"`. (Note: the `/partners/:email/...` routes don't
actually present this hazard themselves, since they're all `POST` with an
extra path segment rather than a bare `GET /partners/:email`; this is a
`GET`-vs-`GET` collision specific to the `/notifications` group, not a
pattern already solved elsewhere in the file.)

## Frontend — `E-SIM-frontend`

### `xnotificationy/page.tsx`

Add a two-tab layout: **Broadcast** (existing UI, unchanged) and
**Individual** (new). Tab state is local component state, not persisted
across reloads.

**Individual tab:**

- Email search input, debounced ~300ms, calls
  `GET /bff/admin/users/search?q=` and renders a dropdown of matches. Each
  row shows the email and, if `hasDeviceToken` is false, a muted "no device
  linked" hint next to it.
- Selecting a result populates a "sending to: `<email>`" header and reveals
  title/body fields (same validation as broadcast: at least one non-empty).
- Send button → `POST /bff/admin/users/[email]/notify`. On success, clear the
  form, show a notice with the returned `sentCount`/`failureCount`, and
  prepend the new row to the history table below.
- History table: recipient email, sent-by admin email, title/body preview
  (truncated), sent timestamp, `sentCount`/`failureCount` (a zero-token send
  shows plainly as "0 sent" rather than looking like a success). Loaded from
  `GET /bff/admin/notifications/individual` on tab mount.
- 401 handling matches the rest of the page: `handleUnauthorized()` from
  `useAdminSession`.

### New BFF routes

Thin proxies matching the existing `bff/admin/notifications/route.ts` pattern
(forward `Authorization` header, wrap backend JSON in `{status, data}`):

- `src/app/bff/admin/users/search/route.ts` (`GET`)
- `src/app/bff/admin/users/[email]/notify/route.ts` (`POST`)
- `src/app/bff/admin/notifications/individual/route.ts` (`GET`)

## Error handling

- Empty title+body on send → 400 from the backend, surfaced as a field-level
  validation message in the UI (same pattern as broadcast's
  `newFieldsInvalid`).
- Zero linked device tokens → not an error; logged and shown as `0 sent` (see
  above), so the admin isn't misled into thinking the push landed somewhere.
- Firebase not configured → same as broadcast/support-reply: log and return
  `{ sentCount: 0, failureCount: 0 }` rather than throwing, so a missing
  Firebase config doesn't 500 the endpoint.
- User not found for the given email → search simply returns no matches; the
  send endpoint doesn't need a separate "user not found" case since it only
  ever receives an email the admin picked from search results.

## Testing

**Backend:**
- `userSearch.service.test.ts` — matching, case-insensitivity, empty query,
  10-result cap, `hasDeviceToken` correctness.
- `userNotification.service.test.ts` — token pruning on
  `registration-token-not-registered`, zero-token case writes a log row
  without calling FCM, `UserNotification` row shape after a successful send
  (including `sentByAdminEmail` being persisted correctly), title+body-both-empty
  throws.
- `admin.routes.test.ts` — extend with a block for
  `/admin/users/search`, `/admin/users/:email/notify`, and
  `/admin/notifications/individual`, mirroring the existing
  `/admin/notifications` test block (auth-required, happy path, validation
  error), plus a route-ordering regression test asserting
  `GET /admin/notifications/individual` resolves to the list handler and not
  the `:id`-style handlers.

**Frontend:**
- Extend `xnotificationy/admin-notifications.test.ts` (or a new
  `admin-individual-notifications.test.ts`) covering: search debounce,
  send-button validation (both fields empty), success path updates history,
  zero-token result renders as `0 sent` rather than an error state.

## Open questions

- History list has no pagination in v1 (capped at 50 most recent). Fine to
  ship as-is; revisit if the admin dashboard needs to look further back.
- Reusing the `'broadcast'` Android channel for individual sends (rather than
  a new dedicated channel) means they're visually indistinguishable from
  broadcast pushes in the Android notification shade. Acceptable for v1 since
  both are "admin-sent alert" style messages; can split into its own channel
  later if that distinction turns out to matter.
