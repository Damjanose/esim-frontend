---
date: 2026-09-01
tags: [public-content-pages]
status: complete
---

# Session: wikimedia_thumb_host_fix

## What existed before
`next.config.mjs`'s `images.remotePatterns` allowlisted exactly one
Wikimedia host, `upload.wikimedia.org`. `/destinations?country=hungary`
threw a `next/image` runtime error: `Invalid src prop ... hostname
"thumb.wikimedia.org" is not configured under images in your next.config.js`.

## What was done
`src/app/bff/country-image/route.ts`'s `createImageResult()` uses
`image?.thumburl ?? image?.url` from Wikimedia's imageinfo API response —
Wikimedia serves images from more than one subdomain depending on which
field it returns (`upload.wikimedia.org` for originals, `thumb.wikimedia.org`
for thumbnails), and only the former was allowlisted. Widened the pattern
from a single literal hostname to `hostname: "*.wikimedia.org"` so the whole
family is covered instead of allowlisting hosts one at a time as they show
up for other countries. Updated `core-web-vitals.test.ts`'s assertion on the
old literal hostname to match.

## How it was done
Reproduced live at `http://localhost:3000/destinations?country=hungary`,
confirmed the fix by restarting the dev server (`next.config.mjs` changes
need a restart, unlike component code) and reloading the same URL — renders
correctly with a Budapest skyline hero image.

## Outcome
`pnpm exec tsc --noEmit` clean, `pnpm exec vitest run` — 272/272 pass.
Browser-verified live.
