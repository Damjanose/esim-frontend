---
date: 2026-10-15
tags: [support]
focus: web
status: complete
---

# Session: support-photo-unavailable

## What was done
- /xsupport `AuthedImage` and the /profile/support chat show "Photo unavailable" when a support photo fails to load, instead of an endless shimmer or a broken image. Fact f286.

## Outcome
Root cause was backend f269 (photos lost from the container disk, now in Postgres). tsc clean, support tests pass (55).
