---
date: 2026-09-09
tags: [routes, admin, api, sockets]
status: complete
---

# Session: support-chat-inbox

## What existed before

Public `/support` was FAQ + mailto. Hidden admin pages covered sales, pricing, errors, version, notifications, activity, and partners. There was no live support inbox. Browser traffic to Express went only through `/bff/*`. `backendFetch` was JSON-only.

## What was done

- Added hidden `/xsupport` admin inbox (`src/app/xsupport/`) with Unread / Open / Solved tabs, per-user chat, photo attachments, mark-as-solved, and unread badges.
- Added BFF proxies under `src/app/bff/admin/support/` for thread list/detail, messages, multipart uploads, read, solved, and authenticated attachment streaming.
- Extended `src/lib/backend.ts` with `getBackendOrigin`, `backendFetchFormData`, and `backendFetchBinary`.
- Admin Socket.IO client (`socket.io-client`) talks to the Express origin (`NEXT_PUBLIC_SOCKET_URL` or derived from `NEXT_PUBLIC_API_URL`). REST still uses BFF. This is the one documented exception to "browser never calls Express directly".
- Nav entry in `AdminNav.tsx`. `/xsupport` added to `privateRoutePrefixes`.
- Regression tests: `admin-support.test.ts`, `support-socket.test.ts`, extra `backend.test.ts` cases.
- Follow-up polish added responsive mobile list/detail navigation, stale-request guards for
  thread and list loading, Socket.IO reconnect/unauthorized handling, explicit room leaving,
  and accessible labels/live regions/lightbox Escape handling.

## How it was done

Copied the `/xactivityy` admin shell (useAdminSession, AdminNav, AdminLoginCard, noindex layout). Inbox UI is a master-detail chat. Attachments cannot ride `backendFetch` because it always JSON-stringifies, so uploads and image GET are streamed separately.

## Deviations

The frontend currently uses the existing Socket.IO contract. The alternative external
`/trigger-event` service was intentionally not integrated because its subscriber protocol
was not provided.

## Follow-ups

- Production backend still needs the Nginx `/socket.io` upgrade route and persistent
  `SUPPORT_UPLOAD_DIR` volume before rollout.
- Apply the mobile drop-in (Profile → Support chat).
