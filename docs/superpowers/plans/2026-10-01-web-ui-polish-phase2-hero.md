# Web UI Polish, Phase 2: Homepage Hero (Light Split) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Repo rule (overrides any skill):** implementers **never** run `git commit`. Each "Commit (controller)" step is done by the controller, who stages the files, shows the message, and asks the user before every commit. Stay on the current branch, with no new branches, worktrees or stashes.

**Goal:** Replace the dark full-bleed homepage hero with the spec's option C, a light split. Desktop shows copy on the left (eyebrow pill, an H1 with a gradient second line, sub-copy, search, a new tune button and the chips) and `mountain.webp` in a rounded photo card on the right, with a white trust overlay. On phones and tablets the photo card goes on top at a fixed aspect ratio. The tune button opens the existing Help Me Choose wizard. Copy, links and data stay unchanged.

**Architecture:** The wizard and its open state stay inside `DestinationBrowse`, so there is only ever one instance. A tiny pure module, `planWizardOpener.ts`, wraps a namespaced `window` event: the new client island `HeroTuneButton` dispatches it, and `DestinationBrowse` subscribes in an effect. It holds the request until its package fetch settles, which closes the same race that `disabled={loading}` closes on its own button. `Hero` stays a server-rendered section, so `/` stays static.

**Tech Stack:** Next.js 15 App Router, React 19, Tailwind 3.4, lucide-react 0.475 (`SlidersHorizontal` exists in `node_modules/lucide-react/dist/esm/icons/sliders-horizontal.js`), vitest (node env, source-string and pure-logic tests, no RTL/jsdom). Node's global `EventTarget`/`Event` let the opener be tested without a DOM.

**Spec:** `docs/superpowers/specs/2026-10-01-web-ui-mobile-polish-design.md`. See "Constraints carried over", "Breakpoints" and "### 2. Homepage hero (option C: light split)". The local mockup is `.superpowers/brainstorm/20458-1790844487/hero.html`, card C.

**Scope:** spec build-order step 3 only. Benefits, How it works and the other homepage blocks are phase 8 (bento), and `HeroPackageSearch` behavior is untouched.

**Baseline (2026-10-01, after phase 1 `65d6550`):** `pnpm test` → **68 files, 561 tests passing**.

## Opener decision: `window` CustomEvent, not a React context

`Hero` is a server component, and `page.tsx` renders `<DestinationBrowse urlFilters={{}} />` as a sibling. A context would need a new client provider around both, plus the wizard state lifted out of `DestinationBrowse`. That second change would also touch `/destinations/page.tsx`, which renders the same component. An event needs neither. `DestinationBrowse` keeps owning the state and the single `<HelpMeChooseWizard>`, and the event name lives in one pure module with unit tests.

The event is deliberately not queued. A request with no listener is a no-op, so a `DestinationBrowse` that mounts later, for example after client-side navigation to `/destinations`, can never pop the wizard open by surprise.

## Design numbers (verified, don't re-derive)

- **Navbar clearance:** the capsule is `pt-3` + `h-14`, so it's 68px below lg and `lg:h-16` → 76px at lg+ (`Navbar.tsx:50-53`). The hero uses `pt-[80px]` (phone), `md:pt-[88px]` and `lg:pt-[112px]`.
- **Photo:** `public/images/mountain.webp` is **1916×821** (≈ 21:9). The peaks sit at about 60–70% of the width.
  - Below lg the card is `aspect-[21/9]`, the same ratio as the file, so the cover-scaled bitmap width equals the card width: `calc(100vw - 40px)` with the `px-5` gutter, and `calc(100vw - 64px)` at md+ with `md:px-8`.
  - At lg+ the card sits in a fixed 460px column and is `lg:h-[520px]` tall. `object-cover` scales the photo to 520 × 1916/821 ≈ **1214px** wide, which is the real rendered bitmap width. `lg:object-[62%_center]` keeps the peaks in frame.
  - That gives `sizes="(min-width: 1024px) 1214px, (min-width: 768px) calc(100vw - 64px), calc(100vw - 40px)"`.
- **Search pill height:** `HeroPackageSearch`'s card is a 1px border + `p-2` + `min-h-[60px]` label, so **78px**. The tune tile matches it with `h-[78px]` and `rounded-[20px]`.
- **Chips:** they are bumped to `h-11` (44px tap target, from the spec's acceptance rule), and the placeholders are bumped to `h-11` with them so CLS stays 0.
- **Gradient:** `from-brandBlue via-[#0E86C0] to-brandTeal`, the documented mobile `buttonGradient` (`docs/design/mobile-design-system.md`, `buttonClasses.ts`). This is already used for gradient text in `DestinationPlans.tsx:685`.
- **`HeroPackageSearch` needs no changes.** It's already light-styled (`bg-surface`, `border-outline`, `shadow-brandCard`, an `bg-outline/10` label, and a light dropdown). Its results dropdown is **in normal flow** (`relative z-[70] mt-3`), not absolute, so it pushes the chips down and can't be clipped. The new hero drops `overflow-hidden` anyway, and the grid uses `lg:items-start` so opening the dropdown doesn't re-center (and jump) the left column. The hero keeps `relative isolate z-20`, so the search's `z-[100]` stays contained.
- **Motion:** none is added, so there's nothing to do in Lottie.

---

## File map

| File | Action | Responsibility |
|---|---|---|
| `src/app/destinations/planWizardOpener.ts` | create | event name, `requestPlanWizard()`, `onPlanWizardRequest()` (pure) |
| `src/app/destinations/planWizardOpener.test.ts` | create | unit tests for the above |
| `src/app/destinations/DestinationBrowse.tsx` | modify | subscribe to the opener; open the single wizard once loading settles |
| `src/app/destinations/destinationBrowse-wiring.test.ts` | modify | guard the subscription and the single-instance rule |
| `src/app/HeroTuneButton.tsx` | create | client tune tile (`SlidersHorizontal`) that calls `requestPlanWizard()` |
| `src/app/HeroDestinationChips.tsx` | modify | light-hero chip, placeholder and retry styling; 44px chips, left-aligned |
| `src/app/page.tsx` (`function Hero`, imports) | modify | light split layout, photo card, trust overlay, tune button |
| `src/app/hero-package-search.test.ts` | modify | new hero section class, hero-contract and tune-button tests |
| `src/app/core-web-vitals.test.ts` | modify | new `sizes`, chip placeholder/chip height parity |
| `feedAI/facts.jsonl`, `feedAI/topics/ui-components-styling.json`, `feedAI/brain.json`, `docs/sessions/*` | modify/create | knowledge + session log (Task 7) |

---

### Task 1: Wizard opener module (TDD)

**Files:**
- Create: `src/app/destinations/planWizardOpener.ts`
- Test: `src/app/destinations/planWizardOpener.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/app/destinations/planWizardOpener.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";
import {
  OPEN_PLAN_WIZARD_EVENT,
  onPlanWizardRequest,
  requestPlanWizard,
} from "./planWizardOpener";

describe("planWizardOpener", () => {
  it("uses one namespaced event name", () => {
    expect(OPEN_PLAN_WIZARD_EVENT).toBe("esim2you:open-plan-wizard");
  });

  it("delivers a request to a subscribed listener", () => {
    const target = new EventTarget();
    const handler = vi.fn();

    onPlanWizardRequest(handler, target);
    requestPlanWizard(target);

    expect(handler).toHaveBeenCalledTimes(1);
    // The handler gets no DOM event, so callers can't come to depend on one.
    expect(handler).toHaveBeenCalledWith();
  });

  it("stops delivering after the returned cleanup runs (effect unmount)", () => {
    const target = new EventTarget();
    const handler = vi.fn();

    const unsubscribe = onPlanWizardRequest(handler, target);
    unsubscribe();
    requestPlanWizard(target);

    expect(handler).not.toHaveBeenCalled();
  });

  it("is a no-op with no listener and never queues for a later subscriber", () => {
    const target = new EventTarget();

    expect(() => requestPlanWizard(target)).not.toThrow();

    const handler = vi.fn();
    onPlanWizardRequest(handler, target);

    expect(handler).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `pnpm exec vitest run src/app/destinations/planWizardOpener.test.ts`
Expected: FAIL. The import of `./planWizardOpener` can't be resolved.

- [ ] **Step 3: Implement**

Create `src/app/destinations/planWizardOpener.ts`:

```ts
/**
 * Lets any client island ask the page's single Help Me Choose wizard to open.
 *
 * DestinationBrowse owns the wizard (state + the one <HelpMeChooseWizard>)
 * and subscribes; the homepage hero's tune button dispatches. A window event
 * rather than a React context because the hero is a server-rendered section
 * and DestinationBrowse is rendered separately in page.tsx: there is no
 * shared client parent for a provider, and lifting the wizard state out of
 * DestinationBrowse would also touch /destinations.
 *
 * Requests are never queued: with no listener mounted, a request is a no-op,
 * so a DestinationBrowse that mounts later can't pop the wizard by surprise.
 */
export const OPEN_PLAN_WIZARD_EVENT = "esim2you:open-plan-wizard";

/** Call from an event handler only (never during render: `window` is client-only). */
export function requestPlanWizard(target: EventTarget = window): void {
  target.dispatchEvent(new Event(OPEN_PLAN_WIZARD_EVENT));
}

/** Subscribe from an effect; the returned function is the effect cleanup. */
export function onPlanWizardRequest(
  handler: () => void,
  target: EventTarget = window,
): () => void {
  const listener = () => handler();
  target.addEventListener(OPEN_PLAN_WIZARD_EVENT, listener);
  return () => target.removeEventListener(OPEN_PLAN_WIZARD_EVENT, listener);
}
```

- [ ] **Step 4: Run it and watch it pass**

Run: `pnpm exec vitest run src/app/destinations/planWizardOpener.test.ts`
Expected: PASS, 4 tests.

- [ ] **Step 5: Full suite + types**

Run: `pnpm test && pnpm exec tsc --noEmit`
Expected: **69 files, 565 tests** passing; tsc prints nothing.

- [ ] **Step 6: Commit (controller)**

```bash
git add src/app/destinations/planWizardOpener.ts src/app/destinations/planWizardOpener.test.ts
git commit -m "feat(hero): add planWizardOpener event helper for the Help Me Choose wizard"
```

---

### Task 2: DestinationBrowse opens its wizard on an outside request

**Files:**
- Modify: `src/app/destinations/DestinationBrowse.tsx`
- Test: `src/app/destinations/destinationBrowse-wiring.test.ts`

- [ ] **Step 1: Write the failing test**

In `src/app/destinations/destinationBrowse-wiring.test.ts`, inside the first `describe(...)` block, add this after the `"the homepage keeps the wizard closed until the visitor asks for help"` test:

```ts
  it("opens its single wizard on an outside request (hero tune button), only once data has loaded", () => {
    const source = readFileSync(
      join(process.cwd(), "src/app/destinations/DestinationBrowse.tsx"),
      "utf8",
    );

    expect(source).toContain('import { onPlanWizardRequest } from "./planWizardOpener";');
    expect(source).toContain("useEffect(() => onPlanWizardRequest(() => setWizardRequested(true)), []);");
    // Held until the fetch settles, like the button's disabled={loading}.
    expect(source).toContain("if (!wizardRequested || loading) return;");
    // There is exactly one wizard per page; outside callers never mount another.
    expect(source.match(/<HelpMeChooseWizard\b/g)).toHaveLength(1);
  });
```

- [ ] **Step 2: Run it and watch it fail**

Run: `pnpm exec vitest run src/app/destinations/destinationBrowse-wiring.test.ts`
Expected: FAIL on the new test (missing the `onPlanWizardRequest` import). The other 9 still pass.

- [ ] **Step 3: Add the import**

In `src/app/destinations/DestinationBrowse.tsx`, change:

```tsx
import type { WizardResult } from "./HelpMeChooseWizard";
import { WizardWelcomeIntro } from "./WizardWelcomeIntro";
```

to:

```tsx
import type { WizardResult } from "./HelpMeChooseWizard";
import { onPlanWizardRequest } from "./planWizardOpener";
import { WizardWelcomeIntro } from "./WizardWelcomeIntro";
```

- [ ] **Step 4: Add the request state**

Change:

```tsx
  const [wizardOpen, setWizardOpen] = useState(false);
  /**
   * Shown instead of the wizard
```

to:

```tsx
  const [wizardOpen, setWizardOpen] = useState(false);
  /**
   * Set by an outside "open the wizard" request (the homepage hero's tune
   * button, via planWizardOpener). Held until the fetch settles, for the same
   * reason the Help me choose button is disabled while loading.
   */
  const [wizardRequested, setWizardRequested] = useState(false);
  /**
   * Shown instead of the wizard
```

- [ ] **Step 5: Subscribe and hand off**

Directly after the existing welcome hand-off effect, which ends:

```tsx
    setShowWelcome(false);
    if (!loadError) setWizardOpen(true);
  }, [showWelcome, welcomeMinDelayDone, loading, loadError]);
```

insert:

```tsx

  useEffect(() => onPlanWizardRequest(() => setWizardRequested(true)), []);

  // Same rule as the manual button (enabled once loading is false), so an
  // early click on the hero tune button opens the wizard as soon as the
  // destinations have arrived instead of showing "No destination found".
  useEffect(() => {
    if (!wizardRequested || loading) return;
    setWizardRequested(false);
    setWizardOpen(true);
  }, [wizardRequested, loading]);
```

Leave everything else unchanged. The consent-banner effect already keys off `wizardOpen` (f118), and the single `<HelpMeChooseWizard … />` render at the bottom stays as it is.

- [ ] **Step 6: Run the test and watch it pass**

Run: `pnpm exec vitest run src/app/destinations/destinationBrowse-wiring.test.ts`
Expected: PASS, 10 tests.

- [ ] **Step 7: Full suite + types**

Run: `pnpm test && pnpm exec tsc --noEmit`
Expected: **69 files, 566 tests**; tsc clean.

- [ ] **Step 8: Commit (controller)**

```bash
git add src/app/destinations/DestinationBrowse.tsx src/app/destinations/destinationBrowse-wiring.test.ts
git commit -m "feat(hero): let DestinationBrowse open its wizard on an outside request"
```

---

### Task 3: Hero tune button

**Files:**
- Create: `src/app/HeroTuneButton.tsx`
- Test: `src/app/hero-package-search.test.ts`

- [ ] **Step 1: Write the failing test**

At the end of `src/app/hero-package-search.test.ts`, after the closing `});` of `describe("HeroPackageSearch", ...)`, append:

```ts

describe("HeroTuneButton", () => {
  it("asks DestinationBrowse's wizard to open instead of mounting its own", () => {
    const source = readFileSync(join(process.cwd(), "src/app/HeroTuneButton.tsx"), "utf8");

    expect(source).toContain('"use client"');
    expect(source).toContain("SlidersHorizontal");
    expect(source).toContain('aria-label="Help me choose a plan"');
    expect(source).toContain('import { requestPlanWizard } from "./destinations/planWizardOpener";');
    // Wrapped in an arrow, so the click event is never passed in as the dispatch target.
    expect(source).toContain("onClick={() => requestPlanWizard()}");
    expect(source).not.toContain("HelpMeChooseWizard");
    // Matches the 78px search pill next to it.
    expect(source).toContain("h-[78px]");
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `pnpm exec vitest run src/app/hero-package-search.test.ts`
Expected: FAIL with `ENOENT … src/app/HeroTuneButton.tsx`.

- [ ] **Step 3: Implement**

Create `src/app/HeroTuneButton.tsx`:

```tsx
"use client";

import { SlidersHorizontal } from "lucide-react";
import { requestPlanWizard } from "./destinations/planWizardOpener";

/**
 * The app's filter tile next to search. Opens the Help Me Choose wizard that
 * DestinationBrowse owns (one instance per page) through planWizardOpener.
 * It never renders a wizard itself.
 */
export function HeroTuneButton() {
  return (
    <button
      aria-label="Help me choose a plan"
      className="grid h-[78px] w-[60px] shrink-0 place-items-center rounded-[20px] border border-outline bg-surface text-brandBlue shadow-brandCard transition hover:border-brandBlue/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brandBlue sm:w-[78px]"
      onClick={() => requestPlanWizard()}
      title="Help me choose a plan"
      type="button"
    >
      <SlidersHorizontal aria-hidden="true" size={22} />
    </button>
  );
}
```

(It's 60px wide below `sm`, so search keeps most of the width at 320px: 280px content → 210px search + 10px gap + 60px tile.)

- [ ] **Step 4: Run it and watch it pass**

Run: `pnpm exec vitest run src/app/hero-package-search.test.ts`
Expected: PASS, 4 tests.

- [ ] **Step 5: Full suite + types**

Run: `pnpm test && pnpm exec tsc --noEmit`
Expected: **69 files, 567 tests**; tsc clean. The component isn't rendered anywhere yet, which is fine.

- [ ] **Step 6: Commit (controller)**

```bash
git add src/app/HeroTuneButton.tsx src/app/hero-package-search.test.ts
git commit -m "feat(hero): add tune button that requests the Help Me Choose wizard"
```

---

### Task 4: Light-hero chips (44px, placeholders kept)

Done before the hero swap, so there's never a commit where white-on-white chips sit on the new light hero. White chips over the old dark photo stay readable for that one commit.

**Files:**
- Modify: `src/app/HeroDestinationChips.tsx`
- Test: `src/app/core-web-vitals.test.ts`

- [ ] **Step 1: Write the failing test**

In `src/app/core-web-vitals.test.ts`, directly after the `"reserves hero chip space while popular destinations load (CLS)"` test, add:

```ts
  it("keeps chip placeholders the same height as the real chips, styled for the light hero", async () => {
    const source = await readFile(join(process.cwd(), "src/app/HeroDestinationChips.tsx"), "utf8");

    // Placeholder and chip are both h-11 (44px tap target), so swapping one for the other never shifts layout.
    expect(source).toContain('className="h-11 rounded-full border border-outline/60 bg-surfaceBright"');
    expect(source).toMatch(/<Link\s+className="[^"]*\bh-11\b/);
    // The hero is white now: no white-on-white chips.
    expect(source).not.toContain("text-white");
    expect(source).not.toContain("border-white");
  });
```

- [ ] **Step 2: Run it and watch it fail**

Run: `pnpm exec vitest run src/app/core-web-vitals.test.ts`
Expected: FAIL on the new test only.

- [ ] **Step 3: Restyle the retry button**

In `src/app/HeroDestinationChips.tsx`, change:

```tsx
        className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3.5 py-2 text-xs font-bold text-white/85 backdrop-blur-md transition hover:border-white/50 hover:bg-white/20"
```

to:

```tsx
        className="mt-6 inline-flex h-11 items-center gap-2 rounded-full border border-outline bg-surface px-4 text-xs font-bold text-onSurfaceVariant transition hover:border-brandBlue/40 hover:text-brandBlue"
```

- [ ] **Step 4: Restyle the placeholder**

Change:

```tsx
    // Reserve the chips' space while they load: the hero centers its content
    // vertically, so appearing chips used to push the search box up (CLS).
    return (
      <div aria-hidden="true" className="mt-6 flex flex-wrap justify-center gap-2.5 lg:justify-start">
        {CHIP_PLACEHOLDER_WIDTHS.map((width, index) => (
          <span
            className="h-[38px] rounded-full border border-white/15 bg-white/5"
```

to:

```tsx
    // Reserve the chips' space while they load, so chips arriving after the
    // client fetch never shift the hero (f192: CLS 0.139 -> 0). The height
    // must match the real chip (h-11).
    return (
      <div aria-hidden="true" className="mt-6 flex flex-wrap gap-2.5">
        {CHIP_PLACEHOLDER_WIDTHS.map((width, index) => (
          <span
            className="h-11 rounded-full border border-outline/60 bg-surfaceBright"
```

- [ ] **Step 5: Restyle the chips**

Change:

```tsx
    <div className="mt-6 flex flex-wrap justify-center gap-2.5 lg:justify-start">
      {popular.map((pkg) => (
        <Link
          className="group flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3.5 py-2 text-xs font-bold text-white backdrop-blur-md transition hover:border-white/50 hover:bg-white/20"
          href={destinationBrowseHref(pkg.countryCode)}
          key={pkg.countryCode}
        >
          {pkg.flagUri ? (
            <img
              alt=""
              className="h-5 w-5 shrink-0 rounded-full border border-white/30 object-cover"
              src={pkg.flagUri}
            />
          ) : (
            <Globe2 aria-hidden="true" size={14} />
          )}
```

to:

```tsx
    <div className="mt-6 flex flex-wrap gap-2.5">
      {popular.map((pkg) => (
        <Link
          className="group flex h-11 items-center gap-2 rounded-full border border-outline bg-surface px-3.5 text-xs font-bold text-onSurface transition hover:border-brandBlue/40 hover:text-brandBlue"
          href={destinationBrowseHref(pkg.countryCode)}
          key={pkg.countryCode}
        >
          {pkg.flagUri ? (
            <img
              alt=""
              className="h-5 w-5 shrink-0 rounded-full border border-outline object-cover"
              src={pkg.flagUri}
            />
          ) : (
            <Globe2 aria-hidden="true" className="text-brandBlue" size={14} />
          )}
```

Chips are now left-aligned at every width, since the copy column is left-aligned on phones too (mockup C). `px-3.5` is kept so `CHIP_PLACEHOLDER_WIDTHS` still matches the real chip widths. The flag `alt=""` stays: it's decorative next to the country name, and the `alt=""` guard in `seo-external-factors.test.ts` only reads `page.tsx`, Navbar, SiteFooter and LegalDocumentPage.

- [ ] **Step 6: Run the test and watch it pass**

Run: `pnpm exec vitest run src/app/core-web-vitals.test.ts src/app/destinations/destinationBrowse-wiring.test.ts`
Expected: PASS. The chips' retry test still finds `loadError`, `try again` and `handleRetry`.

- [ ] **Step 7: Full suite + types**

Run: `pnpm test && pnpm exec tsc --noEmit`
Expected: **69 files, 568 tests**; tsc clean.

- [ ] **Step 8: Commit (controller)**

```bash
git add src/app/HeroDestinationChips.tsx src/app/core-web-vitals.test.ts
git commit -m "feat(hero): restyle popular-destination chips for the light hero"
```

---

### Task 5: Light split hero

**Files:**
- Modify: `src/app/page.tsx` (imports and `function Hero`, currently lines 95–138)
- Test: `src/app/hero-package-search.test.ts`, `src/app/core-web-vitals.test.ts`

- [ ] **Step 1: Update the pinned assertions and add the hero contract (failing)**

In `src/app/core-web-vitals.test.ts`, inside `"serves the homepage hero through next/image with a lightweight WebP source"`, replace:

```ts
    expect(pageSource).toContain('sizes="100vw"');
```

with:

```ts
    // The photo is a card now, not full-bleed. sizes is the cover-scaled bitmap
    // width: below lg the card is aspect-[21/9] (= the 1916x821 file), so the
    // bitmap equals the card width; at lg+ the card is 520px tall, so 520 * 1916/821 ≈ 1214px.
    expect(pageSource).toContain(
      'sizes="(min-width: 1024px) 1214px, (min-width: 768px) calc(100vw - 64px), calc(100vw - 40px)"',
    );
    expect(pageSource).not.toContain('sizes="100vw"');
    expect(pageSource).toContain("aspect-[21/9]");
    expect(pageSource).toContain("lg:h-[520px]");
```

In `src/app/hero-package-search.test.ts`, replace the body of `"keeps the search results dropdown layered above the hero's background photo"` with the following (rename the test as shown):

```ts
  it("keeps the search results dropdown stacked inside the hero section", () => {
    const pageSource = readFileSync(join(process.cwd(), "src/app/page.tsx"), "utf8");
    const componentSource = readFileSync(join(process.cwd(), "src/app/HeroPackageSearch.tsx"), "utf8");

    // The light hero keeps its own stacking context (isolate z-20), so the search
    // pill and its in-flow results dropdown (z-[100]/z-[70]) stay above the photo
    // card and never escape over the navbar or the sections below.
    expect(pageSource).toContain('className="relative isolate z-20 bg-surface text-onSurface"');
    expect(pageSource).toContain('src="/images/mountain.webp"');
    expect(componentSource).toContain('className="relative z-[100] w-full max-w-[620px]"');
  });
```

Then, inside `describe("HeroPackageSearch", ...)`, after `"no longer renders the deleted static hero graphic or non-live plan cards"`, add:

```ts
  it("renders the light split hero with every trust signal and the tune button", () => {
    const pageSource = readFileSync(join(process.cwd(), "src/app/page.tsx"), "utf8");
    const hero = pageSource.slice(
      pageSource.indexOf("function Hero()"),
      pageSource.indexOf("function Benefits()"),
    );

    expect(hero).not.toContain("bg-brandInk text-white");
    // Eyebrow pill + H1 with the gradient on its second line.
    expect(hero).toContain("200+ destinations");
    expect(hero).toContain("A better way to stay");
    expect(hero).toContain("from-brandBlue via-[#0E86C0] to-brandTeal bg-clip-text text-transparent");
    expect(hero).toContain("connected while you travel");
    // Photo card (on top below lg) carrying the remaining trust signals.
    expect(hero).toContain("rounded-[24px]");
    expect(hero).toContain("order-first");
    expect(hero).toContain("Live plan prices");
    expect(hero).toContain("Install in minutes · 24/7 support");
    // Search + tune + chips.
    expect(hero).toContain("<HeroPackageSearch />");
    expect(hero).toContain("<HeroTuneButton />");
    expect(hero).toContain("<HeroDestinationChips />");
    expect(pageSource).toContain('import { HeroTuneButton } from "./HeroTuneButton";');
    // The wizard is only ever DestinationBrowse's.
    expect(pageSource).not.toContain("HelpMeChooseWizard");
  });
```

- [ ] **Step 2: Run them and watch them fail**

Run: `pnpm exec vitest run src/app/core-web-vitals.test.ts src/app/hero-package-search.test.ts`
Expected: FAIL in 3 tests: the `sizes` assertion, the section className, and the new hero contract.

- [ ] **Step 3: Import the tune button**

In `src/app/page.tsx`, change:

```tsx
import { HeroPackageSearch } from "./HeroPackageSearch";
```

to:

```tsx
import { HeroPackageSearch } from "./HeroPackageSearch";
import { HeroTuneButton } from "./HeroTuneButton";
```

- [ ] **Step 4: Replace `function Hero`**

Replace the whole `function Hero() { … }` (from `function Hero() {` through its closing `}`, just before `function Benefits() {`) with:

```tsx
function Hero() {
  return (
    <section className="relative isolate z-20 bg-surface text-onSurface" id="home">
      {/* Top padding clears the absolute capsule navbar: 68px below lg, 76px at lg+. */}
      <div className="mx-auto grid max-w-[1180px] gap-6 px-5 pb-10 pt-[80px] md:px-8 md:pt-[88px] lg:grid-cols-[minmax(0,1fr)_460px] lg:items-start lg:gap-12 lg:pb-16 lg:pt-[112px]">
        {/* items-start: the search dropdown is in normal flow, so a centered
            column would jump when it opens. */}
        <div className="min-w-0 lg:pt-6">
          <span className="inline-flex items-center gap-2 rounded-full bg-brandBlue/[0.08] px-3 py-1.5 text-xs font-bold text-brandBlue">
            <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-brandTeal" />
            200+ destinations
          </span>

          <h1 className="mt-4 font-display text-[32px] font-black leading-[1.08] tracking-[-0.04em] text-brandInk sm:text-[44px] lg:text-[48px] xl:text-[56px]">
            A better way to stay
            <br />
            <span className="bg-gradient-to-r from-brandBlue via-[#0E86C0] to-brandTeal bg-clip-text text-transparent">
              connected while you travel
            </span>
          </h1>

          <p className="mt-4 max-w-[540px] text-[15px] leading-7 text-onSurfaceVariant sm:text-base">
            Premium eSIMs with high-speed data in 200+ countries and regions.
            Instant activation. No SIM card. No roaming fees.
          </p>

          <div className="mt-6 flex w-full max-w-[620px] items-start gap-2.5 lg:mt-8">
            <div className="min-w-0 flex-1">
              <HeroPackageSearch />
            </div>

            <HeroTuneButton />
          </div>

          <HeroDestinationChips />
        </div>

        {/* Fixed box at every width (aspect ratio below lg, fixed height at lg+),
            so the LCP image never shifts layout. bg-brandInk shows while it decodes. */}
        <div className="relative order-first aspect-[21/9] overflow-hidden rounded-[24px] bg-brandInk shadow-brandCard lg:order-none lg:aspect-auto lg:h-[520px]">
          <Image
            alt="Mountain traveler destination at dusk"
            className="object-cover lg:object-[62%_center]"
            fill
            priority
            fetchPriority="high"
            sizes="(min-width: 1024px) 1214px, (min-width: 768px) calc(100vw - 64px), calc(100vw - 40px)"
            src="/images/mountain.webp"
          />

          <div className="absolute bottom-3 left-3 max-w-[calc(100%-24px)] rounded-2xl bg-surface/95 px-4 py-3 shadow-brandCard backdrop-blur-sm lg:bottom-5 lg:left-5">
            <p className="font-display text-sm font-black text-brandInk">Live plan prices</p>
            <p className="mt-0.5 text-xs font-semibold text-onSurfaceVariant">
              Install in minutes · 24/7 support
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
```

Notes for the implementer (don't change these):
- The image `alt` is unchanged, and no `alt=""` is added to `page.tsx` (`seo-external-factors.test.ts` guards that).
- The sub-copy text is byte-for-byte the old text.
- All four trust signals are present: "200+ destinations" in the eyebrow, and the other three in the overlay.
- `overflow-hidden` is gone from the section on purpose. Nothing bleeds out any more, and it would clip the search pill's shadow. `<main>` already has `overflow-x-hidden`.
- No new hex: `#0E86C0` is the documented gradient stop. Everything else is a token or an opacity modifier on one.

- [ ] **Step 5: Run the tests and watch them pass**

Run: `pnpm exec vitest run src/app/core-web-vitals.test.ts src/app/hero-package-search.test.ts src/app/how-it-works.test.ts src/app/seo-external-factors.test.ts src/content/landing.test.ts src/app/destinations/destinationBrowse-wiring.test.ts src/app/public-shell.test.ts`
Expected: all PASS.

- [ ] **Step 6: Full suite + types**

Run: `pnpm test && pnpm exec tsc --noEmit`
Expected: **69 files, 569 tests**; tsc clean.

- [ ] **Step 7: Commit (controller)**

```bash
git add src/app/page.tsx src/app/core-web-vitals.test.ts src/app/hero-package-search.test.ts
git commit -m "feat(hero): light split homepage hero with photo card and tune button"
```

---

### Task 6: Full verification

- [ ] **Step 1: Full test suite + types**

Run: `pnpm test && pnpm exec tsc --noEmit`
Expected: **69 files, 569 tests** passing (baseline 68 / 561: +4 opener, +1 wiring, +1 tune, +1 chips, +1 hero contract); tsc clean.

- [ ] **Step 2: Production build**

Run: `pnpm build`
Expected: the build succeeds and `/` is still listed as **○ (Static)** in the route table. If it flipped to ƒ, something in the hero read request data. Fix that before going on. `/destinations` stays ƒ, as before.

- [ ] **Step 3: Manual browser matrix**

Run `pnpm build && pnpm start` (or `pnpm dev` for layout-only checks), open `/`, and check at **320, 375, 768, 1024 and 1440px**:

| Width | Check | Expected |
|---|---|---|
| all | horizontal scroll | none (`document.documentElement.scrollWidth === innerWidth`) |
| all | top of hero | the capsule nav doesn't overlap the photo card (phone/tablet) or the eyebrow (lg+); a gap of at least 12px |
| 320 | search row | search pill + 60px tune tile on one row; the placeholder may truncate, but the input is usable; nothing overflows |
| 320 / 375 | photo card | on top, 21:9, rounded 24px; the overlay card fits inside it and reads "Live plan prices" / "Install in minutes · 24/7 support" |
| 375 | order | photo → eyebrow → H1 (2nd line gradient) → sub-copy → search + tune → chips |
| 375 | chips | left-aligned, 44px tall; placeholders (soft grey pills) are replaced without a jump (watch with network throttled to Slow 4G) |
| 375 | dock | chips and the bottom of the hero aren't hidden behind the dock when scrolled |
| 768 | photo card | full content width, 21:9; copy below |
| 1024 | layout | two columns: copy left, 460px photo card right, 520px tall; peaks visible (object position 62%) |
| 1440 | layout | same; H1 at 56px fits in 2 lines; the content max width is 1180px |
| all | search | focus opens the results dropdown below the pill, above the chips, and isn't clipped; at lg the photo card doesn't move; picking a country routes to `/destinations?country=…`; clicking outside or pressing Escape closes it |
| all | tune button | opens the Help Me Choose wizard (one dialog); Escape / close / backdrop close it; finishing routes like the "Help me choose" button in the browse section |
| all | tune before data | click tune immediately on a cold, throttled load: the wizard opens once destinations finish loading, not with an empty list |
| all | single instance | DevTools: after opening from tune, `document.querySelectorAll('[role="dialog"][aria-modal="true"]').length === 1` |
| 1440 | wizard | the browse section's own "Help me choose" button still works |
| first visit | consent | the consent banner stays deferred while the wizard is open (f118) |

- [ ] **Step 4: Lighthouse (mobile) on `/`**

On the prod build (`pnpm start`), run Lighthouse mobile on `/` 3 times and take the median. Expected: **CLS 0.000** and **LCP ≤ 3.54s** (f192). Also confirm in the Network panel that the hero image is preloaded with `fetchpriority=high`. On Lighthouse's emulated phone (412px, DPR 1.75) it should still be the `w=750` variant: (412 − 40) × 1.75 ≈ 651 → 750, the same variant `100vw` picked. So this phase isn't expected to change image bytes on phones. The photo is just smaller on screen, and the H1 may become the LCP element instead. If LCP regresses, check which element is the LCP (the photo card vs the H1) before changing anything, and record it in the session doc.

---

### Task 7: Knowledge + session log (repo rules)

**Files:**
- Modify: `feedAI/facts.jsonl` (append)
- Modify: `feedAI/topics/ui-components-styling.json`
- Create: `docs/sessions/2026-10-01_web-ui-polish-hero.md`
- Modify: `docs/sessions/INDEX.md`
- Modify: `feedAI/brain.json` (`sync` block, `phase.current`)

- [ ] **Step 1: Append facts**

Check the next free id with `tail -1 feedAI/facts.jsonl | cut -c1-20`. It was `f208` when this plan was written, so use `f209` and `f210` unless something landed in between. Append (replace the measured numbers with the real Task 6 results):

```json
{"id": "f209", "date": "2026-10-01", "kind": "decision", "topic": "ui-components-styling", "fact": "Homepage hero is the spec's option C light split (phase 2 of docs/superpowers/specs/2026-10-01-web-ui-mobile-polish-design.md): white section (relative isolate z-20 bg-surface, no overflow-hidden), left column = eyebrow '200+ destinations', H1 with the 2nd line in from-brandBlue via-[#0E86C0] to-brandTeal bg-clip-text, unchanged sub-copy, HeroPackageSearch + HeroTuneButton, HeroDestinationChips (now light, h-11, placeholders h-11 so CLS stays 0); right column (order-first below lg) = mountain.webp in a rounded-[24px] card, aspect-[21/9] below lg (= the 1916x821 file) and lg:h-[520px] in a 460px column, with a white overlay carrying 'Live plan prices' / 'Install in minutes · 24/7 support'. Image keeps priority + fetchPriority=high; sizes is the cover-scaled bitmap width '(min-width: 1024px) 1214px, (min-width: 768px) calc(100vw - 64px), calc(100vw - 40px)', so if the card's aspect/height changes, recompute sizes. Grid is lg:items-start because the search dropdown is in normal flow. Lighthouse mobile /: CLS <X>, LCP <Y>s (f192 baseline 3.54s).", "source": "src/app/page.tsx; src/app/HeroDestinationChips.tsx; src/app/core-web-vitals.test.ts; src/app/hero-package-search.test.ts"}
{"id": "f210", "date": "2026-10-01", "kind": "invariant", "topic": "ui-components-styling", "fact": "There is exactly one Help Me Choose wizard per page, owned by DestinationBrowse. Outside triggers (the homepage HeroTuneButton) open it via src/app/destinations/planWizardOpener.ts: requestPlanWizard() dispatches the window event 'esim2you:open-plan-wizard', and DestinationBrowse subscribes with onPlanWizardRequest in an effect, sets wizardRequested, and opens only once loading is false (same race as the button's disabled={loading}, f074). Requests are never queued (no listener = no-op), so a later-mounted DestinationBrowse can't pop the wizard. Chosen over a React context because Hero is a server section rendered beside DestinationBrowse in page.tsx (no shared client parent) and lifting the state would also touch /destinations. Call it as onClick={() => requestPlanWizard()}, never onClick={requestPlanWizard}, or the click event becomes the dispatch target.", "source": "src/app/destinations/planWizardOpener.ts; src/app/destinations/DestinationBrowse.tsx; src/app/HeroTuneButton.tsx; src/app/destinations/destinationBrowse-wiring.test.ts"}
```

- [ ] **Step 2: Topic + session + index + brain sync**

- In `feedAI/topics/ui-components-styling.json`, add `f209` and `f210` to `facts`. In `notable_components`:
  - update the `src/app/HeroPackageSearch.tsx` entry to say it sits beside `HeroTuneButton` in the light split hero, unchanged;
  - add `"src/app/HeroTuneButton.tsx + destinations/planWizardOpener.ts": "hero tune tile; opens DestinationBrowse's single wizard via a window event (f210)"`.
- Write `docs/sessions/2026-10-01_web-ui-polish-hero.md` in the same shape as `2026-10-01_web-ui-polish-shell.md` (Goal, What changed, Review outcome, Verification, Deferred / notes, Commits). Include the test counts, the build route table line for `/`, the Task 6 matrix results, the Lighthouse runs, and the deliberately changed assertions:
  - `core-web-vitals.test.ts`: `sizes="100vw"` → the new `sizes` string;
  - `hero-package-search.test.ts`: the hero section class `relative isolate z-20 overflow-hidden bg-brandInk text-white` → `relative isolate z-20 bg-surface text-onSurface`.
- Append a row to `docs/sessions/INDEX.md`:
  `| 2026-10-01 | [Web UI polish: homepage hero](./2026-10-01_web-ui-polish-hero.md) | Phase 2: light split hero (photo card + trust overlay, gradient H1), tune button opens DestinationBrowse's wizard via planWizardOpener; <N> tests, CLS <X>. |`
- In `feedAI/brain.json`:
  - set `sync.date` to `2026-10-01`;
  - prepend `f209-f210: phase 2 homepage hero C (light split, photo card sizes, h-11 chips) + planWizardOpener (single wizard, window event); next plan = browse B.` to `sync.note_latest`;
  - update `phase.current` to say phase 1 (shell) and phase 2 (hero) shipped 2026-10-01 (f207–f210).

- [ ] **Step 3: Validate JSON**

Run: `tail -2 feedAI/facts.jsonl | while read -r l; do echo "$l" | node -e 'JSON.parse(require("fs").readFileSync(0,"utf8"))' && echo ok; done && node -e 'JSON.parse(require("fs").readFileSync("feedAI/brain.json","utf8"));JSON.parse(require("fs").readFileSync("feedAI/topics/ui-components-styling.json","utf8"));console.log("json ok")'`
Expected: `ok`, `ok`, `json ok`.

- [ ] **Step 4: Commit (controller)**

```bash
git add feedAI docs/sessions
git commit -m "docs: feedAI + session log for web UI polish phase 2 (hero)"
```

---

## Next plans (not in this document)

3. Browse B: `PhotoTile` + lazy `/bff/country-image`
4. Country plans A: `PlanRow` + `planRowTags()`, sidebar, collapsed country bar (also fixes `DestinationPlans.tsx`'s `pt-20` under the capsule)
5. Checkout B + sign-in
6. Account: desktop sidebar dashboard / phone app layout + order detail
7. Homepage bento blocks
8. Content pages restyle + legal token fix
9. Partner pages on the account shell
