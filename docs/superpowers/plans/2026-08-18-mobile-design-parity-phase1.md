# Mobile Design Parity — Phase 1 (Tokens, Fonts, Shared Button) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the web frontend the mobile app's brand color tokens, font families, and a shared `<Button>`/`<LinkButton>` component — then migrate the site's actual button components onto it — without touching any page's dark background or decorative artwork.

**Architecture:** Add new brand/semantic Tailwind tokens *alongside* the existing dark-theme tokens (additive, nothing removed or renamed) so none of the ~28 files using the old tokens break. Load Hanken Grotesk + Inter + Geist via `next/font/google` and wire them as CSS variables, replacing the currently-dead `--font-inter`/`--font-display` variables (they're referenced in `globals.css` today but never defined anywhere — the site has been falling back to system fonts). Extract button visuals into a pure, testable `resolveButtonClasses()` function (mirrors mobile's `resolveButtonVisual` in `controls.ts`), then build `Button`/`LinkButton` components on top of it, and swap the 4 files that render real CTA/action buttons over to them.

**Tech Stack:** Next.js 15 (App Router), Tailwind CSS 3, `next/font/google`, Vitest (`environment: "node"` — no jsdom/React rendering in tests).

**Reference:** Spec at `docs/superpowers/specs/2026-08-18-mobile-design-parity-design.md`. Mobile source of truth: `../velocity-eSim/src/theme/{colors,typography,controls,radius,spacing}.ts`.

---

## Scope note (read before starting)

This plan implements a **subset** of the approved spec. The spec's "Site background flips dark → light" and the `globals.css`/`tailwind.config.ts` literal cleanup (`.hero-grid`, `::selection`, `boxShadow.glow/card`) are **deferred to a Phase 2 plan**, because doing them now would visually break the ~28 files that still assume a dark canvas and haven't been redesigned yet. Do not remove or rename any existing Tailwind color key (`ink`, `midnight`, `cyan`, `aqua`, `cloud`, `mist`, `line`) or `boxShadow` key (`glow`, `card`) in this plan — only add new ones.

---

## Task 1: Typology / design system reference doc

**Files:**
- Create: `docs/design/mobile-design-system.md`

- [ ] **Step 1: Write the reference doc**

Create `docs/design/mobile-design-system.md` with this content:

```markdown
# Mobile design system reference

Extracted from `velocity-eSim/src/theme/` — the source of truth for the web
frontend's brand redesign (`docs/superpowers/specs/2026-08-18-mobile-design-parity-design.md`).
Do not edit mobile's theme files from here; this is a read-only snapshot for
web implementers.

## Colors — token mapping

| Web Tailwind token | Mobile source | Value | Used for |
|---|---|---|---|
| `surface` | `lightPalette.surface` | `#FFFFFF` | page/card background (Phase 2) |
| `onSurface` | `lightPalette.onSurface` | `#1A1F36` | body text (Phase 2) |
| `onSurfaceVariant` | `lightPalette.onSurfaceVariant` | `#44495E` | secondary text (Phase 2) |
| `outline` | `lightPalette.outlineVariant` | `#C4C7D4` | borders, dividers (Phase 2) |
| `brandBlue` | `marketplace.purple` (= `brand.blue`) | `#0B49B7` | gradient start, links |
| `brandTeal` | `marketplace.cyan` (= `brand.teal`) | `#09C3BE` | gradient end, small accents |
| `ink` (new) | `brand.ink` | `#061131` | headline text (Phase 2) — **not** the old `ink` (`#06262f`), see note below |
| `error` | `lightPalette.error` | `#BA1A1A` | error text/borders, danger-tone buttons |

`marketplace.buttonGradient` (used by every primary CTA on mobile) is three
stops: `#0B49B7 → #0E86C0 → #09C3BE`. The middle stop (`#0E86C0`) has no
semantic token of its own on mobile either — it's used as a literal.

`lightPalette.primary` (`#006874`, Material teal) is **deliberately not**
ported — mobile's own buttons don't use it (they use `marketplace.buttonGradient`
instead), so it would just be a second, unused teal.

**Naming collision:** the existing Tailwind config already has an `ink` key
(`#06262f`, part of the old dark theme, still used by `text-ink`/`bg-ink` in a
few files). Phase 1 does not touch it. When Phase 2 introduces the mobile
`brand.ink` value, it will need a different Tailwind key name (e.g. `brandInk`)
to avoid silently changing those existing usages — resolve this in the Phase 2
plan, not by editing this table.

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
```

- [ ] **Step 2: Commit**

```bash
git add docs/design/mobile-design-system.md
git commit -m "docs: add mobile design system reference for frontend redesign"
```

---

## Task 2: Tailwind color, font-family, and type-scale tokens

**Files:**
- Modify: `tailwind.config.ts`

- [ ] **Step 1: Add the new tokens (additive only)**

In `tailwind.config.ts`, inside `theme.extend`, add to the existing `colors` object (do not remove `ink`, `midnight`, `cyan`, `aqua`, `cloud`, `mist`, `line`):

```ts
colors: {
  ink: "#06262f",
  midnight: "#001f26",
  cyan: "#00d9f5",
  aqua: "#71efff",
  cloud: "#f4fbfd",
  mist: "#dff6fa",
  line: "#c7e9ef",
  // Mobile brand tokens (docs/design/mobile-design-system.md) — additive,
  // Phase 1 only wires these into the shared Button component.
  brandBlue: "#0B49B7",
  brandTeal: "#09C3BE",
  error: "#BA1A1A"
},
```

Change `fontFamily` to add the `mono` family and rename the CSS variables (fixes the currently-dead `--font-inter`/`--font-display` — see Task 3):

```ts
fontFamily: {
  sans: ["var(--font-sans)", "Inter", "system-ui", "sans-serif"],
  display: ["var(--font-display)", "Hanken Grotesk", "system-ui", "sans-serif"],
  mono: ["var(--font-mono)", "Geist", "ui-monospace", "monospace"]
},
```

Add `fontSize` to `theme.extend` (new key, additive — does not replace Tailwind's default scale):

```ts
fontSize: {
  "display-lg": ["28px", { lineHeight: "34px", letterSpacing: "-0.56px", fontWeight: "700" }],
  "headline-md": ["21px", { lineHeight: "28px", letterSpacing: "-0.21px", fontWeight: "600" }],
  "title-sm": ["16px", { lineHeight: "22px", letterSpacing: "0px", fontWeight: "600" }],
  "body-md": ["14px", { lineHeight: "21px", letterSpacing: "0.14px", fontWeight: "400" }],
  "body-sm": ["12.5px", { lineHeight: "18px", letterSpacing: "0.12px", fontWeight: "400" }],
  "label-caps": ["11px", { lineHeight: "14px", letterSpacing: "0.88px", fontWeight: "600" }],
  "mono-data": ["12.5px", { lineHeight: "18px", letterSpacing: "-0.25px", fontWeight: "500" }]
},
```

- [ ] **Step 2: Type-check**

Run: `pnpm exec tsc --noEmit`
Expected: no new errors (this is a config-only change).

- [ ] **Step 3: Commit**

```bash
git add tailwind.config.ts
git commit -m "feat: add mobile brand color and type-scale tokens to tailwind config"
```

---

## Task 3: Load Hanken Grotesk, Inter, and Geist via next/font

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `src/app/globals.css`

- [ ] **Step 1: Wire the fonts in `layout.tsx`**

Add the import and font instances above `RootLayout`, and apply the variable classes to `<body>`:

```tsx
import { Geist, Hanken_Grotesk, Inter } from "next/font/google";

const hankenGrotesk = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-display"
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-sans"
});

const geist = Geist({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-mono"
});
```

Change:

```tsx
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
```

to:

```tsx
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${hankenGrotesk.variable} ${inter.variable} ${geist.variable}`}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
```

- [ ] **Step 2: Fix `globals.css` to use the real font variables**

Replace:

```css
:root {
  color-scheme: light;
  --font-inter: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  --font-display: "Plus Jakarta Sans", Inter, ui-sans-serif, system-ui, sans-serif;
}
```

with:

```css
:root {
  color-scheme: light;
}
```

(The `--font-display`/`--font-sans`/`--font-mono` variables are now supplied by `next/font` on `<body>`; the fallback stacks live in `tailwind.config.ts`'s `fontFamily`.)

Replace:

```css
body {
  margin: 0;
  min-height: 100dvh;
  font-family: var(--font-inter);
  background: #020916;
}
```

with:

```css
body {
  margin: 0;
  min-height: 100dvh;
  font-family: var(--font-sans), Inter, ui-sans-serif, system-ui, sans-serif;
  background: #020916;
}
```

(Background stays `#020916` — deferred to Phase 2 per the scope note above.)

- [ ] **Step 3: Type-check**

Run: `pnpm exec tsc --noEmit`
Expected: no new errors.

- [ ] **Step 4: Manual check**

Run `pnpm dev`, open the site, inspect a heading element in devtools — computed `font-family` should resolve to `HankenGrotesk` (via the `--font-display` variable), not a system font.

- [ ] **Step 5: Commit**

```bash
git add src/app/layout.tsx src/app/globals.css
git commit -m "fix: load Hanken Grotesk/Inter/Geist via next/font (was falling back to system fonts)"
```

---

## Task 4: `resolveButtonClasses` — pure, testable button style resolver

**Files:**
- Create: `src/app/components/buttonClasses.ts`
- Test: `src/app/components/buttonClasses.test.ts`

Kept as a plain `.ts` file (no JSX) — this repo's Vitest config (`environment: "node"`, no React plugin, `tsconfig.json` has `"jsx": "preserve"`) doesn't transform `.tsx`, so pure logic must live outside any component file to stay testable. Mirrors mobile's split between `controls.ts` (logic) and its components.

- [ ] **Step 1: Write the failing test**

Create `src/app/components/buttonClasses.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { resolveButtonClasses } from "./buttonClasses";

describe("resolveButtonClasses", () => {
  it("defaults to a medium primary button with the brand gradient", () => {
    const classes = resolveButtonClasses();
    expect(classes).toContain("h-[46px]");
    expect(classes).toContain("rounded-[12px]");
    expect(classes).toContain("from-brandBlue");
    expect(classes).toContain("to-brandTeal");
    expect(classes).toContain("text-white");
  });

  it("sizes sm/md/lg to the mobile control heights", () => {
    expect(resolveButtonClasses({ size: "sm" })).toContain("h-[34px]");
    expect(resolveButtonClasses({ size: "md" })).toContain("h-[46px]");
    expect(resolveButtonClasses({ size: "lg" })).toContain("h-[54px]");
  });

  it("sm uses the 8px radius, md/lg use 12px", () => {
    expect(resolveButtonClasses({ size: "sm" })).toContain("rounded-[8px]");
    expect(resolveButtonClasses({ size: "md" })).toContain("rounded-[12px]");
    expect(resolveButtonClasses({ size: "lg" })).toContain("rounded-[12px]");
  });

  it("resolves flat/brand as a bordered white button with brand-blue text, no gradient", () => {
    const classes = resolveButtonClasses({ variant: "flat", tone: "brand" });
    expect(classes).toContain("text-brandBlue");
    expect(classes).toContain("bg-white");
    expect(classes).not.toContain("from-brandBlue");
  });

  it("resolves flat/danger with the error color and a bordered white background, never a solid fill", () => {
    const classes = resolveButtonClasses({ variant: "flat", tone: "danger" });
    expect(classes).toContain("text-error");
    expect(classes).toContain("bg-white");
    expect(classes).not.toContain("bg-error");
  });

  it("marks disabled buttons at 40% opacity and non-interactive", () => {
    const classes = resolveButtonClasses({ disabled: true });
    expect(classes).toContain("disabled:opacity-40");
    expect(classes).toContain("pointer-events-none");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm exec vitest run src/app/components/buttonClasses.test.ts`
Expected: FAIL — `Cannot find module './buttonClasses'`

- [ ] **Step 3: Write the implementation**

Create `src/app/components/buttonClasses.ts`:

```ts
export type ButtonVariant = "primary" | "flat";
export type ButtonTone = "brand" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

export interface ResolveButtonClassesArgs {
  variant?: ButtonVariant;
  tone?: ButtonTone;
  size?: ButtonSize;
  disabled?: boolean;
}

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "h-[34px] px-2 text-[13px] rounded-[8px]",
  md: "h-[46px] px-4 text-sm rounded-[12px]",
  lg: "h-[54px] px-5 text-[15px] rounded-[12px]"
};

const PRIMARY_CLASSES =
  "bg-gradient-to-r from-brandBlue via-[#0E86C0] to-brandTeal text-white " +
  "shadow-[0_14px_34px_rgba(11,73,183,0.28)] hover:-translate-y-0.5";

const FLAT_TONE_CLASSES: Record<ButtonTone, string> = {
  brand: "bg-white text-brandBlue border border-[rgba(11,73,183,0.42)] hover:bg-[rgba(11,73,183,0.06)]",
  danger: "bg-white text-error border border-[rgba(186,26,26,0.38)] hover:bg-[rgba(186,26,26,0.06)]"
};

/**
 * Resolves the Tailwind class string for one button state. Mirrors mobile's
 * `resolveButtonVisual` (velocity-eSim/src/theme/controls.ts): `tone` is only
 * read on `flat` — a primary CTA never turns red.
 */
export function resolveButtonClasses({
  variant = "primary",
  tone = "brand",
  size = "md",
  disabled = false
}: ResolveButtonClassesArgs = {}): string {
  const base =
    "inline-flex items-center justify-center gap-2 font-black transition disabled:cursor-not-allowed disabled:opacity-40";
  const paint = variant === "primary" ? PRIMARY_CLASSES : FLAT_TONE_CLASSES[tone];
  const disabledClasses = disabled ? "pointer-events-none" : "";

  return [base, SIZE_CLASSES[size], paint, disabledClasses].filter(Boolean).join(" ");
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm exec vitest run src/app/components/buttonClasses.test.ts`
Expected: PASS (6 tests)

- [ ] **Step 5: Commit**

```bash
git add src/app/components/buttonClasses.ts src/app/components/buttonClasses.test.ts
git commit -m "feat: add resolveButtonClasses, mirroring mobile's resolveButtonVisual"
```

---

## Task 5: `Button` and `LinkButton` components

**Files:**
- Create: `src/app/components/Button.tsx`

- [ ] **Step 1: Write the components**

Create `src/app/components/Button.tsx`:

```tsx
import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from "react";
import { resolveButtonClasses, type ButtonSize, type ButtonTone, type ButtonVariant } from "./buttonClasses";

interface ButtonOwnProps {
  variant?: ButtonVariant;
  tone?: ButtonTone;
  size?: ButtonSize;
}

type ButtonProps = ButtonOwnProps & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className"> & {
  className?: string;
};

/** Shared CTA/action button — see docs/design/mobile-design-system.md. */
export function Button({ variant, tone, size, className, disabled, ...rest }: ButtonProps) {
  const classes = resolveButtonClasses({ variant, tone, size, disabled });
  return (
    <button
      className={className ? `${classes} ${className}` : classes}
      disabled={disabled}
      {...rest}
    />
  );
}

type LinkButtonProps = ButtonOwnProps & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "className"> & {
  className?: string;
};

/** Same visuals as `Button`, rendered as an `<a>` for navigational CTAs. */
export function LinkButton({ variant, tone, size, className, ...rest }: LinkButtonProps) {
  const classes = resolveButtonClasses({ variant, tone, size });
  return <a className={className ? `${classes} ${className}` : classes} {...rest} />;
}
```

- [ ] **Step 2: Type-check**

Run: `pnpm exec tsc --noEmit`
Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/components/Button.tsx
git commit -m "feat: add shared Button/LinkButton components"
```

---

## Task 6: Migrate `PayButton`

**Files:**
- Modify: `src/app/checkout/PayButton.tsx`

- [ ] **Step 1: Replace the hardcoded button**

In `src/app/checkout/PayButton.tsx`, add the import:

```tsx
import { Button } from "@/app/components/Button";
```

Replace:

```tsx
      <button
        className="inline-flex h-12 w-full items-center justify-center gap-3 rounded-[12px] bg-gradient-to-r from-[#1857ff] to-[#29c9ff] text-sm font-black text-white shadow-[0_14px_34px_rgba(18,102,255,0.28)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={busy}
        onClick={() => void startPayment()}
        type="button"
      >
        {busy ? <Loader2 className="animate-spin" size={18} /> : <CreditCard size={18} />}
        {busy ? "Opening secure checkout…" : "Pay with Pokpay"}
      </button>
```

with:

```tsx
      <Button
        className="w-full"
        disabled={busy}
        onClick={() => void startPayment()}
        size="lg"
        type="button"
      >
        {busy ? <Loader2 className="animate-spin" size={18} /> : <CreditCard size={18} />}
        {busy ? "Opening secure checkout…" : "Pay with Pokpay"}
      </Button>
```

- [ ] **Step 2: Type-check**

Run: `pnpm exec tsc --noEmit`
Expected: no new errors.

- [ ] **Step 3: Manual check**

Run `pnpm dev`, visit `/checkout?package=<any-valid-id>` (or trigger the checkout flow from a plan), confirm the pay button renders with the brand blue→teal gradient at 54px height.

- [ ] **Step 4: Commit**

```bash
git add src/app/checkout/PayButton.tsx
git commit -m "refactor: migrate PayButton to the shared Button component"
```

---

## Task 7: Migrate the `Navbar` CTA

**Files:**
- Modify: `src/app/components/Navbar.tsx`

- [ ] **Step 1: Replace the hardcoded CTA link**

Add the import:

```tsx
import { LinkButton } from "./Button";
```

Replace:

```tsx
          <a
            className="inline-flex h-11 items-center justify-center rounded-full bg-gradient-to-r from-[#1557ff] to-[#27c6ff] px-5 text-sm font-bold text-white shadow-[0_12px_32px_rgba(24,111,255,0.38)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_38px_rgba(24,111,255,0.5)] sm:px-7"
            href="/#download-app"
          >
            Get eSIM Now
          </a>
```

with:

```tsx
          <LinkButton className="px-5 sm:px-7" href="/#download-app">
            Get eSIM Now
          </LinkButton>
```

(`LinkButton`'s `md` default is 46px tall / 12px radius, close to the original 44px/full-pill — the radius changes from a full pill to 12px to match mobile's CTA shape. `px-5 sm:px-7` overrides the token's default horizontal padding to preserve the wider tap target on desktop.)

- [ ] **Step 2: Type-check**

Run: `pnpm exec tsc --noEmit`
Expected: no new errors.

- [ ] **Step 3: Manual check**

Run `pnpm dev`, load the landing page, confirm the navbar's "Get eSIM Now" button shows the brand gradient.

- [ ] **Step 4: Commit**

```bash
git add src/app/components/Navbar.tsx
git commit -m "refactor: migrate Navbar CTA to the shared LinkButton component"
```

---

## Task 8: Migrate `SignOutButton`

**Files:**
- Modify: `src/app/components/SignOutButton.tsx`

- [ ] **Step 1: Replace the hardcoded button**

Add the import:

```tsx
import { Button } from "./Button";
```

Replace:

```tsx
    <button
      className="inline-flex h-10 items-center gap-2 rounded-[11px] border border-[#214867] px-4 text-xs font-black text-[#8ea3ba] transition hover:border-[#168cff]/75 hover:text-white disabled:opacity-60"
      disabled={busy}
      onClick={() => void signOut()}
      type="button"
    >
      <LogOut size={15} />
      Sign out
    </button>
```

with:

```tsx
    <Button disabled={busy} onClick={() => void signOut()} size="sm" tone="brand" type="button" variant="flat">
      <LogOut size={15} />
      Sign out
    </Button>
```

- [ ] **Step 2: Type-check**

Run: `pnpm exec tsc --noEmit`
Expected: no new errors.

- [ ] **Step 3: Manual check**

Run `pnpm dev`, sign in, visit `/profile`, confirm the sign-out button shows a bordered white button with brand-blue text.

- [ ] **Step 4: Commit**

```bash
git add src/app/components/SignOutButton.tsx
git commit -m "refactor: migrate SignOutButton to the shared Button component"
```

---

## Task 9: Migrate `DeleteAccountCard`'s three buttons

**Files:**
- Modify: `src/app/profile/DeleteAccountCard.tsx`

Mobile has no solid-red primary button (see Task 1's typology doc) — all three
buttons below become `flat`, with `tone="danger"` for the two destructive ones
and `tone="brand"` for Cancel. This changes the "Yes, delete my account" button
from a solid red fill to an outlined one; flag this visually in review since
it changes the confirm step's visual weight.

- [ ] **Step 1: Replace the three buttons**

Add the import:

```tsx
import { Button } from "@/app/components/Button";
```

Replace the "Yes, delete my account" button:

```tsx
            <button
              className="inline-flex h-11 items-center justify-center gap-2 rounded-[12px] bg-[#c2283c] px-6 text-sm font-black text-white transition hover:bg-[#d93951] disabled:cursor-not-allowed disabled:opacity-60"
              disabled={busy}
              onClick={() => void deleteAccount()}
              type="button"
            >
              {busy ? <Loader2 className="animate-spin" size={16} /> : null}
              {busy ? "Deleting…" : "Yes, delete my account"}
            </button>
```

with:

```tsx
            <Button disabled={busy} onClick={() => void deleteAccount()} tone="danger" type="button" variant="flat">
              {busy ? <Loader2 className="animate-spin" size={16} /> : null}
              {busy ? "Deleting…" : "Yes, delete my account"}
            </Button>
```

Replace the "Cancel" button:

```tsx
            <button
              className="inline-flex h-11 items-center justify-center rounded-[12px] border border-[#214867] px-6 text-sm font-black text-[#8ea3ba] transition hover:text-white disabled:opacity-60"
              disabled={busy}
              onClick={() => {
                setConfirming(false);
                setError(null);
              }}
              type="button"
            >
              Cancel
            </button>
```

with:

```tsx
            <Button
              disabled={busy}
              onClick={() => {
                setConfirming(false);
                setError(null);
              }}
              tone="brand"
              type="button"
              variant="flat"
            >
              Cancel
            </Button>
```

Replace the initial "Delete account" button:

```tsx
          <button
            className="mt-5 inline-flex h-11 items-center justify-center rounded-[12px] border border-[#7a1c2c] px-6 text-sm font-black text-[#ff8792] transition hover:bg-[#c2283c] hover:text-white"
            onClick={() => setConfirming(true)}
            type="button"
          >
            Delete account
          </button>
```

with:

```tsx
          <Button className="mt-5" onClick={() => setConfirming(true)} tone="danger" type="button" variant="flat">
            Delete account
          </Button>
```

- [ ] **Step 2: Type-check**

Run: `pnpm exec tsc --noEmit`
Expected: no new errors.

- [ ] **Step 3: Manual check**

Run `pnpm dev`, visit `/profile`, click "Delete account", confirm both the initial and confirm-step buttons render as outlined (not solid-filled) red buttons, and Cancel renders as an outlined brand-blue button.

- [ ] **Step 4: Commit**

```bash
git add src/app/profile/DeleteAccountCard.tsx
git commit -m "refactor: migrate DeleteAccountCard buttons to the shared Button component"
```

---

## Task 10: Full verification

- [ ] **Step 1: Type-check the whole project**

Run: `pnpm exec tsc --noEmit`
Expected: no errors.

- [ ] **Step 2: Run the full test suite**

Run: `pnpm test`
Expected: all tests pass, including the 6 new `buttonClasses.test.ts` cases.

- [ ] **Step 3: Manual visual pass**

Run `pnpm dev` and check, in a browser:
- Landing page navbar CTA — brand gradient, 46px/12px radius.
- `/checkout` pay button — brand gradient, 54px/12px radius.
- `/profile` sign-out button — outlined, brand-blue text.
- `/profile` → Delete account flow — both buttons outlined red, Cancel outlined brand-blue.
- A heading anywhere on the site — inspect computed `font-family`, confirm it's Hanken Grotesk (not a system fallback).
- Every other page still looks exactly as before (dark canvas, old gradients) — confirms nothing outside the 4 migrated files changed.

- [ ] **Step 4: Report**

Summarize what changed and confirm this closes Phase 1; note that page-background/decorative rework (Phase 2) is a separate follow-up plan.
