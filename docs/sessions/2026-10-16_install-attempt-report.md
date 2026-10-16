---
date: 2026-10-16
tags: [account, install, gifts]
focus: web
status: complete
---

# Session: install-attempt-report

## What was done
- New BFF route POST /bff/user/orders/[orderId]/install-attempt, proxying to the backend (backend f283).
- `InstallOnIphoneLink` client component and `CopyField installAttemptOrderId`, both calling `reportInstallAttempt` (fetch keepalive).
- Purpose: the mobile gift sheet warns that a gift may not install once someone has started installing (mobile f564).
