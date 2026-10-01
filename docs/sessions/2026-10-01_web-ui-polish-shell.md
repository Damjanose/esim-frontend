# 2026-10-01: Web UI polish, phase 1: navigation shell

## Goal
Start the mobile-app layout-parity redesign of the public web, with the content unchanged. Section-by-section mockups were picked with the user in the brainstorming visual companion and written up as `docs/superpowers/specs/2026-10-01-web-ui-mobile-polish-design.md` (9 phases). This session shipped phase 1, the navigation shell (plan: `docs/superpowers/plans/2026-10-01-web-ui-polish-phase1-shell.md`).

## Design picks (all phases, recorded in the spec)
| Section | Pick |
|---|---|
| Nav | A: mirror the app (capsule nav, phone bottom dock) |
| Footer | B: quiet light |
| Homepage hero | C: light split, photo as a card, tune button opens the wizard |
| Destination browse | B: photo-tile carousels |
| Country plans | A: app plan rows + desktop sidebar |
| Checkout | B: one-page, Stripe-style |
| Account | desktop B (sidebar + usage ring) / phone A (app My eSIMs + grouped settings) |
| Homepage blocks | A: bento |
| Content pages | B: restyle the existing structure |
| Partners | A: reuse the account shell |

## What changed (phase 1)
- `tailwind.config.ts`: `surfaceBright` (#F5F7FA, from mobile `lightPalette.surfaceBright`) and `dock` / `dockCenter` shadows.
- `components/dockNav.ts` (+ tests): dock items and the pure `isDockVisible()` / `activeDockItem()` rules.
- `components/BottomDock.tsx`: fixed phone/tablet tab capsule, `lg:hidden`, static links, `data-bottom-dock`.
- `components/Navbar.tsx`: a single frosted capsule style (the `theme` prop was removed and the homepage call updated), with `<BottomDock />` rendered after `</header>`. Below lg only the logo and ☰ show.
- `components/MobileNavbarMenu.tsx`: lists only non-dock links plus "Browse eSIM plans", and closes on Escape or an outside tap.
- `SiteFooter.tsx`: `bg-surfaceBright`, with links in 2 columns on phones. `globals.css` adds bottom clearance while the dock is mounted.

## Review outcome
A code-quality review approved the change with fixes. Applied:
- Dock overflow at 320px: `px-3` below 360px.
- `whitespace-nowrap` on the labels.
- `1023.98px` media query, so zoomed widths don't fall between it and Tailwind's lg.
- A comment on why no admin paths are in the dock rules.
- The brittle footer test split into two assertions.
- Escape and outside-tap close for the ☰ menu.

**Plan Task 6 was dropped.** Lifting `OpenInAppBanner` above the dock is unnecessary, because that banner only renders on `/checkout` and `/signin`, where the dock is hidden (f208).

## Verification
- `pnpm test`: 68 files, 561 tests passing (baseline 67 / 549). `tsc --noEmit` is clean.
- `pnpm build` passes. `/`, `/esim/[slug]`, `/travel/*`, `/compare/*` and `/use-cases/*` are still static or SSG, and the dock is present in the prerendered HTML. `/destinations` is dynamic as before (it reads `searchParams`).
- Browser checks on the prod build, in same-origin iframes at 320, 375, 450 and 656px, plus desktop at 1689px:
  - no horizontal scroll;
  - correct active tab on `/`, `/esim/usa` and `/support`;
  - no dock on checkout or signin;
  - the ☰ panel lists the 4 secondary links + CTA;
  - the last footer line clears the dock by 104px at 320px;
  - the desktop capsule is legible over the current dark homepage hero.
- Lighthouse mobile on `/` (3 runs): CLS 0.000 and LCP 3.54s on the warm runs, unchanged from f192.

## Deferred / notes for later phases
- `DestinationPlans.tsx` uses `pt-20`, leaving only about 4px under the capsule at lg. The country-plans phase rebuilds that header anyway.
- The consent banner (`z-[1000]`) covers the dock until a choice is made. That's acceptable.
- Next plan: homepage hero C, plus the tune-button opener for the Help Me Choose wizard.

## Commits
`ad041d1` spec, `9e864ba` plan, `44519d6` tokens, `ac50654` dock rules, `87434dd` BottomDock, `ea79d07` capsule navbar + menu, `dedd9eb` footer, `2a4e5b5` dock-rules comment, then this docs/feedAI commit.
