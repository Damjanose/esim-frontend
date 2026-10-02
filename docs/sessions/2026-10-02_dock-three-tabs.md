# 2026-10-02 — Navbar drops Destinations; bottom dock = app's three tabs

## Ask
`/destinations` shows the same content as the homepage, so take it out of the nav. On phones, the bottom tabs should match the app: Marketplace (= home), My eSIMs, Profile.

## Changes
- `components/Navbar.tsx`: removed the Destinations link. Links are now Trip planner, Travel guides, Compare, Use cases (xl+), Support.
- `components/dockNav.ts`: `DOCK_ITEMS` = My eSIMs (`/account`) | **Marketplace** (center, `/`) | Profile (`/profile`). Marketplace is active on `/`, `/destinations`, `/esim/*`, `/pkg/*`. Home and Support tabs removed.
- `components/dockIcons.tsx`: `destinations` glyph renamed `marketplace` (storefront); home and support glyphs dropped.
- `components/navTone.ts`: removed `EXTRA_ACTIVE_ON`, which only existed for the Destinations link.
- On phones Support now lives in the ☰ panel. `MobileNavbarMenu` lists the nav items that aren't dock hrefs, so no code change was needed.
- The `/destinations` page is kept (SEO and the ☰ "Browse eSIM plans" CTA).

## Verification
- `tsc --noEmit` clean, `pnpm test` 811 passed (dockNav, navTone, public-shell tests updated).
- Dev server on :3011, Playwright at 390px: the dock shows My eSIMs | Marketplace | Profile. Marketplace is active on `/` and `/esim/italy` and inactive on `/support`. At 1440px the navbar shows no Destinations link.

## Facts
f248

## Follow-up: Get the app moved up
- `src/app/page.tsx`: the `AppAndPartner` row (Get the app + partner promo) now renders right after `TopDestinationLinks`, before How it works. It used to come after the FAQ.
- Checked at 390px and 1440px: the card sits cleanly between the top-destination links and How it works (`#download-app` y≈4069 on phone, ≈3127 on desktop). Tests pass. Fact f249.

## Follow-up 2: store buttons in the hero, borderless ☰
- The owner chose Option A from the placement mockups (canvas "Get the app placement"): the store buttons sit inside the hero on both phone and desktop. This replaces the follow-up above.
- `src/app/page.tsx`: new `HeroAppBadges` under the search. It uses dark-glass buttons and owns `#download-app`. On phones there's an "or get the app" divider and a 2-column grid, which drops to 1 column below 360px. From lg it's one inline row. `AppDownload` was deleted, and `PartnerBand` puts the partner promo alone after the FAQ.
- `MobileNavbarMenu.tsx`: the ☰ button lost its border and only gets a hover tint.
- Tests: `homepage-blocks.test.ts` now asserts the badges come after the tune button in `Hero`, that there's no `AppDownload`, and no text below 12px. 811 passing.
- Checked at 320, 360, 390, 768, 1024 and 1440: no badge overflow and no horizontal scroll. The 320px overflow was fixed by the 1-column stack. On a 360×640 phone the buttons end at y=505, above the dock at 570. Fact f250 supersedes f249.
