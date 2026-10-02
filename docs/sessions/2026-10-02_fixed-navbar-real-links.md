# 2026-10-02: Fixed navbar with real-page links and scroll tone

## Goal
Redesign the desktop navbar. It should link only to pages, not homepage anchors, stay pinned while scrolling, and use the brand colours. Designed on a claude.ai Design canvas; the user approved the scheme of dark glass over the hero and light glass after it.

## What changed
- `components/Navbar.tsx`: the links are now Destinations, Travel guides, Compare, Use cases and Support. Removed Home, Plans, How it Works and About Us (homepage `/#` anchors).
  - Right side: Partners (xl+), My eSIMs (`/account`; icon only at lg, labelled at xl), profile, and a "Get an eSIM" CTA (brand blue; teal with ink text on dark).
  - The phone ☰ menu now lists Travel guides, Compare and Use cases, because the dock already has the rest.
- `components/NavbarTone.tsx` (client): `<header class="group fixed …" data-tone>`. It measures the homepage's dark hero card (`data-nav-dark` in `page.tsx`) on scroll and resize (rAF-throttled, passive).
- `components/navTone.ts` (+ tests): `navToneFor` (dark while the hero bottom is more than 80px down), `initialNavTone` (dark only on `/`, so the first paint matches), and `isNavLinkActive` (Destinations also covers `/esim` and `/pkg`).
- `components/NavLink.tsx` (client): the active link gets a pill and `aria-current="page"`.
- `MobileNavbarMenu.tsx`: the trigger turns white on dark.
- `globals.css`: `scroll-padding-top: 88px`, so `#anchor` jumps (for example from the footer) clear the fixed bar.
- `public-shell.test.ts`: the "one capsule, no theme switch" test now asserts the tone mechanism (no theme prop). There's a new real-pages-only assertion.

## Verification
- `pnpm test`: 103 files, 756 tests. `tsc` is clean.
- Dev server screenshots:
  - Homepage top at 1440 and 1100: dark glass, everything fits.
  - `/destinations`: Destinations active.
  - Phones: dark on the home hero, light on `/travel`.
- A DevTools-protocol script scrolled the homepage to 1400px: the header stays `position: fixed` and turns light over the content.
