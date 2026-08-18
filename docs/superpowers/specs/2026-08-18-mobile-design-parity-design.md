# Web frontend visual redesign — mobile design parity

**Date:** 2026-08-18
**Repos touched:** `E-SIM-frontend/` (primary, read-only reference to `velocity-eSim/`)

## Goal

Bring the web app's visual language (colors, typography, buttons) to parity with
the mobile app (`velocity-eSim/`), which has a clean, documented token system
under `src/theme/`. The web app currently has no token system — colors are
hardcoded per-component and inconsistent across files, and the site is dark
while mobile is light.

## Current state (web)

- **Theme**: dark canvas (`#020916` background), bright cyan (`#00d9f5`) accents,
  defined in `tailwind.config.ts` (`ink`, `midnight`, `cyan`, `aqua`, `cloud`,
  `mist`, `line`) and `src/app/globals.css`. These tokens are only partially used;
  most components hardcode hex values directly in Tailwind arbitrary-value classes.
- **Fonts**: Inter (body) + Plus Jakarta Sans (display), loaded via `next/font`.
- **Buttons**: no shared component. Each button is a one-off `<button>`/`<a>` with
  its own inline gradient, e.g.:
  - `PayButton.tsx`: `from-[#1857ff] to-[#29c9ff]`
  - `Navbar.tsx` CTA: `from-[#1557ff] to-[#27c6ff]`
  - `SocialSignInButtons.tsx`, `SignOutButton.tsx`: their own styling
  These gradients are all slightly different blues, none matching the mobile brand.
- ~43 `.tsx` files, ~8,000 lines, across landing, destinations, checkout, signin,
  profile, support, guides, use-cases, account.

## Reference (mobile) — `velocity-eSim/src/theme/`

- **Palette** (`colors.ts`): Material-3-style semantic tokens (`surface`, `onSurface`,
  `primary`, `outline`, etc.) with light + dark variants. The app default is
  `lightPalette`: white canvas, navy ink text (`onSurface: #1A1F36`).
- **Brand marks** (`colors.ts` → `brand`): fixed, scheme-independent —
  `teal: #09c3be`, `blue: #0B49B7`, `ink: #061131`.
- **Marketplace accent system** (`colors.ts` → `marketplace`): the palette actually
  used for CTAs and cards — white canvas, blue ink text, and
  `buttonGradient: [blue, '#0E86C0', teal]` (i.e. `#0B49B7 → #0E86C0 → #09C3BE`).
- **Typography** (`typography.ts`): three families — Hanken Grotesk (display/headline,
  700/600), Inter (body/title, 400/600), Geist (labels/mono data, 600/500) — plus a
  7-step named type scale (`displayLg` … `monoData`) with exact size/line-height/
  letter-spacing/weight per step.
- **Buttons** (`controls.ts`): `resolveButtonVisual({variant, tone, size, disabled,
  pressed})` — `variant: 'primary' | 'flat'`, `size: 'sm' | 'md' | 'lg'` (heights
  34/46/54), radius from the `radius` scale, primary uses the brand gradient,
  flat uses a bordered outline in brand or danger tone.
- **Radius** (`radius.ts`): `sm:4, default:8, md:12, lg:16, xl:24, full:9999`.
- **Spacing** (`spacing.ts`): 8pt scale, `xxs:2` … `5xl:48`, plus named gutters.

## Approach

### 1. Design system reference doc ("typology")

Write `E-SIM-frontend/docs/design/mobile-design-system.md` — a redesign reference
extracted from `velocity-eSim/src/theme/`: full palette table, brand gradient,
type scale, button variants/sizes, radius, spacing. This is the doc both apps'
developers check against; it captures the *why* (e.g. brand gradient stop order)
alongside the values so it doesn't need re-deriving from mobile source later.

### 2. Token layer (`tailwind.config.ts` + `globals.css`)

Mobile has three overlapping color systems (`lightPalette`'s Material-3 tokens,
the fixed `brand` marks, and `marketplace` — the palette that actually drives
CTA gradients, confusingly named: `purple` = blue, `cyan` = teal). To avoid an
implementer wiring buttons to the wrong one, port them under one explicit
mapping, not "port all three":

| Web token | Sourced from | Value | Used for |
|---|---|---|---|
| `surface` | `lightPalette.surface` | `#FFFFFF` | page/card background |
| `onSurface` | `lightPalette.onSurface` | `#1A1F36` | body text |
| `onSurfaceVariant` | `lightPalette.onSurfaceVariant` | `#44495E` | secondary text |
| `outline` | `lightPalette.outlineVariant` | `#C4C7D4` | borders, dividers |
| `brandBlue` | `marketplace.purple` (= `brand.blue`) | `#0B49B7` | gradient start, links |
| `brandTeal` | `marketplace.cyan` (= `brand.teal`) | `#09C3BE` | gradient end, small accents |
| `brandGradient` | `marketplace.buttonGradient` | `#0B49B7 → #0E86C0 → #09C3BE` | **all** primary buttons/CTAs |
| `ink` | `brand.ink` | `#061131` | headline text, logo mark |
| `error` | `lightPalette.error` | `#BA1A1A` | error text/borders (flat/danger buttons) |

`lightPalette.primary` (`#006874`, Material teal) is **not** ported — it's
unused by mobile's own buttons (mobile buttons use `marketplace.buttonGradient`
instead) and porting it alongside `brandTeal` would give the web app two
different teals with no rule for which to use. Site background flips dark →
light using `surface`/`onSurface` above.

Radius and spacing scales are ported the same way (`sm/default/md/lg/xl/full`;
the 8pt spacing scale) so component code can reference named steps instead of
arbitrary pixel values — spacing isn't strictly a "color/typography/button"
token, but the new `<Button>` component needs it for consistent height/padding,
so it's in scope as supporting infrastructure.

**Hardcoded literals outside the `colors` block**, currently tied to the old
cyan/ink theme, must be updated in the same pass or they'll silently keep the
old look:
- `globals.css`: `.hero-grid`'s radial-gradient stops, `::selection` colors
- `tailwind.config.ts`: `boxShadow.glow` / `boxShadow.card` rgba values

### 3. Fonts

Swap the `next/font` setup: Hanken Grotesk (display/headline) + Inter
(body/title, already in use) + Geist (labels/data), replacing Plus Jakarta Sans.
Wire the type-scale tokens as Tailwind `fontSize` entries (with paired
line-height/letter-spacing) mirroring `typography.ts`'s named steps, so JSX can
use `text-display-lg`, `text-headline-md`, etc. instead of one-off text classes.

### 4. Shared `<Button>` component

New `src/app/components/Button.tsx` mirroring `resolveButtonVisual`: props
`variant` (`primary | flat`), `tone` (`brand | danger`), `size` (`sm | md | lg`),
`disabled`. Primary renders the brand gradient; flat renders a bordered outline.
Replace every existing one-off button with it. Before starting, run an explicit
audit rather than discovering buttons as-you-go — grep the codebase for
`<button`, `bg-gradient-to-r`, and `rounded-full`/`rounded-\[` across `src/app/`
to produce a concrete file list. Known so far: `PayButton`, the `Navbar` CTA,
`SignOutButton`, `SocialSignInButtons`; the audit will surface the rest
(landing, destinations, account, plan cards, etc.).

No shared `<Text>` component — Tailwind utility classes driven by the new
`fontSize` tokens are enough; a wrapper component would be an abstraction the
web app doesn't otherwise need (YAGNI).

### 5. Rollout

Full-site, one pass: token layer changes apply everywhere immediately (Tailwind
theme + CSS variables), and every button across all pages is migrated to the new
`<Button>` component in this same effort — no deferred pages.

## Out of scope

- Changing mobile's theme (`velocity-eSim/src/theme/`) — it's the reference,
  read-only for this project.
- Dark mode for the web app (mobile's dark palette exists but the web target is
  light-only, per the confirmed direction).
- Non-visual behavior changes (payment flow, auth flow, routing) — buttons keep
  their existing `onClick`/`href`/`type` behavior; only appearance changes.

## Testing

- `pnpm exec tsc --noEmit` (or the project's type-check script) after token/config
  changes.
- Manual visual check via `pnpm dev` in a browser: landing, checkout (`PayButton`),
  signin (`SocialSignInButtons`), account (`SignOutButton`) — confirm gradient,
  font, and radius match the mobile app's Marketplace/checkout screens.
