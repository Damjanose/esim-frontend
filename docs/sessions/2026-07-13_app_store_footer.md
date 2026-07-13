# App Store Link and Footer

## Context
The public Next.js landing page still treated the iOS app as coming soon even though the App Store listing is live. The footer had grown into a single row of mixed legal, support, destination, guide, and use-case links.

## What changed
- Added the live App Store link: `https://apps.apple.com/am/app/velocityesim/id6768258284`.
- Changed the homepage App Store CTA from a disabled placeholder to an external store link.
- Updated homepage SoftwareApplication JSON-LD to include both iOS and Android store listings.
- Redesigned the footer with brand copy, App Store and Google Play buttons, grouped Company/Explore/Resources links, and a bottom copyright row.
- Removed the footer App Store and Google Play buttons after review so download actions stay in the main homepage CTA.
- Reworked the footer Resources column as homepage-style link cards.
- Added more natural footer mentions of Velocity eSIM for SEO while keeping the copy readable.
- Moved the footer into a shared `SiteFooter` component and added it to destination, guide, and use-case SEO pages.
- Replaced the SEO page hero's single Android CTA with enabled App Store and Google Play links.
- Changed SEO page app links to same-tab redirects with explicit pointer styling so embedded previews do not treat blank-target links like disabled buttons.
- Removed the stale Android-only `page.cta` content contract from SEO page data.
- Updated landing and SEO tests for the live iOS listing and footer structure.

## Verification
- `pnpm test src/content/landing.test.ts src/lib/seo.test.ts`
- `pnpm test src/app/seo-content-page.test.ts src/content/landing.test.ts src/content/seo-pages.test.ts`
- `pnpm test src/content/seo-pages.test.ts src/app/seo-content-page.test.ts`
- `pnpm exec tsc --noEmit`
- `pnpm test`
- `pnpm build`
