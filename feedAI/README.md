# feedAI

A small, hand-curated knowledge base for this repo (`velocity-esim-frontend`), meant to be
loaded by an AI session instead of re-deriving context from scratch every time. It sits
alongside — and deliberately does not duplicate — `docs/sessions/` (dated session logs, the
primary source of "why") and any `CLAUDE.md`/`AGENTS.md` in this repo or the workspace root
(`../CLAUDE.md`, `../E-SIM backend/CLAUDE.md`).

## Files

| File | Purpose |
| --- | --- |
| `brain.json` | Entry point: budgets, keyword routing table, invariants, current phase, last sync |
| `index.json` | Keyword -> topic file map, mirrors `brain.json`'s route table |
| `facts.jsonl` | Append-only knowledge log, one dated/sourced fact per line, never edited in place |
| `topics/*.json` | Dense structured summaries, one per subsystem, ≤10KB each |
| `README.md` | This file |
| `MAINTAIN.md` | Rules for keeping this knowledge base current |

## Load protocol

1. Read `brain.json` first — it's the map, not the territory.
2. `grep` `facts.jsonl` for anything relevant to the task (topic files can lag; the log can't).
3. Load exactly ONE `topics/*.json` file matched by `brain.json`'s `route` table for the task at hand.
4. Only pull in a second topic file if the task genuinely spans two subsystems.

Do not read all of `topics/*.json` up front — that defeats the point of splitting them.

## What it is not

- Not a replacement for `docs/sessions/INDEX.md` — that's the full narrative history, this is
  a compressed index into it plus standalone facts not tied to any single session.
- Not a replacement for the repo's own `CLAUDE.md`/root `CLAUDE.md` — those cover commands,
  conventions, and workflow; feedAI covers living facts, current state, and symptom -> fix
  history.
- Not exhaustive code documentation. It captures what a session would actually need to avoid
  re-deriving from scratch or repeating a diagnosed mistake — real numbers, real file paths,
  real error strings, sourced.
- Never contains secrets, tokens, or `.env` values. See `MAINTAIN.md` for the specific list of
  env vars that must never appear here with real values.
