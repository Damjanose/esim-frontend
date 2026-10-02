---
date: 2026-10-02
tags: [assistant, ui, bff]
focus: web
status: complete
---

# Session: assistant-stop-and-fixes

## What existed before
The web assistant (f246) was a port of the app's chat from before that day's fixes: the FAQ ran before the place parser and matched single words ("travel", "how much"), presets matched any message starting with their word, the AI got text-only history, there was no timeout handling, and the input was locked while thinking.

## What was done
- `localReplies.ts`: phrase-only FAQ, apostrophes ignored, new `timeoutFallbackReply`.
- `suggestions.ts`: `matchesPreset` only matches single-word messages (exported for tests).
- `AssistantChat.tsx`: place parser before FAQ; structured history (`action {type, payload}`); Stop button while thinking (aborts the fetch); a new message, chip or Clear replaces the pending request; closing aborts; 6s client timeout and `assistant_timeout` → local "show plans" fallback.
- `bff/assistant/chat/route.ts`: passes the backend error `code` through.
- `copy.ts`: `assistant.stop`, `assistant.error.timeout`, needs-human copy updated for the wider AI scope.
- Tests: new "smarter assistant" block in `assistant.test.ts`.

## How it was done
Mirrors velocity-eSim commits c5b4e31 and the backend's grounded/fast chat (E-SIM backend fcd1448). Combined signals use one manually linked AbortController because `AbortSignal.any` needs iOS Safari 17.4+.

## Outcome
842/842 tests pass and `tsc` is clean. Not yet checked in a browser. Smarter, faster answers arrive once the backend deploy is live.
