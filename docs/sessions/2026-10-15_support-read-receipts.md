---
date: 2026-10-15
tags: [support]
focus: web
status: complete
---

# Session: support-read-receipts

## What was done
- New BFF `POST /bff/user/support/thread/read`. /profile/support reports read while visible.
- /xsupport admin bubbles show Check / CheckCheck for sent / seen. `adminReceiptState` in support-live.ts with a test. Fact f288.

## Outcome
tsc clean, 60 support tests pass.
