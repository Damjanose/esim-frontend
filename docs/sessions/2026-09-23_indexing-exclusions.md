---
date: 2026-09-23
tags: [seo, robots, sitemap, search-console]
status: complete
---

# Session: indexing exclusions

## What existed before

`robots.txt` disallowed only `prefix/` paths, so `/signin`, `/profile`, and `/checkout?package=` were still crawlable. Google then honored their `noindex`. `/policy` and `/terms` sitemap `lastmod` was hardcoded to 2026-05-09 while `legal.ts` says September 22, 2026.

## What was done

- Disallow each `privateRoutePrefixes` entry as the prefix itself.
- Parse legal sitemap dates from `legal.ts`.
- Removed an unused `updatedAt` field that sitemap generation did not read.

## How it was done

`src/app/robots.ts`, `src/lib/sitemaps.ts`, `src/app/seo-routes.test.ts`.

## Verification

`pnpm exec vitest run src/app/seo-routes.test.ts src/lib/seo.test.ts` — 15 passing.

## Follow-ups

After deploy, resubmit the sitemap in Search Console and request indexing only for the homepage, `/esim/japan`, and `/use-cases/study-abroad`. Do not validate the noindex or canonical-alternate reports.

The sitemap index lastmod for each part is now the newest URL inside that part. `/sitemap.xsl` is only a browser view of the same XML.
