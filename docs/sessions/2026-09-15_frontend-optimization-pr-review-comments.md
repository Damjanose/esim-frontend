---
date: 2026-09-15
tags: [performance, ui]
status: complete
---

# Session: frontend-optimization-pr-review-comments

## What existed before
PR 6 served unversioned `/logo-icon.png` and `/app-logo.png` with a one-year immutable cache while this branch also changed those PNG bytes.

## What was done
- Changed those two logo paths to `Cache-Control: public, max-age=3600, must-revalidate`.
- Left hashed `/images/:path*` assets on the long immutable cache.

## How it was done
A Core Web Vitals contract test now forbids `immutable` on the logo header block. The test and existing landing/SEO checks passed.

## Outcome
The remaining review comment is fixed in the working tree and is not committed yet.
