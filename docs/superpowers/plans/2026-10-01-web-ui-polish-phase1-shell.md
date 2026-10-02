# Web UI Polish, Phase 1: Navigation Shell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Repo rule (overrides any skill):** never run `git commit` without asking the user first, every time. Every "Commit" step below means *stage the files, show the message, ask, and only commit on a yes*. Stay on the current branch, with no new branches or worktrees.

**Goal:** Replace the public site's navigation shell with the mobile-app pattern: a floating capsule navbar on desktop, a capsule top bar plus the app's floating bottom tab dock on phones and tablets, and the quiet light footer. Content and links stay unchanged.

**Architecture:** Dock routing and visibility logic lives in a pure module (`dockNav.ts`) covered by vitest. `BottomDock` is a small client island that reads `usePathname()` and is rendered by `Navbar`, which every public page already includes and which admin pages don't, so no admin route pattern ends up in client code. Navbar stays static (no cookie reads, f022). Footer clearance for the dock is a single `:has()` rule in `globals.css`.

**Tech Stack:** Next.js 15 App Router, React 19, Tailwind 3.4, lucide-react 0.475, vitest (node env, source-string and pure-logic tests; there's no RTL harness).

**Spec:** `docs/superpowers/specs/2026-10-01-web-ui-mobile-polish-design.md` (sections "Breakpoints", "1. Navigation shell", "1b. Footer").

**Scope:** This plan covers spec build-order steps 1–2 (shell). Steps 3–10 (hero, browse, plans, checkout, account, homepage blocks, content, partners) each get their own plan once the previous phase has shipped. Shared primitives such as `PhotoTile` and `PlanRow` are built in the phase that first needs them, not upfront.

**Baseline (2026-10-01):** `pnpm test` → 67 files, 549 tests passing.

---

## File map

| File | Action | Responsibility |
|---|---|---|
| `tailwind.config.ts` | modify | add `surfaceBright` color + `dock` / `dockCenter` shadows (mobile values) |
| `src/app/components/dockNav.ts` | create | dock items, `isDockVisible()`, `activeDockItem()`, pure |
| `src/app/components/dockNav.test.ts` | create | unit tests for the above |
| `src/app/components/BottomDock.tsx` | create | phone/tablet dock UI (client) |
| `src/app/components/Navbar.tsx` | modify | capsule bar, drop `theme` prop, render `BottomDock`, split primary/secondary links |
| `src/app/components/MobileNavbarMenu.tsx` | modify | restyled ☰ panel with secondary links only, drop `dark` prop |
| `src/app/page.tsx:79` | modify | `<Navbar theme="dark" />` → `<Navbar />` |
| `src/app/SiteFooter.tsx` | modify | quiet light footer, 2-column links on phones |
| `src/app/globals.css` | modify | footer bottom clearance while the dock is mounted |
| `src/app/components/OpenInAppBanner.tsx:30` | modify | lift the banner above the dock below `lg` |
| `src/app/public-shell.test.ts` | modify | guard the new shell contract |

---

### Task 1: Tokens

**Files:**
- Modify: `tailwind.config.ts`

- [ ] **Step 1: Add the mobile `surfaceBright` color and the dock shadows**

In `theme.extend.colors`, add after `brandInk: "#061131"`:

```ts
        brandInk: "#061131",
        // velocity-eSim lightPalette.surfaceBright: soft page/section tint
        surfaceBright: "#F5F7FA"
```

In `theme.extend.boxShadow`, add after `brandCard`:

```ts
        brandCard: "0 20px 60px rgba(6, 17, 49, 0.08)",
        // velocity-eSim BottomTabBar capsule + center ring glow
        dock: "0 8px 24px rgba(6, 17, 49, 0.18)",
        dockCenter: "0 8px 22px rgba(9, 195, 190, 0.35)"
```

- [ ] **Step 2: Type-check**

Run: `pnpm exec tsc --noEmit`
Expected: no output (exit 0).

- [ ] **Step 3: Commit (ask first)**

```bash
git add tailwind.config.ts
git commit -m "feat(shell): add surfaceBright token and dock shadows"
```

---

### Task 2: Dock routing logic (TDD)

**Files:**
- Create: `src/app/components/dockNav.ts`
- Test: `src/app/components/dockNav.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/app/components/dockNav.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { DOCK_ITEMS, activeDockItem, isDockVisible } from "./dockNav";

describe("DOCK_ITEMS", () => {
  it("mirrors the app tab order with Destinations as the single center action", () => {
    expect(DOCK_ITEMS.map((item) => item.href)).toEqual([
      "/",
      "/account",
      "/destinations",
      "/support",
      "/profile"
    ]);
    expect(DOCK_ITEMS.filter((item) => item.center).map((item) => item.id)).toEqual([
      "destinations"
    ]);
  });
});

describe("isDockVisible", () => {
  it("shows the dock on public browsing and account routes", () => {
    for (const path of ["/", "/destinations", "/esim/usa", "/account", "/account/42", "/profile", "/support", "/partners/dashboard"]) {
      expect(isDockVisible(path)).toBe(true);
    }
  });

  it("hides the dock where it would compete with a form's primary action", () => {
    for (const path of ["/checkout", "/checkout/failed", "/signin", "/profile/deleted"]) {
      expect(isDockVisible(path)).toBe(false);
    }
  });

  it("matches whole path segments, not string prefixes", () => {
    expect(isDockVisible("/checkouts-guide")).toBe(true);
    expect(isDockVisible("/signing")).toBe(true);
  });

  it("defaults to visible when the pathname is unknown", () => {
    expect(isDockVisible(null)).toBe(true);
  });
});

describe("activeDockItem", () => {
  it("only marks Home on the exact root", () => {
    expect(activeDockItem("/")).toBe("home");
    expect(activeDockItem("/travel")).toBeNull();
  });

  it("maps destination, plan and package pages to the center Destinations tab", () => {
    expect(activeDockItem("/destinations")).toBe("destinations");
    expect(activeDockItem("/esim/japan")).toBe("destinations");
    expect(activeDockItem("/pkg/abc")).toBe("destinations");
    expect(activeDockItem("/esimguide")).toBeNull();
  });

  it("maps account, support and profile sub-routes to their tabs", () => {
    expect(activeDockItem("/account/7")).toBe("esims");
    expect(activeDockItem("/support")).toBe("support");
    expect(activeDockItem("/profile/billing")).toBe("profile");
  });

  it("returns null for an unknown pathname", () => {
    expect(activeDockItem(null)).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run src/app/components/dockNav.test.ts`
Expected: FAIL, `Failed to resolve import "./dockNav"`.

- [ ] **Step 3: Write the implementation**

Create `src/app/components/dockNav.ts`:

```ts
/**
 * Routing rules for the phone/tablet bottom dock (BottomDock.tsx), which mirrors
 * the app's BottomTabBar (velocity-eSim/src/components/bottomTabLayout.ts).
 * Pure so it can be unit-tested; the component only renders what this decides.
 */
export type DockItemId = "home" | "esims" | "destinations" | "support" | "profile";

export interface DockItem {
  id: DockItemId;
  label: string;
  href: string;
  /** The raised gradient circle in the middle of the dock (the app's Marketplace). */
  center?: boolean;
}

export const DOCK_ITEMS: readonly DockItem[] = [
  { id: "home", label: "Home", href: "/" },
  { id: "esims", label: "My eSIMs", href: "/account" },
  { id: "destinations", label: "Destinations", href: "/destinations", center: true },
  { id: "support", label: "Support", href: "/support" },
  { id: "profile", label: "Profile", href: "/profile" }
];

/** Routes whose own primary action (Pay, Send code) must not share the screen bottom. */
const HIDDEN_ON: readonly string[] = ["/checkout", "/signin", "/profile/deleted"];

const ACTIVE_ON: ReadonlyArray<readonly [DockItemId, readonly string[]]> = [
  ["esims", ["/account"]],
  ["destinations", ["/destinations", "/esim", "/pkg"]],
  ["support", ["/support"]],
  ["profile", ["/profile"]]
];

function isUnder(pathname: string, base: string): boolean {
  return pathname === base || pathname.startsWith(`${base}/`);
}

export function isDockVisible(pathname: string | null): boolean {
  if (!pathname) return true;
  return !HIDDEN_ON.some((base) => isUnder(pathname, base));
}

export function activeDockItem(pathname: string | null): DockItemId | null {
  if (!pathname) return null;
  if (pathname === "/") return "home";
  for (const [id, bases] of ACTIVE_ON) {
    if (bases.some((base) => isUnder(pathname, base))) return id;
  }
  return null;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run src/app/components/dockNav.test.ts`
Expected: PASS, 9 tests.

- [ ] **Step 5: Commit (ask first)**

```bash
git add src/app/components/dockNav.ts src/app/components/dockNav.test.ts
git commit -m "feat(shell): dock routing rules (visibility + active tab)"
```

---

### Task 3: BottomDock component

**Files:**
- Create: `src/app/components/BottomDock.tsx`
- Modify: `src/app/public-shell.test.ts` (append a test)

- [ ] **Step 1: Write the failing source-contract test**

Append inside the `describe("public navigation shell", ...)` block in `src/app/public-shell.test.ts`:

```ts
  it("renders the app-style bottom dock on phones and tablets only", () => {
    const dock = readFileSync("src/app/components/BottomDock.tsx", "utf8");

    expect(dock).toContain('"use client"');
    expect(dock).toContain("isDockVisible(pathname)");
    expect(dock).toContain("activeDockItem(pathname)");
    expect(dock).toContain("lg:hidden");
    expect(dock).toContain("data-bottom-dock");
    expect(dock).toContain('aria-current={isActive ? "page" : undefined}');
    // Static links only: the dock renders on statically generated pages (f022).
    expect(dock).not.toContain("cookies");
    expect(dock).not.toContain("esim_at");
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run src/app/public-shell.test.ts`
Expected: FAIL, `ENOENT: no such file or directory, open 'src/app/components/BottomDock.tsx'`.

- [ ] **Step 3: Write the component**

Create `src/app/components/BottomDock.tsx`:

```tsx
"use client";

import type { LucideIcon } from "lucide-react";
import { CircleHelp, Globe2, House, Smartphone, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { DOCK_ITEMS, activeDockItem, isDockVisible, type DockItemId } from "./dockNav";

const ICONS: Record<DockItemId, LucideIcon> = {
  home: House,
  esims: Smartphone,
  destinations: Globe2,
  support: CircleHelp,
  profile: UserRound
};

/**
 * Floating tab dock for phones and tablets: the web twin of the app's
 * BottomTabBar (80%-wide capsule, raised gradient center action). Links are
 * static: no session reads, so pages that render it stay statically generated
 * (f022). Hidden at lg+, where the capsule navbar takes over.
 *
 * `data-bottom-dock` is what globals.css keys the footer's bottom clearance on.
 */
export function BottomDock() {
  const pathname = usePathname();
  if (!isDockVisible(pathname)) return null;
  const active = activeDockItem(pathname);

  return (
    <nav
      aria-label="Quick navigation"
      className="pointer-events-none fixed inset-x-0 bottom-[max(12px,env(safe-area-inset-bottom))] z-40 flex justify-center px-[10%] lg:hidden"
      data-bottom-dock
    >
      <ul className="pointer-events-auto flex h-[60px] w-full max-w-[420px] items-center justify-around rounded-full border border-outline/50 bg-surface/95 px-2 shadow-dock backdrop-blur-md">
        {DOCK_ITEMS.map((item) => {
          const Icon = ICONS[item.id];
          const isActive = item.id === active;

          if (item.center) {
            return (
              <li key={item.id}>
                <Link
                  aria-current={isActive ? "page" : undefined}
                  aria-label={item.label}
                  className="-mt-[30px] grid h-[66px] w-[66px] place-items-center rounded-full bg-surface shadow-dockCenter transition active:scale-95"
                  href={item.href}
                >
                  <span className="grid h-[52px] w-[52px] place-items-center rounded-full bg-gradient-to-r from-brandBlue via-[#0E86C0] to-brandTeal text-white">
                    <Icon aria-hidden="true" size={26} />
                  </span>
                </Link>
              </li>
            );
          }

          return (
            <li key={item.id}>
              <Link
                aria-current={isActive ? "page" : undefined}
                className={[
                  "flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-0.5 text-[10px] font-semibold transition",
                  isActive ? "text-brandBlue" : "text-onSurfaceVariant hover:text-brandInk"
                ].join(" ")}
                href={item.href}
              >
                <Icon aria-hidden="true" size={22} strokeWidth={isActive ? 2.4 : 2} />
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
```

`#0E86C0` is the documented middle gradient stop (`docs/design/mobile-design-system.md`) and is already used by `buttonClasses.ts`, so it isn't a new hex value.

- [ ] **Step 4: Run tests**

Run: `pnpm exec vitest run src/app/public-shell.test.ts src/app/components/dockNav.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit (ask first)**

```bash
git add src/app/components/BottomDock.tsx src/app/public-shell.test.ts
git commit -m "feat(shell): app-style bottom dock for phones and tablets"
```

---

### Task 4: Capsule Navbar + secondary-link menu

**Files:**
- Modify: `src/app/components/Navbar.tsx` (full rewrite of the component body)
- Modify: `src/app/components/MobileNavbarMenu.tsx` (full rewrite)
- Modify: `src/app/page.tsx:79`
- Modify: `src/app/public-shell.test.ts`

- [ ] **Step 1: Update the shell tests to the new contract (failing)**

In `src/app/public-shell.test.ts`, replace the test `"keeps primary purchase navigation available on mobile"` with:

```ts
  it("keeps primary purchase navigation available on mobile", () => {
    const navbar = readFileSync("src/app/components/Navbar.tsx", "utf8");
    const mobileMenu = readFileSync("src/app/components/MobileNavbarMenu.tsx", "utf8");

    expect(navbar).toContain("MobileNavbarMenu");
    expect(navbar).toContain("<BottomDock />");
    expect(mobileMenu).toContain('aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}');
    expect(mobileMenu).toContain("lg:hidden");
    expect(mobileMenu).toContain("Browse eSIM plans");
  });

  it("uses one capsule navbar style on every page instead of a dark/light theme switch", () => {
    const navbar = readFileSync("src/app/components/Navbar.tsx", "utf8");
    const home = readFileSync("src/app/page.tsx", "utf8");

    expect(navbar).toContain("rounded-full");
    expect(navbar).toContain("backdrop-blur-md");
    expect(navbar).not.toContain('theme?: "light" | "dark"');
    expect(home).not.toContain('<Navbar theme="dark" />');
    // The dock must sit outside the blurred capsule: backdrop-filter creates a
    // containing block that would pin a position:fixed child to the header.
    expect(navbar.indexOf("<BottomDock />")).toBeGreaterThan(navbar.indexOf("</header>"));
  });
```

- [ ] **Step 2: Run to verify failure**

Run: `pnpm exec vitest run src/app/public-shell.test.ts`
Expected: FAIL on `<BottomDock />` and the theme assertions.

- [ ] **Step 3: Rewrite `Navbar.tsx`**

Replace the whole file `src/app/components/Navbar.tsx` with:

```tsx
import { landingContent } from "@/content/landing";
import Image from "next/image";
import { Handshake, UserRound } from "lucide-react";
import { BottomDock } from "./BottomDock";
import { LinkButton } from "./Button";
import { DOCK_ITEMS } from "./dockNav";
import { MobileNavbarMenu } from "./MobileNavbarMenu";

const navItems = [
  {
    label: "Home",
    href: "/"
  },
  {
    label: "Plans",
    href: "/#plans"
  },
  {
    label: "Destinations",
    href: "/destinations"
  },
  {
    label: "How it Works",
    href: "/#how-it-works"
  },
  {
    label: "About Us",
    href: "/#benefits"
  },
  {
    label: "Support",
    href: "/support"
  }
];

/** Below lg the dock already carries these, so the ☰ panel lists only the rest. */
const dockHrefs = new Set(DOCK_ITEMS.map((item) => item.href));
const secondaryNavItems = navItems.filter((item) => !dockHrefs.has(item.href));

/**
 * Floating capsule nav (the app's glass header at web scale). One style on every
 * page: frosted white reads over both light pages and photo heroes.
 *
 * Static on purpose: it renders on statically generated public pages, so it
 * must not read cookies (f022).
 */
export function Navbar() {
  return (
    <>
      <header className="absolute inset-x-0 top-0 z-50 px-3 pt-3 lg:px-6">
        <nav
          aria-label="Main"
          className="relative mx-auto flex h-14 max-w-[1240px] items-center justify-between rounded-full border border-outline/60 bg-surface/80 pl-4 pr-2 shadow-brandCard backdrop-blur-md lg:h-16 lg:pl-5"
        >
          <a
            aria-label="eSim2you home"
            className="flex shrink-0 items-center gap-2.5"
            href="/"
          >
            <Image
              alt="eSim2you app logo"
              className="h-9 w-9 object-contain lg:h-10 lg:w-10"
              height={40}
              src="/logo-icon.png"
              width={40}
            />

            <span className="font-display text-lg font-bold tracking-[-0.02em] text-brandInk">
              {landingContent.brand}
            </span>
          </a>

          <div className="hidden items-center gap-7 lg:flex">
            {navItems.map((item) => (
              <a
                className="text-sm font-medium text-onSurfaceVariant transition-colors hover:text-brandInk"
                href={item.href}
                key={item.href}
              >
                {item.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <a
              aria-label="Partner with eSim2you"
              className="hidden items-center gap-2 rounded-full border border-outline px-4 py-2 text-sm font-semibold text-onSurfaceVariant transition hover:border-brandBlue/40 hover:text-brandBlue lg:flex"
              href="/partners/request"
            >
              <Handshake aria-hidden="true" size={17} />
              Partner with us
            </a>

            {/* Static on purpose: the link always points at /profile — the
                middleware guard sends signed-out visitors to
                /signin?next=/profile and lets signed-in visitors through.
                Below lg the dock's Profile tab replaces it. */}
            <a
              aria-label="Your profile"
              className="hidden h-11 w-11 place-items-center rounded-full border border-outline text-onSurfaceVariant transition hover:border-brandBlue/40 hover:text-brandBlue lg:grid"
              href="/profile"
            >
              <UserRound aria-hidden="true" size={19} />
            </a>

            <MobileNavbarMenu navItems={secondaryNavItems} />

            <LinkButton className="hidden px-6 lg:inline-flex" href="/destinations">
              Get eSIM Now
            </LinkButton>
          </div>
        </nav>
      </header>

      <BottomDock />
    </>
  );
}
```

- [ ] **Step 4: Rewrite `MobileNavbarMenu.tsx`**

Replace the whole file `src/app/components/MobileNavbarMenu.tsx` with:

```tsx
"use client";

import { Handshake, Menu, X } from "lucide-react";
import { useState } from "react";
import { LinkButton } from "./Button";

type NavItem = {
  label: string;
  href: string;
};

/**
 * Phone/tablet ☰ panel. Holds only the links the bottom dock doesn't
 * (Plans, How it Works, About Us, Partner with us) plus the browse CTA.
 * Anchored to the capsule nav, which is `relative`.
 */
export function MobileNavbarMenu({ navItems }: { navItems: readonly NavItem[] }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const close = () => setMobileOpen(false);

  return (
    <>
      <button
        aria-expanded={mobileOpen}
        aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
        className="grid h-11 w-11 place-items-center rounded-full border border-outline text-onSurfaceVariant transition hover:border-brandBlue/40 hover:text-brandBlue lg:hidden"
        onClick={() => setMobileOpen((open) => !open)}
        type="button"
      >
        {mobileOpen ? <X aria-hidden="true" size={19} /> : <Menu aria-hidden="true" size={19} />}
      </button>

      {mobileOpen ? (
        <div className="absolute inset-x-0 top-[calc(100%+8px)] rounded-[22px] border border-outline/60 bg-surface p-2 shadow-brandCard lg:hidden">
          <div className="flex flex-col">
            {navItems.map((item) => (
              <a
                className="rounded-[14px] px-4 py-3 text-sm font-semibold text-brandInk transition hover:bg-surfaceBright"
                href={item.href}
                key={item.href}
                onClick={close}
              >
                {item.label}
              </a>
            ))}
            <a
              className="flex items-center gap-2 rounded-[14px] px-4 py-3 text-sm font-semibold text-brandInk transition hover:bg-surfaceBright"
              href="/partners/request"
              onClick={close}
            >
              <Handshake aria-hidden="true" className="text-brandBlue" size={17} />
              Partner with us
            </a>
            <LinkButton className="mt-2 w-full" href="/destinations" onClick={close}>
              Browse eSIM plans
            </LinkButton>
          </div>
        </div>
      ) : null}
    </>
  );
}
```

- [ ] **Step 5: Drop the theme prop on the homepage**

In `src/app/page.tsx` line 79, change:

```tsx
      <Navbar theme="dark" />
```

to:

```tsx
      <Navbar />
```

- [ ] **Step 6: Run tests + type-check**

Run: `pnpm exec vitest run src/app/public-shell.test.ts && pnpm exec tsc --noEmit`
Expected: PASS, and tsc prints nothing. If tsc reports another `theme=` or `dark=` usage, remove that prop the same way. As of 2026-10-01, `page.tsx` is the only caller passing `theme`.

- [ ] **Step 7: Commit (ask first)**

```bash
git add src/app/components/Navbar.tsx src/app/components/MobileNavbarMenu.tsx src/app/page.tsx src/app/public-shell.test.ts
git commit -m "feat(shell): floating capsule navbar; secondary links in the phone menu"
```

---

### Task 5: Quiet light footer + dock clearance

**Files:**
- Modify: `src/app/SiteFooter.tsx:47-48,92`
- Modify: `src/app/globals.css` (append)
- Modify: `src/app/public-shell.test.ts`

- [ ] **Step 1: Add the failing test**

Append inside the `describe` block in `src/app/public-shell.test.ts`:

```ts
  it("uses the quiet light footer and clears the phone dock", () => {
    const footer = readFileSync("src/app/SiteFooter.tsx", "utf8");
    const css = readFileSync("src/app/globals.css", "utf8");

    expect(footer).toContain("bg-surfaceBright");
    expect(footer).toContain("grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3");
    expect(css).toContain("body:has([data-bottom-dock]) footer[aria-label=\"Footer\"]");
  });
```

- [ ] **Step 2: Run to verify failure**

Run: `pnpm exec vitest run src/app/public-shell.test.ts`
Expected: FAIL on `bg-surfaceBright`.

- [ ] **Step 3: Restyle the footer**

In `src/app/SiteFooter.tsx`, change the `<footer>` opening tag:

```tsx
    <footer aria-label="Footer" className="border-t border-outline bg-surface text-onSurface">
```

to:

```tsx
    <footer aria-label="Footer" className="border-t border-outline/60 bg-surfaceBright text-onSurface">
```

And change the link-columns wrapper:

```tsx
          <div className="grid gap-8 sm:grid-cols-3">
```

to:

```tsx
          <div className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3">
```

Leave the brand blurb, social links, the column contents and the bottom legal row unchanged.

- [ ] **Step 4: Add the clearance rule**

Append to `src/app/globals.css`:

```css
/* The phone/tablet dock (BottomDock.tsx) floats over the page bottom: give the
   footer's last row room to scroll clear of it. Only while the dock is mounted,
   so checkout/sign-in (no dock) keep their normal footer padding. */
@media (max-width: 1023px) {
  body:has([data-bottom-dock]) footer[aria-label="Footer"] {
    padding-bottom: 8rem;
  }
}
```

- [ ] **Step 5: Run tests**

Run: `pnpm exec vitest run src/app/public-shell.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit (ask first)**

```bash
git add src/app/SiteFooter.tsx src/app/globals.css src/app/public-shell.test.ts
git commit -m "feat(shell): quiet light footer with phone dock clearance"
```

---

### Task 6: Keep the "Open in the app" banner above the dock

**Files:**
- Modify: `src/app/components/OpenInAppBanner.tsx:30`

The banner is `fixed bottom-3` on phones only and shows on shared `/pkg` links, where the dock is also visible. Both would occupy the same spot.

- [ ] **Step 1: Lift it above the dock below lg**

Change:

```tsx
    <div className="fixed inset-x-3 bottom-3 z-50 flex items-center gap-3 rounded-2xl bg-brandInk px-4 py-3 text-white shadow-lg">
```

to:

```tsx
    <div className="fixed inset-x-3 bottom-[calc(max(12px,env(safe-area-inset-bottom))_+_84px)] z-50 flex items-center gap-3 rounded-2xl bg-brandInk px-4 py-3 text-white shadow-lg lg:bottom-3">
```

(84px = 60px dock + 24px gap. The dock is never shown at lg+.)

- [ ] **Step 2: Type-check**

Run: `pnpm exec tsc --noEmit`
Expected: no output.

- [ ] **Step 3: Commit (ask first)**

```bash
git add src/app/components/OpenInAppBanner.tsx
git commit -m "fix(shell): keep the open-in-app banner above the bottom dock"
```

---

### Task 7: Full verification

- [ ] **Step 1: Full test suite**

Run: `pnpm test`
Expected: all green, **68 files, 559+ tests** (baseline 67 / 549, plus `dockNav.test.ts` with 9 tests and 2 new `public-shell` tests). If an unrelated pre-existing source-string test pins the old navbar or footer classes, update its assertion to the new class and note it in the session doc. Don't delete it.

- [ ] **Step 2: Production build**

Run: `pnpm build`
Expected: build succeeds, and the public routes (`/`, `/destinations`, `/esim/[slug]`, `/travel/*`) are still listed as static (○ / ●) in the route table, not dynamic (ƒ). If one flipped to ƒ, something in the shell read request data. Fix that before continuing.

- [ ] **Step 3: Manual browser pass**

Run: `pnpm dev`, then check in the browser at **375, 768, 1024 and 1440px** wide:

| Check | Expected |
|---|---|
| `/` at 375 | capsule top bar (logo + ☰); dock at the bottom with Home active; no horizontal scroll |
| ☰ at 375 | panel lists Plans, How it Works, About Us, Partner with us, "Browse eSIM plans" |
| `/esim/usa` at 375 | Destinations center circle highlighted |
| `/account` (signed in) at 768 | dock shown, My eSIMs active |
| `/checkout?package=…` and `/signin` at 375 | **no dock**; footer has normal padding |
| footer at 375 | 2-column links; legal row fully visible above the dock when scrolled to the bottom |
| any page at 1024 / 1440 | floating capsule nav with all 6 links + Partner + Profile + "Get eSIM Now"; no dock |
| `/xloginy` | unchanged admin nav, no dock |
| Shared `/pkg/<id>` on a phone UA | open-in-app banner sits above the dock |

- [ ] **Step 4: Lighthouse sanity (mobile)**

On a prod build (`pnpm build && pnpm start`), run Lighthouse mobile on `/`. Expected: CLS 0 (f192). LCP isn't expected to change in this phase.

---

### Task 8: Knowledge + session log (repo rules)

**Files:**
- Modify: `feedAI/facts.jsonl` (append)
- Modify: `feedAI/topics/ui-components-styling.json`
- Create: `docs/sessions/2026-10-01_web-ui-polish-shell.md`
- Modify: `docs/sessions/INDEX.md`
- Modify: `feedAI/brain.json` (`sync` block)

- [ ] **Step 1: Append facts**

Find the next free id (`tail -1 feedAI/facts.jsonl`) and append one line per invariant, for example:

```json
{"id": "f2NN", "date": "2026-10-01", "kind": "decision", "topic": "ui-components-styling", "fact": "Public nav shell mirrors the app: lg+ shows a floating frosted capsule Navbar (single style, the old theme=dark prop is gone); below lg a capsule top bar (logo + ☰ with only non-dock links) plus BottomDock, a fixed 80%-wide tab capsule (Home, My eSIMs, center gradient Destinations, Support, Profile) rendered by Navbar, so admin pages never get it. Visibility/active-tab rules live in components/dockNav.ts (hidden on /checkout, /signin, /profile/deleted). BottomDock must stay a sibling of <header>, never inside the backdrop-blur capsule, because backdrop-filter makes a containing block for position:fixed children. Footer bottom clearance keys off [data-bottom-dock] via a :has() rule in globals.css.", "source": "src/app/components/Navbar.tsx; BottomDock.tsx; dockNav.ts; globals.css; docs/superpowers/specs/2026-10-01-web-ui-mobile-polish-design.md"}
```

- [ ] **Step 2: Topic + session + index + brain sync**

- In `feedAI/topics/ui-components-styling.json`, add the new fact id to `facts`, and add `notable_components` entries for `BottomDock.tsx + dockNav.ts`. Update the `Navbar.tsx` entry to say capsule, no theme prop.
- Write `docs/sessions/2026-10-01_web-ui-polish-shell.md` covering what changed, the verification results (test counts, build route table, the manual matrix above) and anything deferred.
- Append a row to `docs/sessions/INDEX.md`.
- In `feedAI/brain.json`, set `sync.date` to `2026-10-01`, update `sync.note_latest`, and update `phase.current` to say the layout-parity redesign (spec 2026-10-01) is in progress with phase 1 (shell) done.

- [ ] **Step 3: Commit (ask first)**

```bash
git add feedAI docs/sessions
git commit -m "docs: feedAI + session log for web UI polish phase 1 (shell)"
```

---

## Next plans (not in this document)

Each is written after the previous phase ships, against the same spec:

2. Homepage hero C + tune → wizard opener
3. Browse B: `PhotoTile` + lazy `/bff/country-image`
4. Country plans A: `PlanRow` + `planRowTags()`, sidebar, collapsed country bar
5. Checkout B + sign-in
6. Account: desktop sidebar dashboard / phone app layout + order detail
7. Homepage bento blocks
8. Content pages restyle + legal token fix
9. Partner pages on the account shell
