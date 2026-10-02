# 2026-10-02 — Traveler support chat on the web

## Problem
The web had no way to chat with support. `/support` only offered a mailto link, while the app and the `/xsupport` admin inbox already shared a chat thread.

## What changed
- **BFF** `src/app/bff/user/support/`: `thread` (GET), `thread/solved` (POST), `messages` (POST, forwards only `body` + `attachmentIds`), `attachments` (POST multipart), `attachments/[id]` (GET image stream). All go through `callWithSession` to Express `/api/support/*`, which already existed for the app.
- **Page** `/profile/support` (guarded by the `/profile` prefix) with `SupportChat.tsx`:
  - message list with photos and a lightbox (Escape closes it)
  - composer: Enter sends, Shift+Enter adds a new line, up to 4 photos
  - Mark as solved
- **Entry points**: a "Chat with support" row in `/profile`'s Support group, and a flat "Chat with support" button next to Email support on `/support`.
- **Rules** in `src/lib/userSupportChat.ts` mirror the backend limits (4000 chars, 4 photos, 10 MB).

## Decisions
- **Polling, not Socket.IO.** The session token is an httpOnly cookie, so the browser can't authenticate a socket without exposing the token. The chat polls the thread every 5s while the tab is visible. A request counter drops stale responses (f244).

## Verification
- `pnpm test`: 107 files / 786 tests pass, including the new `support-routes.test.ts` and `userSupportChat.test.ts`.
- `tsc --noEmit` is clean.
- Dev server: `/support` links to `/profile/support`; signed out, `/profile/support` returns 307 to `/signin?next=/profile/support` and the BFF returns 401.
- Not verified: sending a message while signed in, in a real browser.

## Facts
f243, f244
