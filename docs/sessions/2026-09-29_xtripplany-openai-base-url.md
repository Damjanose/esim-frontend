# 2026-09-29 — /xtripplany OpenAI base URL

## Goal
An AI Studio (Gemini) key saved under provider "openai" failed Test connection with "OpenAI error (401): Authentication Failed" because it was sent to api.openai.com. The base URL was only configurable via the PLAN_TRIP_OPENAI_BASE_URL env var; the admin needed it on /xtripplany.

## What changed
/xtripplany has a Base URL field (provider openai only) with a 'Use Gemini' shortcut; saved as `openaiBaseUrl`.

## Files
- src/app/xtripplany/page.tsx

## Verification
- Web: `tsc --noEmit` clean; `pnpm test` 548/548.
- Live check: Gemini's OpenAI-compatible endpoint (`/v1beta/openai/chat/completions`, model gemini-3.5-flash) answered 200 with the admin's key. Not yet run end to end through the deployed admin page.

## Deploy note
Backend needs `prisma migrate deploy` for the new `openaiBaseUrl` column before the admin page is used.

## Fact
f203
