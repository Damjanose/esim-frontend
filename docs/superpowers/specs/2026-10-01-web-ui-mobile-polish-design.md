# Web UI polish: mobile-app parity + full responsiveness

**Date:** 2026-10-01
**Repo:** `E-SIM-frontend/` (reads `velocity-eSim/` as a visual reference only)
**Follows:** `2026-08-18-mobile-design-parity-design.md`. That spec ported colors, type and buttons; this one ports layout and component shapes, and makes every public page work from 320px to 1440px.
**Mockups:** `.superpowers/brainstorm/20458-1790844487/*.html` (gitignored, local only)

## Goal

Make the public web look and behave like the eSim2you app, and make it fully responsive on phones. **Content stays the same:** same copy, links, data and flows. Only layout, component shape and responsive behavior change.

## Non-goals

- Admin `x*` pages (they have their own design system, f058).
- Copy or SEO content changes, i18n, new features.
- Backend or API changes.

## Constraints carried over

- Colors only from Tailwind tokens (`brandBlue`, `brandTeal`, `brandInk`, `surface`, `onSurface`, `onSurfaceVariant`, `outline`, `error`, `mist`), with opacity modifiers allowed. No new hex values.
- CTAs use `Button` / `LinkButton` (`resolveButtonClasses`). There's one gradient primary per view; the rest are `flat`. No solid red buttons.
- Navbar and dock stay **static, with no cookie reads** (f022), so public pages remain statically generated.
- No regression on f192's mobile Core Web Vitals (homepage CLS 0, LCP ≈3.5s). Any `overflow-x-auto` scroller holding `sr-only` content must be `relative` (f195).
- Motion: keep the existing Lottie files. Any new decorative motion uses Lottie. Scroll and gesture motion (carousels, collapsing headers) uses CSS.

## Breakpoints

| Range | Name | Navigation | Account shell |
|---|---|---|---|
| < 768px (`md`) | phone | top bar + **dock** | app layout |
| 768–1023px | tablet | top bar + **dock** | app layout |
| ≥ 1024px (`lg`) | desktop | floating capsule nav, no dock | sidebar dashboard |

Acceptance on every public route: no horizontal page scroll at 320, 375, 768, 1024 or 1440px; tap targets ≥ 44px; nothing hidden behind the dock.

## Decisions by section

### 1. Navigation shell (option A: mirror the app)

- **Desktop (lg+):** a floating capsule nav. It's a rounded-full bar inset from the page edges, `bg-surface/80 backdrop-blur border border-outline/60 shadow`, with the same links as today (Home, Plans, Destinations, How it Works, About Us, Support), plus the Partner pill, the Profile icon and the "Get eSIM Now" `LinkButton`. One style works over both the light homepage hero and the photo heroes on `/esim/*`, so the `theme="dark"` prop goes away.
- **Phone/tablet:** a slim top bar (logo + ☰). The ☰ sheet holds the secondary links (Plans, How it Works, About Us, Partner with us). A new **`BottomDock`** is an 80%-wide floating capsule fixed to the bottom with five static links: Home `/`, My eSIMs `/account`, a raised gradient globe in the center for Destinations `/destinations`, Support `/support` and Profile `/profile`. The active tab comes from `usePathname()`, inside a small client island.
- **Dock visibility** is a pure helper `isDockVisible(pathname)`: it's hidden on `/checkout*`, `/signin*`, `/x*` and `/profile/deleted`. A matching `pb-*` clearance is applied to `<main>` below `lg` wherever the dock is shown.

### 1b. Footer (option B: quiet light)

The footer gets a `bg-mist`-style soft surface with a hairline on top. Content is unchanged. On phones the Company / Explore / Resources columns sit in a 2-column grid, all expanded. Bottom padding clears the dock below `lg`.

### 2. Homepage hero (option C: light split)

- **Desktop:** a white background. On the left are the eyebrow pill ("200+ destinations"), the H1 with a gradient on its second line ("connected while you travel"), the sub-copy, search, and the popular chips. On the right, `mountain.webp` sits in a rounded-[24px] photo card carrying a small white overlay card with the remaining trust signals.
- **Phone:** the photo card goes on top at a fixed aspect ratio, with the copy, search and chips below it.
- A new **tune button** sits next to search and opens the existing Help Me Choose wizard. The wizard's open state currently lives inside `DestinationBrowse`, so the hero triggers it through a tiny shared opener (a context, or a `window` custom event). The plan picks one.
- The hero `<Image>` keeps `priority` + `fetchPriority="high"`. The chip placeholders stay, so CLS remains 0.

### 3. Destination browse (option B: photo-tile carousels)

- Trending now (keeping its sort control) and the 5 rails (Popular, Featured plans, Unlimited data, Long stay, Regional & global) each become a horizontal **`PhotoTile`** carousel: a country photo, a bottom scrim, the name, and "data · days · from €X" (Trending) or "from €X" (rails). They use `scroll-snap`, with prev/next arrow buttons at lg+.
- Photos come from the existing `/bff/country-image` (force-cached). Each tile loads its photo **only when it scrolls into view** (IntersectionObserver), with a brand-gradient placeholder at a fixed aspect ratio so there's no layout shift. ⚠ That's one request per visible tile. If this measurably hurts performance, a batch endpoint is a follow-up and out of scope here.
- The "All destinations" grid keeps its search and its "Show all / Show less" collapse, restyled as compact **`CountryRow`** cards.
- "Help me choose" is unchanged and stays the gradient primary of this section.

### 4. Country plans (option A: app plan rows + sidebar)

Applies to both the static `/esim/[slug]` page and the live `DestinationPlans` view (`/pkg/[id]` follows the same row style).

- **Hero:** the country photo banner with a rounded-[24px] bottom, plus the breadcrumb, the H1 with a teal accent, "Plans from €X to €Y", and a flag.
- **Filters:** the existing 6 chips (All plans, Unlimited, Fixed data, 1–7, 8–15, 16+ days) become a single scrollable chip row, with the sort on the right.
- **`PlanRow`:** a data disc (GB in `brandBlue`, unit in `brandTeal`, ∞ for unlimited), the duration, tags (`Best value`, `−N%` discount, `Calls + SMS` when `voiceMinutes`/`smsCount` exist), the strike-through original price, and the price. The best-value row gets the gradient `Buy now`; all other rows get flat `Buy now`. There's **no per-plan network/hotspot line**, because the web doesn't receive that data.
- **Desktop:** a sticky right sidebar (≈280px) holding the trust points and support (the content of the current `PlansSupportBar` and `DestinationStats`).
- **Phone:** once the banner scrolls away, a sticky **collapsed country bar** (back, flag, name, "from €X") appears.
- **SEO:** `/esim/[slug]` keeps its `<table>`, `<caption>` and sr-only "Buy" header. The rows are styled as cards (`border-separate`), and the JSON-LD is untouched.
- The sections below (install steps, related, guides, FAQ) are restyled with the card language and keep their content.

### 5. Checkout + sign-in (option B: one-page, Stripe-style)

- **Desktop:** two columns. On the left are "Secure checkout", the plan title, then 01 Billing address and 02 Card details (same components and the same Pokpay tokenization). On the right is a sticky order summary on a `mist` panel: flag + plan, promo code, plan price / discount / total, and the Pay button.
- **Phone:** a "Show order summary · €X" bar under the top bar opens the summary (promo + totals). The sections stack, and the CardStep's real submit button is `sticky bottom-0`. The dock is hidden.
- **Sign-in:** a centered card (shield icon, heading, copy, email → code, Google/Apple), with the field order unchanged, restyled to the new inputs. The dock is hidden.

### 6. Account (desktop option B, phone/tablet option A)

The same data drives two layouts that switch at `lg`:

- **Desktop (lg+): `AccountShell` sidebar dashboard.** The sidebar has My eSIMs, Account, Sign-in methods, Payments, Support, Legal and Sign out. On `/account`, the active plan shows as a **usage ring** (teal conic ring, data left / total, days left, Top up + Details), and ready plans show as tiles with Install. History follows. Profile's tabs map to the sidebar entries; the plan decides whether that uses `?tab=` or sub-routes.
- **Phone/tablet: the app's My eSIMs.** A light title with a "N active · M total" count line, then the **active card** in `brandBlue` with data left in large type, a progress bar, days left and Top up / Details. Section cards hold the rows: Ready → gradient Install, History → muted rows with **Buy again**, which links to the country page only when the destination is still sold. The status badge uses `lifecycle_status` (Active / Ready / Expired). Profile becomes a **grouped settings list** (Account, Sign-in methods, Payments & billing, Support, Legal, Sign out, Delete account as `flat/danger`). The dock highlights My eSIMs / Profile.
- **`/account/[orderId]`:** on desktop, the ring + install card (QR + `CopyField`s) side by side; on phone, the blue usage card, then the install card, then the top-up list as `PlanRow`s. The order history table is unchanged.

### 7. Homepage blocks (option A: bento)

- **Benefits:** a bento grid: Instant Activation as a large gradient tile, Global Coverage and Transparent Pricing as tinted tiles, 24/7 Support as an ink strip.
- **How it works:** the existing `PhoneFrame` mockups inside 3 step cards, with sideways scroll-snap on phones.
- **Testimonials:** a horizontal carousel of cards (they stay non-schema, f191).
- **FAQ:** the existing `<details>` accordion, restyled.
- **App download + Partner promo:** two cards on one row at lg+, stacked on phones.
- **CTA:** a gradient card.

### 8. Content pages (option B: restyle the current structure)

`SeoContentPage` (travel, use-cases, compare), `/support`, `LegalDocumentPage` and the `/esim` content sections keep their current structure (section cards plus the Related sidebar, which stacks on phones). They get the new tokens, type scale, radii and spacing. `LegalDocumentPage` moves off the retired `midnight`/`line` tokens. The remaining old-token files (`WizardWelcomeIntro`, `HelpMeChooseWizard`, `DestinationPlans`) are cleaned up in their own sections.

### 9. Partner pages (option A: reuse the account shell)

`/partners/*` uses `AccountShell` (desktop sidebar: Dashboard, Buy for a customer, Withdraw, Materials, Status) and the grouped list on phones. `WalletPanel` gets the blue active-card treatment, and `DiscountPanel` and `QrCodeCard` become tiles. *(Offered as the only option, since it follows from section 6; flag it if you'd rather do something else.)*

## Shared components (new or reshaped)

| Component | Purpose | Used by |
|---|---|---|
| `BottomDock` + `isDockVisible()` | phone/tablet nav | layout |
| `Navbar` (capsule) / `MobileTopBar` | desktop nav / phone top bar | layout |
| `PhotoTile` | lazy country photo card | browse rails, Trending |
| `CountryRow` | flag + name + from-price row | All destinations |
| `PlanRow` + `planRowTags()` | app plan row; pure tag logic | `/esim`, live plans, `/pkg`, top-up |
| `ActiveEsimCard`, `UsageRing` | phone / desktop active plan | account, partner wallet look |
| `AccountShell` | lg+ sidebar layout | account, profile, partners |
| `SettingsGroup` | grouped list (extends `SettingsSection`) | profile, partners (phone) |

Each component has one job and takes plain props, with no data fetching inside. Data shaping stays in `services/` and `lib/`.

## Build order (each phase ships on its own)

1. Shared primitives + `isDockVisible` / `planRowTags` helpers (with tests)
2. Shell: capsule nav, top bar, dock, footer B
3. Homepage hero C + tune → wizard
4. Browse B (photo tiles + lazy images)
5. Country plans A (`/esim/[slug]`, live view, `/pkg`)
6. Checkout B + sign-in
7. Account (desktop B / phone A) + order detail
8. Homepage bento blocks
9. Content pages restyle + legal token fix
10. Partner pages

## Testing

- This repo has no component-rendering harness, so pure logic is extracted and covered by vitest: `isDockVisible`, `planRowTags`, tile image-loading state, and Buy-again eligibility.
- Existing guards must stay green: `public-shell.test.ts`, `core-web-vitals.test.ts`, `seo-*.test.ts`, `how-it-works.test.ts`, `legal-pages.test.ts`, and account/checkout flow tests. Source-string assertions that pin old markup are updated deliberately, not deleted.
- At the end of each phase, a manual browser pass at 375 / 768 / 1024 / 1440 px.
- Lighthouse mobile on `/` and `/esim/usa` after phases 3, 4 and 5, compared with f192 (CLS must stay 0 on `/`, LCP must not regress).

## Risks

- **Photo tiles mean many image requests.** Mitigated by lazy loading in view and force-cache; a batch endpoint is the fallback (separate task).
- **Two account layouts in the DOM** (CSS-switched). That's acceptable because the pages are authed and not indexed. The plan may instead pick one tree with responsive classes where that's simpler.
- **The tune button needs to open a wizard owned by another component.** It needs a small shared opener; there must be no second wizard instance.
