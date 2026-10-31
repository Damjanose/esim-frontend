---
date: 2026-10-31
tags: [admin, bff]
focus: web
status: complete
---

# Session: admin-troubleshoot

## What existed before
Assistant troubleshooting answers and keywords existed only in the backend seed code. No admin page managed them.

## What was done
- New page `/xtroubley`: AdminNav "Troubleshooting", private route prefix in `seo.ts`, noindex.
  - Test a message
  - Problems: enable toggle, translation status, English answer, keyword add/delete/restore with grammar help
  - Unmatched messages: Add as keyword with the suggested problem, and Dismiss
- BFF routes under `src/app/bff/admin/troubleshoot/**`, all via `proxyAdminJson`, with awaited Next 15 params and encoded `code`/`id`.
- Review fixes:
  - the suggested problem is kept when the problems list loads late;
  - toggle errors are visible on collapsed cards;
  - if add-as-keyword succeeds but the dismiss fails, the problems list still reloads;
  - the answer box is locked while saving;
  - error pages that aren't JSON get a readable message.

## How it was done
Built against the API contract in `E-SIM/docs/superpowers/plans/2026-10-31-troubleshoot-matcher-v2-and-stage2.md` by an implementer subagent, then reviewed. Checked through the BFF against a locally running backend on :3100/:4100, with production untouched.

## Outcome
1114 tests pass and `tsc` is clean (no `next build` was run). Fact f336. Merge after backend #13.
