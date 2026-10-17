---
date: 2026-10-17
tags: [web, reviews, copy]
focus: web
status: complete
---

# Session: review-copy-one-per-account

## What existed before
The review composer said "live on eSIM2you.com" / "Show my review on eSIM2you.com" (that domain isn't ours), and the limit message talked about adding another after a date.

## What was done
- `ReviewComposer.tsx`: "live on our website", "Show my review on our website", limit text "You've already shared a review. Each account can post one."
- BFF testimonial route comment and the user-routes test fixture follow the backend's one-per-account quota.

## How it was done
Copy-only follow-up to the backend change (backend session 2026-10-17_testimonial-one-per-account). The phase type still carries `resetsAt`; the backend always sends null.

## Outcome
`tsc` clean; user-routes and review-composer vitest suites pass (29 tests).
