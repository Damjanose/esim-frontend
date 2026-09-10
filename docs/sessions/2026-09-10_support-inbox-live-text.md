---
date: 2026-09-10
tags: [admin, sockets]
status: complete
---

# Session: support-inbox-live-text

## What existed before

`/xsupport` already used Socket.IO. A live `support:message` only appended when `payload.threadId` matched the open conversation, so the unread badge could move while the chat and list preview stayed stale — the same class of bug as the mobile app.

## What was done

- Shared live helpers in `src/lib/support-live.ts`
- Inbox applies a live message to the open chat, patches `lastMessagePreview` on the list, refreshes unread, re-joins on reconnect, and notices when a traveler messages a thread that is not open

## Outcome

Admin inbox live updates match the Velocity chat contract. The Cursor browser could not reach localhost, and the inbox is behind admin login, so live traveler→admin delivery was not clicked through here.
