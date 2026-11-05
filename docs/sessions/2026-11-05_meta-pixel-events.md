# Meta Pixel events

**Date:** 2026-11-05

## What was done
- `src/lib/meta-pixel.ts`: pixel ID default, official stub, consent-checked `trackMetaEvent`, `isAdminPath`.
- `MetaPixel.tsx`: one PageView per public pathname, automatic history tracking off, never on admin `x*` paths.
- ViewContent on `/esim/*` and `/pkg/[id]`, AddToCart on Buy clicks, InitiateCheckout on checkout and top-up hand-off, Purchase on the package and top-up success returns (f345).

## Outcome
`tsc` clean, vitest 1146 passing, `next build` not run. Browser check on local dev with a dummy pixel ID: nothing loads without Marketing consent, one script tag, queue was init, PageView, ViewContent, then AddToCart on Buy and one PageView on client navigation; `/xloginy` loads nothing.

## Open items
- `fbevents.js` returned 503 in the test browser, so delivery to Meta is unconfirmed; check in Events Manager Test events after deploy.
- Purchase was not run end to end (needs a real payment).
- Conversions API needs a token from Events Manager and backend work; its event_id must equal the browser eventID.
- `GoogleTag.tsx` still loads on admin `x*` paths, so those URLs can reach Google when consented.
