---
date: 2026-09-09
tags: [privacy, cookies, analytics, marketing, public-shell]
status: complete
---

# Session: cookie-consent

## What changed

Added a client-side consent manager for the public web frontend. Authentication and
existing session storage remain independent.

- `esim2you_consent` is a versioned first-party cookie that remembers Analytics and
  Marketing choices for 180 days.
- Optional categories default to denied until the visitor chooses.
- Google Ads, optional GA4, and optional Meta Pixel loading is gated by consent.
- Google Consent Mode v2 signals are updated when the Google categories change.
- Existing purchase conversion tracking now requires Marketing consent.
- The public shell has a centered desktop/modal and mobile bottom-sheet treatment,
  equal Accept/Reject/Manage actions, category switches, and a persistent footer
  Privacy choices control.
- The Privacy Policy now explains the cookie categories and withdrawal path.

## Configuration

Set these public build-time variables when the vendors are ready:

- `NEXT_PUBLIC_GA_MEASUREMENT_ID`
- `NEXT_PUBLIC_META_PIXEL_ID`
- Existing `NEXT_PUBLIC_GOOGLE_ADS_ID` and
  `NEXT_PUBLIC_GOOGLE_ADS_PURCHASE_LABEL`

The final vendor disclosures, retention wording, and jurisdictional requirements
still need business/legal review before production launch.

## Verification

- `pnpm exec tsc --noEmit`
- `pnpm test` — 59 files, 465 tests passed
- `pnpm build` — completed successfully; existing package-cache-size warnings remain
- Browser smoke test confirmed the first-visit modal renders above the homepage's
  existing wizard, the consent cookie is persisted, and Google Ads loads only after
  Accept all. Meta Pixel remained absent because its ID is not configured.

## Follow-up design adjustment

The first-visit consent prompt is now a non-blocking, full-width bottom banner.
On the homepage it waits until the Help Me Choose welcome/wizard flow closes,
so the package suggestion experience is shown first. The footer Privacy choices
control still opens the expanded preference center after a prior choice.
