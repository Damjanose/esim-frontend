# 2026-11-10: Ahrefs Web Analytics

## What changed
- `src/app/AhrefsAnalytics.tsx` (new): renders the Ahrefs `analytics.js` tag with the site key. Mounted in `src/app/layout.tsx` outside `ConsentProvider`.
- `src/lib/analytics.ts`: `AHREFS_ANALYTICS_KEY` (env override `NEXT_PUBLIC_AHREFS_ANALYTICS_KEY`).
- `src/content/legal.ts`: privacy policy cookie section names Ahrefs as always-on cookieless measurement; last-updated date bumped to November 10, 2026.
- `src/app/ahrefs-analytics.test.ts` (new).

## Decisions
- Not consent-gated. The owner chose "load for everyone" because Ahrefs says the product is cookieless and its installation check reads the raw HTML.
- Skipped on admin `x*` paths so those URLs are not in a document that loads the tag.

## Verified
- Dev server: tag is inside `<head>` on a public page and absent on `/xloginy`.
- vitest (new test + legal-layout + analytics) and `tsc --noEmit` pass.

## Open
- A client-side navigation from a public page into an `x*` path keeps the already-loaded script in the document. Whether Ahrefs then records that URL was not tested.
- Ahrefs' "Recheck installation" only passes after this is deployed to production.

Facts: f351
