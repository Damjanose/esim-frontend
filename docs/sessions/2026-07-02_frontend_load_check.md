---
date: 2026-07-02
tags: [frontend, debugging]
status: complete
---

# Session: frontend-load-check

## What existed before

The web frontend was reported as not loading. The current source tree built successfully, but the local Next dev server had stale generated output under `.next`.

## What was done

- Reproduced the issue against the local Next ports.
- Verified `pnpm build` and `pnpm test` both pass.
- Found that `http://127.0.0.1:3000/` returned `500` with `Cannot find module './607.js'` from `.next/server/pages/_document.js`.
- Confirmed `/api/packages` still returned `200`, narrowing the failure to the root page/error-rendering path rather than the package proxy.
- Confirmed the generated files were mismatched: `_document.js` requested chunk `607`, while the active runtime/cache state resolved it from the wrong location.
- Stopped the stale dev server, moved `.next` aside, and restarted `pnpm dev` so Next regenerated a clean dev cache.
- Verified `/api/packages` returns `200` with provider-backed package data.

## Outcome

The local web frontend loads at `http://127.0.0.1:3000/`. No application code change was needed; the cause was a corrupted local `.next` cache, likely from running `pnpm build` while `pnpm dev` was still active. The stale cache was moved out of the repo to `/tmp/esim-next-stale-607-error`.
