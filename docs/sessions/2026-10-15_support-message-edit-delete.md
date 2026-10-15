---
date: 2026-10-15
tags: [support]
focus: web
status: complete
---

# Session: support-message-edit-delete

## What was done
- `SupportMessage.editedAt` type. `/xsupport` handles `support:message_updated` / `support:message_deleted` for the open thread. Both chats show "Edited · time". Fact f287.

## Outcome
tsc clean, support tests pass (55). The edit/delete controls are only in the mobile admin inbox.
