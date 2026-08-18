# Mobile design system reference

Extracted from `velocity-eSim/src/theme/` — the source of truth for the web
frontend's brand redesign (`docs/superpowers/specs/2026-08-18-mobile-design-parity-design.md`).
Do not edit mobile's theme files from here; this is a read-only snapshot for
web implementers.

## Colors — token mapping

| Web Tailwind token | Mobile source | Value | Used for |
|---|---|---|---|
| `surface` | `lightPalette.surface` | `#FFFFFF` | page/card background |
| `onSurface` | `lightPalette.onSurface` | `#1A1F36` | body text |
| `onSurfaceVariant` | `lightPalette.onSurfaceVariant` | `#44495E` | secondary text |
| `outline` | `lightPalette.outlineVariant` | `#C4C7D4` | borders, dividers |
| `brandBlue` | `marketplace.purple` (= `brand.blue`) | `#0B49B7` | gradient start, links, glows |
| `brandTeal` | `marketplace.cyan` (= `brand.teal`) | `#09C3BE` | gradient end, small accents |
| `brandInk` | `brand.ink` | `#061131` | headline text, logo mark |
| `error` | `lightPalette.error` | `#BA1A1A` | error text/borders, danger-tone buttons |

`marketplace.buttonGradient` (used by every primary CTA on mobile) is three
stops: `#0B49B7 → #0E86C0 → #09C3BE`. The middle stop (`#0E86C0`) has no
semantic token of its own on mobile either — it's used as a literal.

`lightPalette.primary` (`#006874`, Material teal) is **deliberately not**
ported — mobile's own buttons don't use it (they use `marketplace.buttonGradient`
instead), so it would just be a second, unused teal.

**Naming collision, resolved:** the Tailwind config still has an old `ink` key
(`#06262f`, the pre-Phase-2 dark theme) alongside the new `brandInk` (`#061131`).
`ink`/`midnight`/`cyan`/`aqua`/`cloud`/`mist`/`line` are the retiring dark-theme
tokens — Phase 2 replaces every usage of them, file by file, with the tokens in
the table above. Once no file references them any more, delete the old keys
from `tailwind.config.ts`.

## Applying this to a page (Phase 2 conversion rules)

Every color in a converted file must be one of the tokens above (optionally
with Tailwind's opacity modifier, e.g. `bg-brandBlue/10`, `border-outline/60`)
— never a new hardcoded hex value. Rules for the patterns that recur across
the dark-theme pages:

- **Page/section background:** `bg-[#020916]` / `bg-[#04132C]` / similar → `bg-surface`.
- **Body text:** `text-white`, `text-white/60` → `text-onSurface` / `text-onSurfaceVariant`.
- **Headline text:** `text-white` on `font-display` headings → `text-brandInk`.
- **Decorative glows** (`bg-[#006cff]/18 blur-[150px]` etc.): keep the blur/shape, swap the color to `bg-brandBlue/10` or `bg-brandTeal/10` — a glow that reads on near-black needs roughly half the opacity to work on white without looking muddy. Tune down, not up, when in doubt.
- **Glass/dark card panels** (`bg-[#07172c]/80 border-[#31567e]/60`): become `bg-surface border border-outline` with a soft shadow (`shadow-brandCard`), not a translucent dark fill.
- **Borders:** `border-white/15`, `border-[#214867]` → `border-outline` (neutral) or `border-brandBlue/20` (accent).
- **Primary CTA gradients:** `from-[#1857ff] to-[#29c9ff]` style → the shared `Button`/`LinkButton` component (see below), not a hand-written gradient.

## Typography

Three families, each with a clear role:

| Family | Role | Weights used |
|---|---|---|
| Hanken Grotesk | display / headline | 700 (bold), 600 (semibold) |
| Inter | body / titles / controls | 400 (regular), 600 (semibold) |
| Geist | labels / mono data (OTPs, IDs, GB remaining) | 600 (semibold), 500 (medium) |

Type scale (`fontSize`, `lineHeight`, `letterSpacing`, `fontWeight`):

| Token | Size | Line height | Letter spacing | Weight | Family |
|---|---|---|---|---|---|
| `display-lg` | 28px | 34px | -0.56px | 700 | Hanken Grotesk |
| `headline-md` | 21px | 28px | -0.21px | 600 | Hanken Grotesk |
| `title-sm` | 16px | 22px | 0px | 600 | Inter |
| `body-md` | 14px | 21px | 0.14px | 400 | Inter |
| `body-sm` | 12.5px | 18px | 0.12px | 400 | Inter |
| `label-caps` | 11px | 14px | 0.88px | 600 | Geist (uppercase) |
| `mono-data` | 12.5px | 18px | -0.25px | 500 | Geist |

## Buttons

Mirrors mobile's `resolveButtonVisual` (`controls.ts`):

| Size | Height | Radius | Horizontal padding | Label size |
|---|---|---|---|---|
| `sm` | 34px | 8px | 8px | 13px |
| `md` | 46px | 12px | 16px | 14px |
| `lg` | 54px | 12px | 20px | 15px |

- `variant: "primary"` — always the brand gradient (`brandBlue → #0E86C0 → brandTeal`), white label, no border. The one unambiguous action on a screen; never used for a destructive action.
- `variant: "flat", tone: "brand"` — white background, `brandBlue` label, 1px border (`rgba(11,73,183,0.42)`).
- `variant: "flat", tone: "danger"` — white background, `error` label, 1px border (`rgba(186,26,26,0.38)`). Mobile deliberately has **no solid-red primary button** — destructive actions stay outlined, never filled red. The web's Delete Account flow currently uses a solid red fill; Phase 1 changes it to `flat/danger` to match this rule (see Task 8).
- Disabled: 40% opacity, non-interactive.

## Radius & spacing

- Radius scale: `sm:4, default:8, md:12, lg:16, xl:24, full:9999` (`radius.ts`).
- Spacing: mobile's 8pt scale (`xs:4, sm:8, md:12, lg:16, xl:20, 2xl:24, ...`) already matches Tailwind's default spacing scale 1:1 (Tailwind's `n` = `4n`px), so no custom spacing tokens are needed on the web side.
