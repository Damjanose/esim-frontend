# CLAUDE.md — E-SIM-frontend

This file provides guidance to Claude Code (claude.ai/code) when working in this repository.

For full workspace context and cross-repo working practices, see the root `CLAUDE.md`
one level up (`../CLAUDE.md`).

---

## Docs workflow

### At session start
1. Read `docs/sessions/INDEX.md` — scan the index table for any session related to your current task.
2. If a match is found, read that session file in full before starting work.
3. If the task touches routing/middleware, the BFF layer, or auth, also check `feedAI/topics/routing.json`, `backend-integration.json`, or `auth.json`.

### At session end
1. Create `docs/sessions/YYYY-MM-DD_topic.md` using the template at the top of `docs/sessions/INDEX.md` (see the other two repos' `docs/sessions/INDEX.md` for the template shape if this repo's is missing one).
2. Append one row to the index table in `docs/sessions/INDEX.md`:
   `| YYYY-MM-DD | [topic](YYYY-MM-DD_topic.md) | One sentence summary |`
3. Update `feedAI/facts.jsonl` and bump `feedAI/brain.json`'s `sync` block — see `feedAI/MAINTAIN.md`. This repo had no session docs for 21 commits before 2026-08-19, which is exactly how its feedAI silently went stale — don't repeat that.
4. Per the root `CLAUDE.md`'s "Working practices": a new feature gets a fact describing its rule; a bug fix gets a `feedAI/topics/troubleshooting.json` entry plus a fact for the invariant it violated.

### On big changes
1. If the change involves a structural or architectural decision (routing, BFF contract, auth flow), note it in a session doc — this repo doesn't yet have a `docs/decisions/` or `docs/architecture/` folder; create one if a decision is significant enough to want its own file instead of living only in a session log.
