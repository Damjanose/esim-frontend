# 2026-09-26: OG share image redesign

**Focus:** web

## What changed
- Replaced the link-preview image `public/og/esim2you-og.png`, which WhatsApp, iMessage, Slack and X show when a site link is shared, including the mobile app's package share links.
- The design was chosen with the brainstorming visual companion. The rounds went Midnight / Product hero / Light editorial, then three light variants, and the user picked "C1 app icon hero". It has a light `#f6f7fb` surface with teal/blue glows, the real mobile app icon tilted large on the right, the "TRAVEL eSIM · 200+ DESTINATIONS" label, the headline "Easy setup, *instant connection.*" (from the social campaign creative), blurred check badges, a "Connected · 5G" glass chip and App Store / Google Play badges.
- The image is now generated from source. `scripts/og/og-image.html` is rendered by `pnpm og:render` (`scripts/render-og.mjs`: headless Chrome at 1200×630, then pngquant). The old image was 442 KB and the new one is 131 KB.
- `src/lib/seo.ts`: `ogImageVersion` went from 4 to 5 and the alt text was updated. `seo.test.ts` now expects `?v=5`.

## Verification
- `pnpm exec vitest run src/lib/seo.test.ts` passed (9/9).
- Visually checked the rendered PNG inside a WhatsApp-style bubble next to the old one.

## Follow-ups
- After deploy, WhatsApp may still show the old preview for links that were already shared. New shares pick up `?v=5`. You can force Facebook/WhatsApp to refetch with the Facebook Sharing Debugger.
