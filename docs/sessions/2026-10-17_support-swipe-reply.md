---
date: 2026-10-17
tags: [support]
focus: web
status: complete
---

# Session: support-swipe-reply

## What existed before
/xsupport could edit/delete via mobile only; no replying to a specific message.

## What was done
- `SwipeToReply` pointer-drag wrapper in SupportInbox.tsx plus a hover Reply button.
- Replying-to banner above the composer; `replyToId` sent through the existing BFF passthrough.
- Quote block in /xsupport and /profile/support bubbles.
- Live edit/delete keep quotes in sync.

## How it was done
Backend f291 provides replyToId/replyTo. Helpers tested in src/lib/support-live.test.ts.

## Outcome
tsc clean, vitest passes. Not yet clicked through in a browser.
