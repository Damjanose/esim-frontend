# Web UI Polish, Phase 8: Content pages (spec 8B: restyle the current structure) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Repo rule (overrides any skill):** implementers **never** run `git commit`. Each "Commit (controller)" step is done by the controller, who stages the listed files only, shows the message, and asks the user before every commit. Stay on the current branch, with no new branches, worktrees or stashes.
>
> **Owner WIP (untouchable):** `src/app/page.tsx`, `src/app/how-it-works.test.ts`, `public/images/app-store.png` and `public/images/how-it-works-app-screens.png` hold the owner's uncommitted homepage work. No task edits, stages, restores or stashes them. Never `git add -A` / `git add .`. With that WIP in the tree, `pnpm test` has **exactly one known failure**: `src/content/landing.test.ts` (alt text). Every count below is the committed code; in the real tree expect the same file count with **one test fewer passing and that one failing**.

**Goal:** Spec section 8, option B: the content pages keep their structure (hero, section cards, the Related sidebar that stacks on phones, the FAQ accordion) and get the new tokens, type scale, radii and spacing. In scope:
- `SeoContentPage` (all `/travel/*` and `/use-cases/*` pages), the `/travel`, `/use-cases`, `/compare` hubs and `/compare/[slug]`;
- `LegalDocumentPage` (`/policy`, `/terms`): off the retired `midnight` / `line` / `cyan` / `cloud` / `ink` / `slate-*` classes, a readable single column with its sections in one card;
- `/support` (`SupportPageClient`): search, topic cards, FAQ, quick links, contact.

Acceptance (all measured in the dry run): no horizontal page scroll at 320/375/768/1024/1440, every control in `main` ≥ 44px, ≤ 1 gradient CTA per view, CLS 0, Lighthouse a11y 1.0 on `/support`, `/policy` and a travel guide. **No copy, heading text, link or JSON-LD change**, and every route keeps its build type (○ / ●).

**Architecture:** one small set of shared class strings (`src/app/components/contentClasses.ts`), one server `ContentFaq` (native `<details>`, the exact FAQ markup `/esim/[slug]` already uses), and a test helper regex for the retired palette (`src/app/components/retiredTokens.ts`). Each page file is then restyled on its own, keeping its data, JSX order, `JsonLd` call and text byte for byte.

**Tech Stack:** Next.js 15.5 App Router, React 19, Tailwind 3.4.19, lucide-react 0.475, vitest in a node env (source-string tests; no RTL/jsdom).
- **Tailwind classes used** are all built in or already configured in `tailwind.config.ts`: tokens `brandBlue`, `brandTeal`, `brandInk`, `surface`, `surfaceBright`, `onSurface`, `onSurfaceVariant`, `outline`; font sizes `text-display-lg`, `text-headline-md`, `text-title-sm`, `text-body-md`, `text-body-sm`, `text-label-caps`; shadow `shadow-brandCard` (and the existing `shadow-brandGlow` is dropped); `min-h-11`, `min-h-14`, `overflow-x-clip`, `motion-safe:`, `first:border-t-0`, `!h-auto` (important modifier).
- **lucide-react icons:** `ArrowLeft` (new in `SeoContentPage`, replaces the rotated `ArrowRight`), `ArrowRight`, `CheckCircle2`, `CircleHelp`; `/support` keeps its existing import list unchanged. All exist under `node_modules/lucide-react/dist/esm/icons/`.

**Spec:** `docs/superpowers/specs/2026-10-01-web-ui-mobile-polish-design.md`: "Constraints carried over", "Breakpoints", "### 8. Content pages (option B: restyle the current structure)". Spec build-order step 9 ("Content pages restyle + legal token fix"); the phase-6 session lists it as phase 8 (phase 7 = homepage bento, which overlaps the owner's WIP and is not part of this plan).

**Baseline (2026-10-01, `HEAD = c085128`, committed code in a scratch copy):**
- `pnpm test` → **92 files, 694 tests passing**; `tsc` clean.
- `pnpm build` (these lines are unchanged by this plan, verified): `○ /compare 137 B 117 kB`, `● /compare/[slug] 137 B 117 kB`, `○ /policy 387 B 114 kB`, `○ /support 8.59 kB 147 kB`, `○ /terms 387 B 114 kB`, `○ /travel 136 B 117 kB`, `● /travel/[slug] 136 B 117 kB`, `○ /use-cases 137 B 117 kB`, `● /use-cases/[slug] 136 B 117 kB`.
- **Matrix (Task 6 script, 9 pages × 5 widths + 3 support-search states = 48 checks) on the old pages: 35 issues.** No horizontal scroll and CLS 0 anywhere. Below-44px controls: `/compare/<slug>` Home / Compare / "Browse eSIM2you destinations" 20px, FAQ summaries 24px; `/policy` and `/terms` logo link 36px and Home 20px; travel / use-case back link 20px, FAQ summaries 24px; `/support` search input 20–24px, Clear search 36px, "Contact support", "View guide", "Browse plans", "Learn more" 16px. **Two gradients** on `/support` when a search finds nothing ("View all help topics" + "Email support"). The support FAQ intro's `sticky top-28` never stuck (`main` was `overflow-hidden`, f215).
- **Lighthouse mobile:** `/support` a11y 1.0, `/policy` **0.96 (color-contrast: the `text-cyan` eyebrow)**, `/travel/how-to-install-esim` 1.0; CLS 0 on all three.

**Dry run:** every code block below was applied in task order to a scratch copy of `HEAD`. Each task's `pnpm test` count and a clean `tsc` were recorded at that point; then `pnpm build`, a before/after JSON-LD + visible-text + href diff of all 32 prerendered content routes, the Playwright matrix and Lighthouse ran on the result. See "Verification numbers from the dry run" at the end.

---

## Decisions

### Scope: which files are "content pages"

| File | In scope | Why |
|---|---|---|
| `src/app/SeoContentPage.tsx` | yes | renders every `/travel/[slug]` and `/use-cases/[slug]` (the `[slug]` route files only pass props and stay untouched) |
| `src/app/travel/page.tsx`, `use-cases/page.tsx`, `compare/page.tsx` | yes | the three hubs |
| `src/app/compare/[slug]/page.tsx` | yes (render only) | comparison article; its data block (`getGlobalOffer`, `getGbpRate`, `revalidate`, `generateStaticParams`, `generateMetadata`, `JsonLd`) is kept verbatim |
| `src/app/LegalDocumentPage.tsx` | yes | `/policy`, `/terms` (route files untouched) |
| `src/app/support/SupportPageClient.tsx` | yes (render only) | `supportCategories` and `faqs` data (lines 1–185) unchanged; the support `page.tsx` (JSON-LD) untouched |
| `src/app/esim/id/[esimId]/page.tsx` | **no** | not a content page: a `noindex`, server-fetched shared-eSIM landing (`backendFetch`) that is already on current tokens |
| `src/app/EsimDestinationPage.tsx` | **no** | restyled in phase 4; its FAQ markup is the model for `ContentFaq` |

### Retired tokens: what "mist" means here

`docs/design/mobile-design-system.md` lists `ink`/`midnight`/`cyan`/`aqua`/`cloud`/`mist`/`line` as **retiring** (to be deleted from `tailwind.config.ts` once nothing uses them). The spec's "Constraints carried over" still allows `mist`, because phase 6 uses `stroke-mist` for the usage ring's track. Decision: **these files drop `mist` too** and use `surfaceBright` (`#F5F7FA`, the app's `lightPalette.surfaceBright`) for tints, as phases 4–6 did. Cleanup scope, before → after (from `grep` on HEAD):

| File | Retired / literal colour classes today | After |
|---|---|---|
| `LegalDocumentPage.tsx` | `bg-cloud`, `text-ink`, `border-line` ×2, `text-midnight` ×3, `text-cyan` ×2, `shadow-glow`, `text-slate-500`, `text-slate-600`, `bg-white` | 0 |
| `SeoContentPage.tsx` | `bg-mist` ×2, `bg-white` ×4 | 0 |
| `SupportPageClient.tsx` | `bg-mist` ×7, `bg-white` ×9, `text-white/80`, two literal `rgba(…)` radial gradients, `hero-grid` | 0 |
| `compare/[slug]/page.tsx` | `bg-mist`, `bg-white` ×3 | 0 |
| `travel/`, `use-cases/`, `compare/page.tsx` | `bg-white` ×1 each | 0 |

`RETIRED_COLOR_CLASS` (Task 1) is the regex every new test uses. Retired tokens still used **elsewhere** (`WizardWelcomeIntro`, `HelpMeChooseWizard`, admin `x*` pages, `stroke-mist`) are out of scope, so `tailwind.config.ts` keeps the old keys.

### Legal pages keep their own slim header (no Navbar/dock)

`LegalDocumentPage` has always rendered its own logo + Home header instead of `<Navbar />`, so `/policy` and `/terms` have no dock. Spec 8B says "keep the current structure", and `legal-pages.test.ts` + `seo-external-factors.test.ts` pin the header's `src="/app-logo.png"` / `alt="eSim2you app logo"`. The header stays, restyled (`bg-surface`, `border-outline/70`, both links `min-h-11`). Swapping it for the capsule Navbar + dock is a one-line follow-up (**Risks 1**).

### One gradient per view

| View | Gradient | Everything else |
|---|---|---|
| `/travel/<slug>`, `/use-cases/<slug>` | App Store (controller decision 2026-10-01: US-first market priority; was Google Play) | Google Play becomes `flat` |
| `/support` (any search state) | Email support | "View all help topics" (no-results reset) becomes `variant="flat"`: it used to be a second gradient |
| hubs, `/compare/<slug>`, `/policy`, `/terms` | none | text links / card links |

### Layout numbers (verified)

- **Top under the capsule:** `pt-[92px] lg:pt-[100px]` (the Navbar header is `absolute`; its capsule ends 68px down, 76px at lg), the same as `CountryBanner`. Gutters `px-5 md:px-8` as `/esim/[slug]`.
- **Heroes:** `rounded-b-[24px] bg-surfaceBright` band (no photo, so `CountryBanner` doesn't fit: its breadcrumb is hard-wired to Home / Destinations). H1 `text-[34px] sm:text-5xl lg:text-[56px]`.
- **Cards:** `rounded-[20px] border border-outline/70 bg-surface`, the phase-4 language; section-card icon tiles are `hidden sm:grid` so the text keeps ~280px at 320px. Related links and every standalone text link are `min-h-11`; FAQ summaries `min-h-11`; support FAQ buttons `min-h-14`; support search input `h-11` in a 60px field; Clear search `h-11 w-11`.
- **Related sidebar:** `lg:grid-cols-[minmax(0,1fr)_280px]`, stacks below lg. **Not sticky:** the guides' section column is only ~316px tall at 1440 (3 short cards), so a sticky aside would just ride the grid bottom (measured).
- **Support FAQ intro:** `lg:sticky lg:top-6` and `<main className="… overflow-x-clip …">` (was `overflow-hidden`, which killed sticky, f215). Measured: top 24px after scrolling at 1024 and 1440.
- **Hubs:** `bg-surfaceBright` page, whole-card links, 1 / 2 / 3 columns (`md:grid-cols-2 lg:grid-cols-3`; use-cases stays 2 at lg: 4 entries).
- **Legal:** one `max-w-3xl` column; the sections sit in one white card split by hairlines (`first:border-t-0`), ~70 characters per line at desktop.
- **Email support button:** the LinkButton keeps `size="lg"` but gets `!h-auto min-h-[54px] max-w-full flex-wrap py-2`: at 320px "Email support esim2you@uplisoft.com" wraps, and the fixed `h-[54px]` used to clip the second line.

### JSON-LD and copy safety: how it is proven

1. **Source level:** no task edits a `JsonLd` call, `createContentPageJsonLd`/`createWebPageJsonLd` argument, metadata export, `generateStaticParams`, data array or route file. New tests pin the `SeoContentPage` `JsonLd` block line by line and the hubs' `breadcrumbName`s; `seo.test.ts` already pins Article on travel and compare (f196).
2. **Output level (Task 6 Step 3):** `content-snapshot.cjs` reads every prerendered content route in `.next/server/app` (32 routes: 2 hubs + 14 guides + 1 hub + 4 use cases + 1 hub + 8 comparisons + policy + terms + support) and records, per route, every `<script type="application/ld+json">` body, the visible text (tags/scripts/SVG stripped, whitespace collapsed) and every `<a href>`. Run it on a build of `HEAD` **before Task 2** and on the final build; `snap-diff.cjs` must print `identical: 32 routes (JSON-LD, text, hrefs)`. Dry run: identical.

### Changed assertions

**None.** No existing test assertion changes. Checked: `seo-content-page.test.ts` (SiteFooter in `SeoContentPage`), `public-shell.test.ts` (Navbar/SiteFooter in support + SEO pages; SiteFooter and no `<footer` in legal), `legal-pages.test.ts` (`src="/app-logo.png"`, no `Globe2`), `seo-external-factors.test.ts` (`alt="eSim2you app logo"` in `LegalDocumentPage`, H1 words, llms.txt), `support/support-page.test.ts` (support copy), `seo.test.ts` (`<SeoContentPageView asArticle`, compare Article), `seo-routes.test.ts`, `content/seo-pages.test.ts`. Only new test files are added (5 files, 23 tests).

---

## File map

| File | Action | Responsibility |
|---|---|---|
| `src/app/components/contentClasses.ts` | create (T1) | shared class strings for content pages |
| `src/app/components/ContentFaq.tsx` | create (T1) | `<details>` FAQ list, server component |
| `src/app/components/retiredTokens.ts` | create (T1) | `RETIRED_COLOR_CLASS` regex for tests |
| `src/app/components/content-primitives.test.ts` | create (T1) | 5 tests |
| `src/app/SeoContentPage.tsx` | rewrite render (T2) | hero band, section cards, Related panel, FAQ |
| `src/app/seo-content-layout.test.ts` | create (T2) | 4 tests |
| `src/app/travel/page.tsx`, `use-cases/page.tsx`, `compare/page.tsx` | rewrite render (T3) | hubs as card grids |
| `src/app/compare/[slug]/page.tsx` | rewrite render (T3) | hero band, table card, 44px links, `ContentFaq` |
| `src/app/content-hubs.test.ts` | create (T3) | 6 tests |
| `src/app/LegalDocumentPage.tsx` | rewrite (T4) | tokens, column, sections card |
| `src/app/legal-layout.test.ts` | create (T4) | 3 tests |
| `src/app/support/SupportPageClient.tsx` | modify imports + rewrite render from `function normalizeSearch` (T5) | all five blocks restyled; data untouched |
| `src/app/support/support-layout.test.ts` | create (T5) | 5 tests |
| `feedAI/*`, `docs/sessions/*`, `docs/overview.md` | modify/create (T7) | knowledge + session log |

**Not changed:** every `[slug]` route file except `compare/[slug]/page.tsx`'s render, `policy/page.tsx`, `terms/page.tsx`, `support/page.tsx`, `src/content/*`, `src/lib/*`, `EsimDestinationPage.tsx`, `Navbar.tsx`, `BottomDock.tsx`, `SiteFooter.tsx`, `Button.tsx`, `buttonClasses.ts`, `tailwind.config.ts`, `globals.css`, and the owner's WIP files.

---

### Task 1: Shared content primitives (not wired)

**Files:**
- Create: `src/app/components/contentClasses.ts`, `src/app/components/ContentFaq.tsx`, `src/app/components/retiredTokens.ts`
- Test: `src/app/components/content-primitives.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/app/components/content-primitives.test.ts`:

```ts
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  CONTENT_ASIDE,
  CONTENT_CARD,
  CONTENT_CARD_LINK,
  CONTENT_GUTTER,
  CONTENT_ICON_TILE,
  CONTENT_ROW_LINK,
  CONTENT_TEXT_LINK,
  CONTENT_TOP
} from "./contentClasses";
import { RETIRED_COLOR_CLASS } from "./retiredTokens";

describe("content page primitives (spec 8B)", () => {
  it("clears the floating navbar capsule by 24px", () => {
    expect(CONTENT_TOP).toBe("pt-[92px] lg:pt-[100px]");
    expect(CONTENT_GUTTER).toBe("px-5 md:px-8");
  });

  it("gives every standalone link a 44px target", () => {
    expect(CONTENT_ROW_LINK).toContain("min-h-11");
    expect(CONTENT_TEXT_LINK).toContain("min-h-11");
  });

  it("recognises the retired palette and nothing current", () => {
    for (const old of ["bg-mist", "text-midnight", "border-line", "bg-cloud", "text-cyan", "text-ink", "shadow-glow", "text-slate-600"]) {
      expect(old).toMatch(RETIRED_COLOR_CLASS);
    }
    for (const current of ["text-brandInk", "bg-surfaceBright", "border-outline/70", "shadow-brandCard", "to-brandTeal", "outline-none"]) {
      expect(current).not.toMatch(RETIRED_COLOR_CLASS);
    }
  });

  it("uses the phase-4 card language and only current tokens", () => {
    for (const classes of [CONTENT_CARD, CONTENT_CARD_LINK, CONTENT_ASIDE, CONTENT_ROW_LINK]) {
      expect(classes).toContain("rounded-[");
      expect(classes).toContain("border-outline/70");
    }
    expect(CONTENT_ASIDE).toContain("bg-surfaceBright");
    expect(CONTENT_ICON_TILE).toContain("hidden");
    expect(CONTENT_ICON_TILE).toContain("sm:grid");

    const source = readFileSync("src/app/components/contentClasses.ts", "utf8");
    expect(source).not.toMatch(RETIRED_COLOR_CLASS);
    expect(source).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  });

  it("renders the FAQ as a native details accordion with 44px rows", () => {
    const faq = readFileSync("src/app/components/ContentFaq.tsx", "utf8");

    expect(faq).not.toContain('"use client"');
    expect(faq).toContain("<details");
    expect(faq).toContain("min-h-11");
    expect(faq).toContain("motion-safe:transition");
    expect(faq).not.toMatch(RETIRED_COLOR_CLASS);
  });
});
```

- [ ] **Step 2: Run it to see it fail**

Run: `pnpm exec vitest run src/app/components/content-primitives.test.ts`
Expected: FAIL, `Failed to resolve import "./contentClasses"`.

- [ ] **Step 3: Write the retired-palette helper**

Create `src/app/components/retiredTokens.ts` (a plain module, not a `.test.ts`, so importing it from several test files doesn't re-register tests):

```ts
/**
 * Retired dark-theme colour classes (docs/design/mobile-design-system.md: ink, midnight,
 * cyan, aqua, cloud, mist, line, muted, cyanDeep), the old glow/card shadows and raw
 * slate greys. Source-string tests use it to keep converted files off the old palette.
 */
export const RETIRED_COLOR_CLASS =
  /\b(?:bg|text|border|from|via|to|ring|fill|stroke|divide|placeholder)-(?:ink|midnight|cyan|aqua|cloud|mist|line|muted|cyanDeep)\b|\bshadow-(?:glow|card)\b|\b(?:text|bg|border)-slate-\d+/;
```

- [ ] **Step 4: Write the class strings**

Create `src/app/components/contentClasses.ts` (inside `src/`, so Tailwind's `content` glob sees every class):

```ts
/**
 * Shared class strings for the public content pages (spec section 8, option B:
 * same structure, new styling): SeoContentPage (/travel/*, /use-cases/*), the
 * /travel, /use-cases and /compare hubs, /compare/[slug] and LegalDocumentPage.
 * Same card language as /esim/[slug] (phase 4): 20px cards with outline/70
 * hairlines, surfaceBright tints, the app type scale, 44px link targets.
 */

/** Page top under the floating navbar capsule (it ends 68px down, 76px at lg): 24px clear. */
export const CONTENT_TOP = "pt-[92px] lg:pt-[100px]";

/** Side gutters, the same as /esim/[slug]. */
export const CONTENT_GUTTER = "px-5 md:px-8";

/** Small caps eyebrow above a heading. */
export const CONTENT_EYEBROW = "text-label-caps uppercase text-brandBlue";

/** Page H1: 34px on phones, 48px from sm, 56px at lg (as /esim/[slug]). */
export const CONTENT_H1 =
  "font-display text-[34px] font-black leading-[1.08] tracking-[-0.03em] text-brandInk sm:text-5xl lg:text-[56px]";

/** Section H2 (FAQ titles and similar). */
export const CONTENT_SECTION_H2 =
  "font-display text-display-lg font-black text-brandInk md:text-[32px] md:leading-[38px]";

/** A section card on a white page. */
export const CONTENT_CARD = "rounded-[20px] border border-outline/70 bg-surface p-5 sm:p-7";

/** A whole-card link on a hub page (the card is the target, so it is far above 44px). */
export const CONTENT_CARD_LINK =
  "group flex h-full flex-col rounded-[20px] border border-outline/70 bg-surface p-5 shadow-brandCard transition hover:border-brandBlue/50 sm:p-6";

/** The leading icon tile of a section card. Hidden below sm so text keeps the width at 320px. */
export const CONTENT_ICON_TILE =
  "hidden h-10 w-10 shrink-0 place-items-center rounded-[12px] bg-brandBlue/10 text-brandBlue sm:grid";

/** The tinted side panel (Related pages). */
export const CONTENT_ASIDE = "rounded-[20px] border border-outline/70 bg-surfaceBright p-5 sm:p-6";

/** One row link inside the side panel: at least 44px tall. */
export const CONTENT_ROW_LINK =
  "flex min-h-11 items-center justify-between gap-3 rounded-[14px] border border-outline/70 bg-surface px-4 py-2.5 text-sm font-bold text-brandInk transition hover:border-brandBlue/50";

/** A standalone text link (back link, breadcrumb, "Browse …"): at least 44px tall. */
export const CONTENT_TEXT_LINK =
  "inline-flex min-h-11 items-center gap-2 font-bold text-brandBlue transition hover:text-brandInk";
```

- [ ] **Step 5: Write the FAQ**

Create `src/app/components/ContentFaq.tsx` (same markup as `/esim/[slug]`'s FAQ; `SeoPageFaq` from `src/content/seo-pages.ts` and `ComparePage["faqs"]` both fit `ContentFaqEntry`):

```tsx
import { CircleHelp } from "lucide-react";

export type ContentFaqEntry = {
  question: string;
  answer: string;
};

/**
 * The content pages' FAQ: native <details> (no client JS, works before hydration),
 * styled like /esim/[slug]'s FAQ. Each summary row is at least 44px tall.
 */
export function ContentFaq({ faqs }: { faqs: readonly ContentFaqEntry[] }) {
  return (
    <div className="space-y-3">
      {faqs.map((faq) => (
        <details className="group rounded-[16px] border border-outline/70 bg-surface px-5 py-2" key={faq.question}>
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 py-2 font-display font-black text-brandInk">
            {faq.question}
            <CircleHelp
              aria-hidden="true"
              className="shrink-0 text-brandBlue motion-safe:transition group-open:rotate-45"
              size={20}
            />
          </summary>
          <p className="pb-3 pt-1 leading-7 text-onSurfaceVariant">{faq.answer}</p>
        </details>
      ))}
    </div>
  );
}
```

- [ ] **Step 6: Tests + types**

Run: `pnpm exec vitest run src/app/components/content-primitives.test.ts` → PASS, 5 tests.
Run: `pnpm test && pnpm exec tsc --noEmit` → **93 files, 699 tests**; tsc prints nothing. (Real tree: 1 failing, `landing.test.ts`, owner WIP.)

- [ ] **Step 7: Commit (controller)**

```bash
git add src/app/components/contentClasses.ts src/app/components/ContentFaq.tsx src/app/components/retiredTokens.ts src/app/components/content-primitives.test.ts
git commit -m "feat(content): shared content-page classes, ContentFaq, retired-palette test regex"
```

---

### Task 2: `SeoContentPage` (every `/travel/*` and `/use-cases/*` page)

**Files:**
- Modify (full rewrite, data and `JsonLd` call unchanged): `src/app/SeoContentPage.tsx`
- Test: `src/app/seo-content-layout.test.ts`

**Before this task (controller, once):** take the "before" content snapshot for the JSON-LD/copy diff: Task 6 Step 3a. It needs a `pnpm build` of the tree as it is now (Tasks 2–5 not applied yet). If the controller skips it here, build `HEAD` in a scratch copy later (`git archive HEAD | tar -x -C <scratch>`), never by stashing or checking out in the real repo.

- [ ] **Step 1: Write the failing test**

Create `src/app/seo-content-layout.test.ts`:

```ts
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { RETIRED_COLOR_CLASS } from "./components/retiredTokens";

describe("SeoContentPage restyle (spec 8B: same structure, new styling)", () => {
  const source = readFileSync("src/app/SeoContentPage.tsx", "utf8");

  it("keeps the JSON-LD call exactly as before (Article on guides, f196)", () => {
    expect(source).toContain(
      [
        "        data={createContentPageJsonLd({",
        "          path: page.path,",
        "          name: page.heading,",
        "          description: page.description,",
        "          breadcrumbName: page.heading,",
        "          parent,",
        "          faqs: page.faqs,",
        "          offer,",
        "          article: asArticle ? { dateModified: seoContentUpdatedAt } : undefined",
        "        })}"
      ].join("\n")
    );
  });

  it("keeps both app CTAs with the Play button as the page's one gradient", () => {
    expect(source.match(/<LinkButton/g)).toHaveLength(2);
    expect(source.match(/variant="flat"/g)).toHaveLength(1);
    expect(source).toContain('aria-label="Download eSim2you on the App Store"');
    expect(source).toContain('aria-label="Download eSim2you on Google Play"');
  });

  it("uses the shared content cards, a Related sidebar that stacks on phones, and the shared FAQ", () => {
    expect(source).toContain('from "./components/contentClasses"');
    expect(source).toContain('<main className="min-h-screen overflow-x-clip bg-surface');
    expect(source).toContain("lg:grid-cols-[minmax(0,1fr)_280px]");
    expect(source).toContain("lg:items-start");
    expect(source).toContain("<aside className={`h-fit ${CONTENT_ASIDE}`}>");
    expect(source).toContain("className={CONTENT_ROW_LINK}");
    expect(source).toContain("<ContentFaq faqs={page.faqs} />");
    expect(source).toContain("Related pages");
    expect(source).toContain("Quick answers before you travel.");
  });

  it("gives the back link a 44px target and drops the retired palette", () => {
    expect(source).toContain("CONTENT_TEXT_LINK");
    expect(source).toContain("{parent.name}");
    expect(source).not.toMatch(RETIRED_COLOR_CLASS);
    expect(source).not.toContain("bg-white");
    expect(source).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  });
});
```

- [ ] **Step 2: Run it to see it fail**

Run: `pnpm exec vitest run src/app/seo-content-layout.test.ts`
Expected: 2 failed, 2 passed (the JSON-LD and CTA tests already pass on the old file; that is the point: they guard the rewrite).

- [ ] **Step 3: Rewrite the page**

Replace the whole of `src/app/SeoContentPage.tsx` with:

```tsx
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import { JsonLd } from "./JsonLd";
import { Navbar } from "./components/Navbar";
import { LinkButton } from "./components/Button";
import { ContentFaq } from "./components/ContentFaq";
import {
  CONTENT_ASIDE,
  CONTENT_CARD,
  CONTENT_EYEBROW,
  CONTENT_GUTTER,
  CONTENT_H1,
  CONTENT_ICON_TILE,
  CONTENT_ROW_LINK,
  CONTENT_SECTION_H2,
  CONTENT_TEXT_LINK,
  CONTENT_TOP
} from "./components/contentClasses";
import { SiteFooter } from "./SiteFooter";
import { landingContent } from "@/content/landing";
import type { SeoContentPage } from "@/content/seo-pages";
import { createContentPageJsonLd, type DestinationOfferInput } from "@/lib/seo";
import { seoContentUpdatedAt } from "@/lib/esim-routes";

export function SeoContentPageView({
  page,
  parent,
  offer,
  asArticle = false
}: {
  page: SeoContentPage;
  parent: {
    name: string;
    path: string;
  };
  offer?: DestinationOfferInput;
  /** Editorial guides get Article markup; marketing landing pages don't. */
  asArticle?: boolean;
}) {
  return (
    <main className="min-h-screen overflow-x-clip bg-surface text-onSurface">
      <JsonLd
        data={createContentPageJsonLd({
          path: page.path,
          name: page.heading,
          description: page.description,
          breadcrumbName: page.heading,
          parent,
          faqs: page.faqs,
          offer,
          article: asArticle ? { dateModified: seoContentUpdatedAt } : undefined
        })}
      />
      <Navbar />

      <article>
        <section className={`rounded-b-[24px] bg-surfaceBright pb-10 lg:pb-14 ${CONTENT_GUTTER} ${CONTENT_TOP}`}>
          <div className="mx-auto max-w-6xl">
            <a className={`${CONTENT_TEXT_LINK} text-sm`} href={parent.path}>
              <ArrowLeft aria-hidden="true" size={16} />
              {parent.name}
            </a>
            <p className={`mt-6 ${CONTENT_EYEBROW}`}>{page.eyebrow}</p>
            <h1 className={`mt-3 max-w-4xl ${CONTENT_H1}`}>{page.heading}</h1>
            {offer ? (
              <p className="mt-5 inline-flex flex-wrap items-center gap-x-1 rounded-full border border-brandBlue/20 bg-brandBlue/5 px-4 py-2 text-sm font-black text-brandBlue">
                eSIM plans from €{offer.lowPrice.toFixed(2)} to €{offer.highPrice.toFixed(2)} ·{" "}
                {offer.offerCount} plans
              </p>
            ) : null}
            <p className="mt-5 max-w-3xl text-base leading-7 text-onSurfaceVariant sm:text-lg sm:leading-8">
              {page.intro}
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              {/* US is the first market (owner priority US > UK > rest of Europe), so the App Store link is
                  this page's one gradient primary and Google Play is flat. */}
              <LinkButton
                aria-label="Download eSim2you on the App Store"
                href={landingContent.appLinks.ios.href}
                size="lg"
              >
                {landingContent.appLinks.ios.label}
                <ArrowRight aria-hidden="true" size={18} />
              </LinkButton>
              <LinkButton
                aria-label="Download eSim2you on Google Play"
                href={landingContent.appLinks.android.href}
                size="lg"
                tone="brand"
                variant="flat"
              >
                {landingContent.appLinks.android.label}
                <ArrowRight aria-hidden="true" size={18} />
              </LinkButton>
            </div>
          </div>
        </section>

        <section className={`py-10 md:py-16 ${CONTENT_GUTTER}`}>
          <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start">
            <div className="min-w-0 space-y-4">
              {page.sections.map((section) => (
                <section className={CONTENT_CARD} key={section.title}>
                  <div className="flex gap-4">
                    <span className={`mt-0.5 ${CONTENT_ICON_TILE}`}>
                      <CheckCircle2 aria-hidden="true" size={20} />
                    </span>
                    <div className="min-w-0">
                      <h2 className="font-display text-headline-md font-black text-brandInk">{section.title}</h2>
                      <p className="mt-2 leading-7 text-onSurfaceVariant">{section.body}</p>
                    </div>
                  </div>
                </section>
              ))}
            </div>

            <aside className={`h-fit ${CONTENT_ASIDE}`}>
              <h2 className="font-display text-title-sm font-black text-brandInk sm:text-xl">Related pages</h2>
              <div className="mt-4 grid gap-2">
                {page.relatedLinks.map((link) => (
                  <a className={CONTENT_ROW_LINK} href={link.href} key={link.href}>
                    {link.label}
                    <ArrowRight aria-hidden="true" className="shrink-0 text-brandBlue" size={16} />
                  </a>
                ))}
              </div>
            </aside>
          </div>
        </section>

        <section className={`bg-surfaceBright py-16 md:py-24 ${CONTENT_GUTTER}`}>
          <div className="mx-auto max-w-3xl">
            <p className={`text-center ${CONTENT_EYEBROW}`}>FAQ</p>
            <h2 className={`mt-2 text-center ${CONTENT_SECTION_H2}`}>Quick answers before you travel.</h2>
            <div className="mt-8">
              <ContentFaq faqs={page.faqs} />
            </div>
          </div>
        </section>
      </article>
      <SiteFooter />
    </main>
  );
}
```

What changed vs HEAD (review aid): `main` `bg-white` → `overflow-x-clip bg-surface`; hero band `bg-surfaceBright rounded-b-[24px]` with the shared top padding (the old blurred `bg-brandBlue/8` blob is gone); back link `ArrowLeft` + 44px; eyebrow `text-label-caps`; H1 34/48/56px; section cards and Related panel on the phase-4 classes; FAQ is `<ContentFaq>`. `JsonLd`, both `LinkButton`s (props verbatim), `Related pages`, `FAQ`, `Quick answers before you travel.` and `<SiteFooter />` unchanged.

- [ ] **Step 4: Tests + types**

Run: `pnpm exec vitest run src/app/seo-content-layout.test.ts src/app/seo-content-page.test.ts src/app/public-shell.test.ts src/lib/seo.test.ts` → PASS.
Run: `pnpm test && pnpm exec tsc --noEmit` → **94 files, 703 tests**; tsc clean.

- [ ] **Step 5: Commit (controller)**

```bash
git add src/app/SeoContentPage.tsx src/app/seo-content-layout.test.ts
git commit -m "feat(content): restyle SeoContentPage (travel + use-case guides) on the app card language"
```

---

### Task 3: The three hubs and `/compare/[slug]`

**Files:**
- Modify (render only): `src/app/travel/page.tsx`, `src/app/use-cases/page.tsx`, `src/app/compare/page.tsx`, `src/app/compare/[slug]/page.tsx`
- Test: `src/app/content-hubs.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/app/content-hubs.test.ts`:

```ts
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { RETIRED_COLOR_CLASS } from "./components/retiredTokens";

const hubs = [
  { file: "src/app/travel/page.tsx", h1: "Travel eSIM guides", cta: "Read guide", crumb: 'breadcrumbName: "Travel"' },
  { file: "src/app/use-cases/page.tsx", h1: "eSIM use cases", cta: "Read more", crumb: 'breadcrumbName: "Use cases"' },
  { file: "src/app/compare/page.tsx", h1: "Compare travel eSIMs", cta: "Read comparison", crumb: 'breadcrumbName: "Compare"' }
];

describe("content hubs restyle (spec 8B)", () => {
  for (const hub of hubs) {
    it(`${hub.file}: same H1, JSON-LD and links, as whole-card links on the new tokens`, () => {
      const source = readFileSync(hub.file, "utf8");

      expect(source).toContain(hub.h1);
      expect(source).toContain(hub.cta);
      expect(source).toContain(hub.crumb);
      expect(source).toContain("<Navbar />");
      expect(source).toContain("<SiteFooter />");
      expect(source).toContain("href={page.path}");
      expect(source).toContain("className={CONTENT_CARD_LINK}");
      expect(source).toContain('<main className="min-h-screen overflow-x-clip bg-surfaceBright');
      expect(source).toContain("CONTENT_TOP");
      expect(source).not.toMatch(RETIRED_COLOR_CLASS);
      expect(source).not.toContain("bg-white");
    });
  }
});

describe("/compare/[slug] restyle (spec 8B)", () => {
  const source = readFileSync("src/app/compare/[slug]/page.tsx", "utf8");

  it("keeps the Article JSON-LD, breadcrumb, table semantics and links", () => {
    expect(source).toContain('parent: { name: "Compare", path: "/compare" },');
    expect(source).toContain("article: { dateModified: seoContentUpdatedAt }");
    expect(source).toContain('aria-label="Breadcrumb"');
    expect(source).toContain('scope="col"');
    expect(source).toContain('scope="row"');
    expect(source).toContain("Browse eSIM2you destinations");
    expect(source).toContain('href="/destinations"');
  });

  it("gives breadcrumb and text links 44px targets and reuses the shared FAQ", () => {
    expect(source.match(/inline-flex min-h-11 items-center/g)?.length).toBeGreaterThanOrEqual(2);
    expect(source).toContain("className={CONTENT_TEXT_LINK}");
    expect(source).toContain("<ContentFaq faqs={page.faqs} />");
  });

  it("scrolls a wide table inside its own positioned box (f195) on the new tokens", () => {
    expect(source).toContain("relative overflow-x-auto rounded-[20px]");
    expect(source).toContain('<main className="min-h-screen overflow-x-clip bg-surface');
    expect(source).not.toMatch(RETIRED_COLOR_CLASS);
    expect(source).not.toContain("bg-white");
  });
});
```

- [ ] **Step 2: Run it to see it fail**

Run: `pnpm exec vitest run src/app/content-hubs.test.ts` → 5 failed, 1 passed.

- [ ] **Step 3: `/travel`**

Replace the whole of `src/app/travel/page.tsx` with (metadata, `JsonLd`, H1 and intro text unchanged):

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { JsonLd } from "../JsonLd";
import { Navbar } from "../components/Navbar";
import {
  CONTENT_CARD_LINK,
  CONTENT_EYEBROW,
  CONTENT_GUTTER,
  CONTENT_H1,
  CONTENT_TOP
} from "../components/contentClasses";
import { SiteFooter } from "../SiteFooter";
import { guidePages } from "@/content/seo-pages";
import { createContentPageJsonLd, createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  path: "/travel",
  title: "Travel eSIM Guides | eSIM2you",
  description:
    "Guides for installing a travel eSIM, comparing eSIM vs roaming, and staying online abroad."
});

export default function TravelHubPage() {
  return (
    <main className="min-h-screen overflow-x-clip bg-surfaceBright text-onSurface">
      <JsonLd
        data={createContentPageJsonLd({
          path: "/travel",
          name: "Travel eSIM guides",
          description:
            "Guides for installing a travel eSIM, comparing eSIM vs roaming, and staying online abroad.",
          breadcrumbName: "Travel"
        })}
      />
      <Navbar />
      <section className={`pb-16 md:pb-24 ${CONTENT_GUTTER} ${CONTENT_TOP}`}>
        <div className="mx-auto max-w-6xl">
          <h1 className={`max-w-4xl ${CONTENT_H1}`}>Travel eSIM guides</h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-onSurfaceVariant sm:text-lg sm:leading-8">
            Practical articles that link to live destination plans. Start here if you are choosing
            between eSIM, roaming, or a local SIM card.
          </p>
          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {guidePages.map((page) => (
              <Link className={CONTENT_CARD_LINK} href={page.path} key={page.path}>
                <p className={CONTENT_EYEBROW}>{page.eyebrow}</p>
                <h2 className="mt-2 font-display text-headline-md font-black text-brandInk">{page.heading}</h2>
                <p className="mt-2 line-clamp-3 text-body-md text-onSurfaceVariant">{page.description}</p>
                <span className="mt-auto inline-flex items-center gap-2 pt-5 text-sm font-black text-brandBlue">
                  Read guide
                  <ArrowRight
                    aria-hidden="true"
                    className="motion-safe:transition group-hover:translate-x-0.5"
                    size={16}
                  />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
```

- [ ] **Step 4: `/use-cases`**

Replace the whole of `src/app/use-cases/page.tsx` with:

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { JsonLd } from "../JsonLd";
import { Navbar } from "../components/Navbar";
import {
  CONTENT_CARD_LINK,
  CONTENT_EYEBROW,
  CONTENT_GUTTER,
  CONTENT_H1,
  CONTENT_TOP
} from "../components/contentClasses";
import { SiteFooter } from "../SiteFooter";
import { useCasePages } from "@/content/seo-pages";
import { createContentPageJsonLd, createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  path: "/use-cases",
  title: "eSIM Use Cases | eSIM2you",
  description: "How eSIM2you helps with business travel, remote work, cruises, and study abroad data needs."
});

export default function UseCasesHubPage() {
  return (
    <main className="min-h-screen overflow-x-clip bg-surfaceBright text-onSurface">
      <JsonLd
        data={createContentPageJsonLd({
          path: "/use-cases",
          name: "eSIM use cases",
          description: "How eSIM2you helps with business travel, remote work, cruises, and study abroad data needs.",
          breadcrumbName: "Use cases"
        })}
      />
      <Navbar />
      <section className={`pb-16 md:pb-24 ${CONTENT_GUTTER} ${CONTENT_TOP}`}>
        <div className="mx-auto max-w-6xl">
          <h1 className={`max-w-4xl ${CONTENT_H1}`}>eSIM use cases</h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-onSurfaceVariant sm:text-lg sm:leading-8">
            How travelers use eSIM2you for work trips, remote work days, cruise port stops, and study abroad semesters.
          </p>
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {useCasePages.map((page) => (
              <Link className={CONTENT_CARD_LINK} href={page.path} key={page.path}>
                <p className={CONTENT_EYEBROW}>{page.eyebrow}</p>
                <h2 className="mt-2 font-display text-headline-md font-black text-brandInk">{page.heading}</h2>
                <p className="mt-2 text-body-md text-onSurfaceVariant">{page.description}</p>
                <span className="mt-auto inline-flex items-center gap-2 pt-5 text-sm font-black text-brandBlue">
                  Read more
                  <ArrowRight
                    aria-hidden="true"
                    className="motion-safe:transition group-hover:translate-x-0.5"
                    size={16}
                  />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
```

- [ ] **Step 5: `/compare`**

Replace the whole of `src/app/compare/page.tsx` with (`revalidate`, metadata, `JsonLd` with no `offer:` unchanged; the text keeps its curly apostrophe `competitor’s`):

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { JsonLd } from "../JsonLd";
import { Navbar } from "../components/Navbar";
import { CONTENT_CARD_LINK, CONTENT_GUTTER, CONTENT_H1, CONTENT_TOP } from "../components/contentClasses";
import { SiteFooter } from "../SiteFooter";
import { comparePages } from "@/content/compare-pages";
import { createContentPageJsonLd, createMetadata } from "@/lib/seo";

export const revalidate = 3600;

export const metadata: Metadata = createMetadata({
  path: "/compare",
  title: "Compare Travel eSIMs | eSIM2you",
  description:
    "Factual comparisons of eSIM2you with other travel eSIM providers. Live prices stay on destination pages."
});

export default function CompareHubPage() {
  return (
    <main className="min-h-screen overflow-x-clip bg-surfaceBright text-onSurface">
      <JsonLd
        data={createContentPageJsonLd({
          path: "/compare",
          name: "Compare travel eSIMs",
          description:
            "Factual comparisons of eSIM2you with other travel eSIM providers. Live prices stay on destination pages.",
          breadcrumbName: "Compare"
        })}
      />
      <Navbar />
      <section className={`pb-16 md:pb-24 ${CONTENT_GUTTER} ${CONTENT_TOP}`}>
        <div className="mx-auto max-w-6xl">
          <h1 className={`max-w-4xl ${CONTENT_H1}`}>Compare travel eSIMs</h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-onSurfaceVariant sm:text-lg sm:leading-8">
            These pages compare product features. They do not claim eSIM2you is cheapest. Check live
            eSIM2you prices on each destination page, and the competitor’s site for their current
            offer.
          </p>
          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {comparePages.map((page) => (
              <Link className={CONTENT_CARD_LINK} href={page.path} key={page.path}>
                <h2 className="font-display text-headline-md font-black text-brandInk">{page.heading}</h2>
                <p className="mt-2 text-body-md text-onSurfaceVariant">{page.description}</p>
                <span className="mt-auto inline-flex items-center gap-2 pt-5 text-sm font-black text-brandBlue">
                  Read comparison
                  <ArrowRight
                    aria-hidden="true"
                    className="motion-safe:transition group-hover:translate-x-0.5"
                    size={16}
                  />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
```

- [ ] **Step 6: `/compare/[slug]`**

Replace the whole of `src/app/compare/[slug]/page.tsx` with (everything above `return (` and the `JsonLd` call are byte-identical to HEAD; only imports and the JSX below `<Navbar />` change):

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { JsonLd } from "../../JsonLd";
import { Navbar } from "../../components/Navbar";
import { ContentFaq } from "../../components/ContentFaq";
import {
  CONTENT_GUTTER,
  CONTENT_H1,
  CONTENT_SECTION_H2,
  CONTENT_TEXT_LINK,
  CONTENT_TOP
} from "../../components/contentClasses";
import { SiteFooter } from "../../SiteFooter";
import { comparePages } from "@/content/compare-pages";
import { createContentPageJsonLd, createMetadata } from "@/lib/seo";
import { seoContentUpdatedAt } from "@/lib/esim-routes";
import { getGlobalOffer } from "@/lib/destinationPricing";
import { convertEurToGbp, formatGbp, getGbpRate } from "@/lib/exchangeRate";

export const revalidate = 3600;

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return comparePages.map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = comparePages.find((entry) => entry.slug === slug);
  if (!page) return {};
  return createMetadata({
    path: page.path,
    title: page.title,
    description: page.description
  });
}

export default async function ComparePage({ params }: PageProps) {
  const { slug } = await params;
  const page = comparePages.find((entry) => entry.slug === slug);
  if (!page) notFound();

  const [offer, gbpRate] = await Promise.all([getGlobalOffer(), getGbpRate()]);

  return (
    <main className="min-h-screen overflow-x-clip bg-surface text-onSurface">
      <JsonLd
        data={createContentPageJsonLd({
          path: page.path,
          name: page.heading,
          description: page.description,
          breadcrumbName: page.heading,
          parent: { name: "Compare", path: "/compare" },
          faqs: page.faqs,
          // Editorial comparison, not a product page: no Product/Offer markup here.
          article: { dateModified: seoContentUpdatedAt }
        })}
      />
      <Navbar />
      <article>
        <div className={`rounded-b-[24px] bg-surfaceBright pb-10 lg:pb-14 ${CONTENT_GUTTER} ${CONTENT_TOP}`}>
          <div className="mx-auto max-w-5xl">
            <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-x-2 text-sm font-bold text-onSurfaceVariant">
              <Link className="inline-flex min-h-11 items-center transition hover:text-brandBlue" href="/">
                Home
              </Link>
              <span aria-hidden="true">/</span>
              <Link className="inline-flex min-h-11 items-center transition hover:text-brandBlue" href="/compare">
                Compare
              </Link>
              <span aria-hidden="true">/</span>
              <span aria-current="page" className="text-brandInk">
                {page.heading}
              </span>
            </nav>
            <h1 className={`mt-4 max-w-4xl ${CONTENT_H1}`}>{page.heading}</h1>
            <p className="mt-5 max-w-3xl text-base leading-7 text-onSurfaceVariant sm:text-lg sm:leading-8">
              {page.intro}
            </p>
            {offer ? (
              <p className="mt-5 inline-flex flex-wrap items-center gap-x-1 rounded-full border border-brandBlue/20 bg-brandBlue/5 px-4 py-2 text-sm font-black text-brandBlue">
                eSIM2you plans span €{offer.lowPrice.toFixed(2)}–€{offer.highPrice.toFixed(2)} across
                200+ destinations
                {gbpRate
                  ? ` (~${formatGbp(convertEurToGbp(offer.lowPrice, gbpRate))}–${formatGbp(
                      convertEurToGbp(offer.highPrice, gbpRate)
                    )})`
                  : ""}
              </p>
            ) : null}
          </div>
        </div>

        <div className={`py-10 md:py-16 ${CONTENT_GUTTER}`}>
          <div className="mx-auto max-w-5xl">
            <div className="relative overflow-x-auto rounded-[20px] border border-outline/70 bg-surface shadow-brandCard">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-surfaceBright font-black text-brandInk">
                  <tr>
                    <th className="px-4 py-3" scope="col">
                      Factor
                    </th>
                    <th className="px-4 py-3" scope="col">
                      eSIM2you
                    </th>
                    <th className="px-4 py-3" scope="col">
                      {page.competitor}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {page.rows.map((row) => (
                    <tr className="border-t border-outline/70" key={row.factor}>
                      <th className="px-4 py-3 font-bold text-brandInk" scope="row">
                        {row.factor}
                      </th>
                      <td className="px-4 py-3 text-onSurfaceVariant">{row.esim2you}</td>
                      <td className="px-4 py-3 text-onSurfaceVariant">{row.competitor}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ul className="mt-8 list-disc space-y-2 pl-5 leading-7 text-onSurfaceVariant">
              {page.notes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
            <p className="mt-6">
              <Link className={CONTENT_TEXT_LINK} href="/destinations">
                Browse eSIM2you destinations
                <ArrowRight aria-hidden="true" size={16} />
              </Link>
            </p>
            {page.faqs.length > 0 ? (
              <div className="mt-14">
                <h2 className={CONTENT_SECTION_H2}>FAQ</h2>
                <div className="mt-6">
                  <ContentFaq faqs={page.faqs} />
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </article>
      <SiteFooter />
    </main>
  );
}
```

Notes: the breadcrumb's current item gains `aria-current="page"` (no visible change). The table box is `relative overflow-x-auto` (f195). At 320px the table is 331px wide in a 278px box and scrolls inside it, as before; the page itself doesn't scroll sideways.

- [ ] **Step 7: Tests + types**

Run: `pnpm exec vitest run src/app/content-hubs.test.ts src/lib/seo.test.ts src/app/seo-routes.test.ts` → PASS.
Run: `pnpm test && pnpm exec tsc --noEmit` → **95 files, 709 tests**; tsc clean.

- [ ] **Step 8: Commit (controller)**

```bash
git add src/app/travel/page.tsx src/app/use-cases/page.tsx src/app/compare/page.tsx "src/app/compare/[slug]/page.tsx" src/app/content-hubs.test.ts
git commit -m "feat(content): restyle travel/use-cases/compare hubs and compare articles (44px links, shared FAQ)"
```

---

### Task 4: `LegalDocumentPage` off the retired tokens

**Files:**
- Modify (full rewrite): `src/app/LegalDocumentPage.tsx`
- Test: `src/app/legal-layout.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/app/legal-layout.test.ts`:

```ts
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { RETIRED_COLOR_CLASS } from "./components/retiredTokens";

describe("LegalDocumentPage restyle (spec 8B: off the retired tokens)", () => {
  const source = readFileSync("src/app/LegalDocumentPage.tsx", "utf8");

  it("keeps its slim header, logo, title, date and sections", () => {
    expect(source).toContain('alt="eSim2you app logo"');
    expect(source).toContain('src="/app-logo.png"');
    expect(source).toContain("{landingContent.brand}");
    expect(source).toContain("{document.title}");
    expect(source).toContain("Last updated: {document.lastUpdated}");
    expect(source).toContain("document.sections.map");
    expect(source).toContain("section.paragraphs.map");
    expect(source).toContain("<SiteFooter />");
  });

  it("is on the current tokens only (no midnight, line, cyan, cloud, ink, slate)", () => {
    expect(source).not.toMatch(RETIRED_COLOR_CLASS);
    expect(source).not.toContain("bg-white");
    expect(source).not.toContain("shadow-glow");
    expect(source).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  });

  it("reads as one column of sections in a card, with 44px header links", () => {
    expect(source).toContain('<main className="min-h-screen bg-surfaceBright text-onSurface">');
    expect(source).toContain("max-w-3xl");
    expect(source).toContain("first:border-t-0");
    expect(source.match(/min-h-11/g)?.length).toBeGreaterThanOrEqual(1);
    expect(source).toContain("CONTENT_TEXT_LINK");
  });
});
```

- [ ] **Step 2: Run it to see it fail**

Run: `pnpm exec vitest run src/app/legal-layout.test.ts` → 2 failed, 1 passed.

- [ ] **Step 3: Rewrite the page**

Replace the whole of `src/app/LegalDocumentPage.tsx` with:

```tsx
import Link from "next/link";
import type { LegalDocument } from "@/content/legal";
import { landingContent } from "@/content/landing";
import { CONTENT_EYEBROW, CONTENT_GUTTER, CONTENT_TEXT_LINK } from "./components/contentClasses";
import { SiteFooter } from "./SiteFooter";

type LegalDocumentPageProps = {
  document: LegalDocument;
};

export function LegalDocumentPage({ document }: LegalDocumentPageProps) {
  return (
    <main className="min-h-screen bg-surfaceBright text-onSurface">
      <header className="border-b border-outline/70 bg-surface">
        <nav className={`mx-auto flex h-16 max-w-3xl items-center justify-between lg:h-20 ${CONTENT_GUTTER}`}>
          <Link className="flex min-h-11 items-center gap-3 font-display text-lg font-bold text-brandInk" href="/">
            <img
              alt="eSim2you app logo"
              className="h-9 w-9 rounded-lg"
              src="/app-logo.png"
            />
            {landingContent.brand}
          </Link>
          <Link className={`${CONTENT_TEXT_LINK} text-sm`} href="/">
            Home
          </Link>
        </nav>
      </header>

      <article className={`mx-auto max-w-3xl py-10 md:py-16 ${CONTENT_GUTTER}`}>
        <p className={CONTENT_EYEBROW}>{landingContent.brand}</p>
        <h1 className="mt-3 font-display text-[34px] font-black leading-[1.08] tracking-[-0.03em] text-brandInk md:text-5xl">
          {document.title}
        </h1>
        <p className="mt-3 text-sm font-semibold text-onSurfaceVariant">
          Last updated: {document.lastUpdated}
        </p>

        <div className="mt-8 rounded-[20px] border border-outline/70 bg-surface px-5 shadow-brandCard sm:px-8">
          {document.sections.map((section) => (
            <section className="border-t border-outline/70 py-7 first:border-t-0" key={section.title}>
              <h2 className="font-display text-headline-md font-black text-brandInk">{section.title}</h2>
              <div className="mt-3 space-y-4 text-base leading-8 text-onSurfaceVariant">
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </section>
          ))}
        </div>
      </article>

      <SiteFooter />
    </main>
  );
}
```

Mapping: `bg-cloud` → `bg-surfaceBright`; `text-ink` → `text-onSurface`; `border-line` → `border-outline/70`; `text-midnight` → `text-brandInk`; `text-cyan` eyebrow → `text-label-caps text-brandBlue` (this fixes the 0.96 colour-contrast score); `text-slate-500/600` → `text-onSurfaceVariant`; `shadow-glow` dropped from the logo. The `<img>` keeps its fixed `h-9 w-9` box (no CLS).

- [ ] **Step 4: Tests + types**

Run: `pnpm exec vitest run src/app/legal-layout.test.ts src/app/legal-pages.test.ts src/app/seo-external-factors.test.ts src/app/public-shell.test.ts` → PASS.
Run: `pnpm test && pnpm exec tsc --noEmit` → **96 files, 712 tests**; tsc clean.

- [ ] **Step 5: Commit (controller)**

```bash
git add src/app/LegalDocumentPage.tsx src/app/legal-layout.test.ts
git commit -m "fix(legal): move policy/terms off the retired midnight/line/cyan tokens; readable column"
```

---

### Task 5: `/support`

**Files:**
- Modify: `src/app/support/SupportPageClient.tsx` (imports + everything from `function normalizeSearch` to the end; the `supportCategories` and `faqs` arrays and the types above them stay exactly as they are)
- Test: `src/app/support/support-layout.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/app/support/support-layout.test.ts`:

```ts
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { RETIRED_COLOR_CLASS } from "../components/retiredTokens";

describe("support page restyle (spec 8B)", () => {
  const source = readFileSync("src/app/support/SupportPageClient.tsx", "utf8");

  it("keeps search, topics, FAQ, quick links and contact in the same order", () => {
    const order = ["<SupportHero", "<SupportCategories", "<FaqSection", "<NoResults", "<QuickHelp />", "<ContactSupport />"];
    const positions = order.map((marker) => source.indexOf(marker));
    expect(positions.every((position) => position > 0)).toBe(true);
    expect([...positions].sort((a, b) => a - b)).toEqual(positions);
    expect(source).toContain('id="contact-support"');
    expect(source).toContain('href="#contact-support"');
    expect(source).toContain("href={`mailto:${supportEmail}`}");
  });

  it("lets the FAQ sidebar stick at lg: overflow-x-clip on main, not overflow-hidden (f215)", () => {
    expect(source).toContain('<main className="min-h-screen overflow-x-clip bg-surface text-onSurface">');
    expect(source).not.toContain("min-h-screen overflow-hidden");
    expect(source).toContain("lg:sticky lg:top-6");
  });

  it("has one gradient CTA (Email support); the no-results reset is flat", () => {
    expect(source.match(/<LinkButton/g)).toHaveLength(1);
    expect(source).toContain('<Button className="mt-6" onClick={onClear} size="md" variant="flat">');
  });

  it("gives the search clear button and text links 44px targets", () => {
    expect(source).toContain('aria-label="Clear search"');
    expect(source).toContain("grid h-11 w-11 shrink-0 place-items-center rounded-full");
    expect(source).toContain("min-h-[60px]");
    expect(source).toContain('className="h-11 min-w-0 flex-1 bg-transparent');
    expect(source.match(/CONTENT_TEXT_LINK/g)?.length).toBeGreaterThanOrEqual(3);
    expect(source).toContain("min-h-14");
  });

  it("is on the current tokens only", () => {
    expect(source).not.toMatch(RETIRED_COLOR_CLASS);
    expect(source).not.toContain("bg-white");
    expect(source).not.toContain("text-white");
    expect(source).not.toContain("hero-grid");
    expect(source).not.toMatch(/rgba\(/);
    expect(source).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  });
});
```

- [ ] **Step 2: Run it to see it fail**

Run: `pnpm exec vitest run src/app/support/support-layout.test.ts` → 4 failed, 1 passed.

- [ ] **Step 3: Imports**

In `src/app/support/SupportPageClient.tsx`, directly after `import { Button, LinkButton } from "../components/Button";` insert:

```tsx
import {
  CONTENT_EYEBROW,
  CONTENT_GUTTER,
  CONTENT_H1,
  CONTENT_SECTION_H2,
  CONTENT_TEXT_LINK,
  CONTENT_TOP,
} from "../components/contentClasses";
```

The lucide import list stays as it is (every icon is still used).

- [ ] **Step 4: Render**

Replace everything from the line `function normalizeSearch(value: string) {` to the end of the file with:

```tsx
function normalizeSearch(value: string) {
  return value.trim().toLowerCase();
}

export function SupportPageClient() {
  const [searchQuery, setSearchQuery] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const filteredFaqs = useMemo(() => {
    const query = normalizeSearch(searchQuery);

    if (!query) return faqs;

    return faqs.filter((faq) => {
      return (
        faq.question.toLowerCase().includes(query) ||
        faq.answer.toLowerCase().includes(query) ||
        faq.category.toLowerCase().includes(query)
      );
    });
  }, [searchQuery]);

  const filteredCategories = useMemo(() => {
    const query = normalizeSearch(searchQuery);

    if (!query) return supportCategories;

    return supportCategories.filter((category) => {
      return (
        category.title.toLowerCase().includes(query) ||
        category.description.toLowerCase().includes(query) ||
        category.guidance.some((item) => item.toLowerCase().includes(query))
      );
    });
  }, [searchQuery]);

  const hasSearchResults =
    filteredCategories.length > 0 || filteredFaqs.length > 0;

  return (
    <main className="min-h-screen overflow-x-clip bg-surface text-onSurface">
      <Navbar />

      <SupportHero
        onSearchChange={setSearchQuery}
        searchQuery={searchQuery}
      />

      <section className={`pb-16 md:pb-24 ${CONTENT_GUTTER}`}>
        <div className="mx-auto max-w-6xl">
          {hasSearchResults ? (
            <>
              {filteredCategories.length > 0 ? (
                <SupportCategories
                  categories={filteredCategories}
                  isSearching={Boolean(searchQuery.trim())}
                />
              ) : null}

              {filteredFaqs.length > 0 ? (
                <FaqSection
                  faqs={filteredFaqs}
                  onToggle={setOpenFaq}
                  openFaq={openFaq}
                />
              ) : null}
            </>
          ) : (
            <NoResults
              onClear={() => {
                setSearchQuery("");
                setOpenFaq(0);
              }}
              query={searchQuery}
            />
          )}

          <QuickHelp />

          <ContactSupport />
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}

/** Small caps pill above a section heading (icon + label). */
const EYEBROW_PILL =
  "inline-flex items-center gap-2 rounded-full border border-outline/70 bg-surface px-4 py-2";

/** Icon tile shared by the topic, quick-help and info cards. */
const ICON_TILE =
  "grid shrink-0 place-items-center rounded-[14px] bg-brandBlue/10 text-brandBlue";

type SupportHeroProps = {
  searchQuery: string;
  onSearchChange: (value: string) => void;
};

function SupportHero({
  searchQuery,
  onSearchChange,
}: SupportHeroProps) {
  return (
    <section
      className={`relative isolate mb-10 overflow-hidden rounded-b-[24px] bg-surfaceBright pb-12 md:mb-14 md:pb-16 ${CONTENT_GUTTER} ${CONTENT_TOP}`}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[360px] w-[720px] max-w-none -translate-x-1/2 rounded-full bg-brandBlue/10 blur-[120px]"
      />

      <div className="mx-auto max-w-[960px] pt-4 text-center lg:pt-8">
        <div className={EYEBROW_PILL}>
          <LifeBuoy
            aria-hidden="true"
            className="text-brandBlue"
            size={15}
          />

          <span className={CONTENT_EYEBROW}>
            eSim2you Help Center
          </span>
        </div>

        <h1 className={`mt-5 ${CONTENT_H1}`}>
          Help for your eSIM journey
        </h1>

        <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-onSurfaceVariant">
          Find help for sign-in, checkout, QR or manual setup, remaining data,
          top-ups, refunds, and connection troubleshooting.
        </p>

        <div className="relative mx-auto mt-8 max-w-[720px]">
          <div className="rounded-[20px] border border-outline bg-surface p-2 shadow-brandCard">
            <label className="flex min-h-[60px] items-center gap-3 rounded-[15px] bg-outline/10 px-4">
              <Search
                aria-hidden="true"
                className="shrink-0 text-brandBlue"
                size={20}
              />

              <span className="sr-only">Search the help center</span>

              <input
                autoComplete="off"
                className="h-11 min-w-0 flex-1 bg-transparent text-base font-semibold text-brandInk outline-none placeholder:text-onSurfaceVariant"
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder="Search sign-in, setup, checkout, top-up..."
                type="search"
                value={searchQuery}
              />

              {searchQuery ? (
                <button
                  aria-label="Clear search"
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-onSurfaceVariant transition hover:bg-brandBlue/10 hover:text-brandInk"
                  onClick={() => onSearchChange("")}
                  type="button"
                >
                  <X aria-hidden="true" size={18} />
                </button>
              ) : (
                <span className="hidden rounded-full border border-outline/70 bg-surface px-3 py-1.5 text-label-caps uppercase text-onSurfaceVariant sm:inline-flex">
                  Help
                </span>
              )}
            </label>
          </div>

          <p className="mt-4 text-body-sm text-onSurfaceVariant">
            Popular: install, no internet, checkout, refund, delete account
          </p>
        </div>
      </div>
    </section>
  );
}

type SupportCategoriesProps = {
  categories: SupportCategory[];
  isSearching: boolean;
};

function SupportCategories({
  categories,
  isSearching,
}: SupportCategoriesProps) {
  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className={CONTENT_EYEBROW}>
            {isSearching ? "Matching topics" : "Browse by topic"}
          </p>

          <h2 className={`mt-2 ${CONTENT_SECTION_H2}`}>
            Find the help you need
          </h2>
        </div>

        <p className="max-w-md text-body-md text-onSurfaceVariant">
          These topics mirror current website flows, so the guidance matches
          what you can do in eSim2you today.
        </p>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {categories.map((category) => {
          const Icon = category.icon;

          return (
            <article
              className="rounded-[20px] border border-outline/70 bg-surface p-5 shadow-brandCard transition hover:border-brandBlue/50 sm:p-6"
              key={category.title}
            >
              <div className="flex items-start justify-between gap-5">
                <span className={`h-12 w-12 ${ICON_TILE}`}>
                  <Icon aria-hidden={true} size={24} strokeWidth={2} />
                </span>

                <span className="mt-1 rounded-full border border-outline/70 bg-surfaceBright px-3 py-1.5 text-label-caps uppercase text-onSurfaceVariant">
                  On the website
                </span>
              </div>

              <h3 className="mt-5 font-display text-headline-md font-black text-brandInk">
                {category.title}
              </h3>

              <p className="mt-2 text-sm leading-6 text-onSurfaceVariant md:min-h-[90px]">
                {category.description}
              </p>

              <div className="mt-5 border-t border-outline/70 pt-5">
                <ul className="space-y-3">
                  {category.guidance.map((item) => (
                    <li
                      className="flex items-start gap-3 text-sm leading-6 text-onSurfaceVariant"
                      key={item}
                    >
                      <CheckCircle2
                        aria-hidden="true"
                        className="mt-0.5 shrink-0 text-brandBlue"
                        size={16}
                      />

                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

type FaqSectionProps = {
  faqs: FaqItem[];
  openFaq: number | null;
  onToggle: (index: number | null) => void;
};

function FaqSection({
  faqs,
  openFaq,
  onToggle,
}: FaqSectionProps) {
  return (
    <section className="mt-16 md:mt-24">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,0.72fr)_minmax(0,1.28fr)] lg:items-start lg:gap-16">
        <div className="lg:sticky lg:top-6">
          <div className={EYEBROW_PILL}>
            <CircleHelp
              aria-hidden="true"
              className="text-brandBlue"
              size={14}
            />

            <span className={CONTENT_EYEBROW}>
              Common questions
            </span>
          </div>

          <h2 className={`mt-4 ${CONTENT_SECTION_H2}`}>
            Frequently asked questions
          </h2>

          <p className="mt-3 max-w-md text-body-md text-onSurfaceVariant">
            Quick answers about sign-in, setup, connectivity, checkout, plan data,
            refunds, and account management.
          </p>

          <div className="mt-6 rounded-[18px] border border-outline/70 bg-surfaceBright p-5">
            <div className="flex items-start gap-4">
              <span className={`h-11 w-11 ${ICON_TILE}`}>
                <MessageCircle aria-hidden="true" size={20} />
              </span>

              <div>
                <p className="text-sm font-black text-brandInk">
                  Still have a question?
                </p>

                <p className="mt-1 text-body-sm text-onSurfaceVariant">
                  Email support with your order details, destination,
                  device model, and the screen where you are stuck.
                </p>

                <a
                  className={`mt-1 text-sm ${CONTENT_TEXT_LINK}`}
                  href="#contact-support"
                >
                  Contact support

                  <ArrowRight aria-hidden="true" size={14} />
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, index) => {
            const isOpen = openFaq === index;

            return (
              <article
                className={[
                  "overflow-hidden rounded-[16px] border transition",
                  isOpen
                    ? "border-brandBlue/40 bg-brandBlue/5"
                    : "border-outline/70 bg-surface hover:border-brandBlue/40",
                ].join(" ")}
                key={`${faq.category}-${faq.question}`}
              >
                <button
                  aria-expanded={isOpen}
                  className="flex min-h-14 w-full items-center justify-between gap-5 px-5 py-4 text-left sm:px-6"
                  onClick={() => onToggle(isOpen ? null : index)}
                  type="button"
                >
                  <div>
                    <span className="text-label-caps uppercase text-brandBlue">
                      {faq.category}
                    </span>

                    <h3 className="mt-1 text-title-sm font-black text-brandInk">
                      {faq.question}
                    </h3>
                  </div>

                  <span
                    className={[
                      "grid h-9 w-9 shrink-0 place-items-center rounded-full border motion-safe:transition",
                      isOpen
                        ? "rotate-180 border-brandBlue/40 bg-brandBlue/10 text-brandBlue"
                        : "border-outline/70 bg-surfaceBright text-onSurfaceVariant",
                    ].join(" ")}
                  >
                    <ChevronDown aria-hidden="true" size={17} />
                  </span>
                </button>

                <div
                  className={[
                    "grid motion-safe:transition-[grid-template-rows,opacity] motion-safe:duration-300",
                    isOpen
                      ? "grid-rows-[1fr] opacity-100"
                      : "grid-rows-[0fr] opacity-0",
                  ].join(" ")}
                >
                  <div className="overflow-hidden">
                    <p className="border-t border-outline/70 px-5 py-5 text-sm leading-7 text-onSurfaceVariant sm:px-6">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function QuickHelp() {
  const items = [
    {
      icon: Download,
      title: "Installation guide",
      description:
        "Read the public setup guide, then use your account for exact QR or manual setup details.",
      label: "View guide",
      href: "/travel/how-to-install-esim",
    },
    {
      icon: Globe2,
      title: "Browse destinations",
        description:
        "Compare available destination plans before you buy on the eSim2you website.",
      label: "Browse plans",
      href: "/destinations",
    },
    {
      icon: BookOpen,
      title: "How eSIM works",
      description:
        "Learn the basics of digital SIM profiles, compatibility, and travel data.",
      label: "Learn more",
      href: "/travel/what-is-an-esim",
    },
  ];

  return (
    <section className="mt-16 md:mt-24">
      <div className="text-center">
        <p className={CONTENT_EYEBROW}>
          Quick access
        </p>

        <h2 className={`mt-2 ${CONTENT_SECTION_H2}`}>
          Useful before you travel
        </h2>
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        {items.map((item) => {
          const Icon = item.icon;

          return (
            <article
              className="group flex items-start gap-4 rounded-[20px] border border-outline/70 bg-surface p-5 shadow-brandCard transition hover:border-brandBlue/50"
              key={item.title}
            >
              <span className={`h-12 w-12 ${ICON_TILE}`}>
                <Icon aria-hidden={true} size={22} />
              </span>

              <div className="min-w-0">
                <h3 className="text-title-sm font-black text-brandInk">{item.title}</h3>

                <p className="mt-1 text-body-sm text-onSurfaceVariant">
                  {item.description}
                </p>

                <Link
                  className={`mt-1 text-sm ${CONTENT_TEXT_LINK}`}
                  href={item.href}
                >
                  {item.label}

                  <ArrowRight
                    aria-hidden="true"
                    className="motion-safe:transition group-hover:translate-x-1"
                    size={14}
                  />
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function ContactSupport() {
  return (
    <section
      className="relative mt-16 overflow-hidden rounded-[24px] border border-outline/70 bg-surface px-5 py-8 shadow-brandCard sm:px-9 md:mt-24 lg:px-12 lg:py-12"
      id="contact-support"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 -top-24 h-80 w-80 rounded-full bg-brandBlue/10 blur-[90px]"
      />

      <div className="relative grid items-center gap-8 lg:grid-cols-[1fr_0.85fr] lg:gap-10">
        <div className="min-w-0">
          <div className={EYEBROW_PILL}>
            <Headphones
              aria-hidden="true"
              className="text-brandBlue"
              size={14}
            />

            <span className={CONTENT_EYEBROW}>
              Human support
            </span>
          </div>

          <h2 className={`mt-4 max-w-xl ${CONTENT_SECTION_H2}`}>
            Still need help with your eSIM?
          </h2>

          <p className="mt-3 max-w-xl text-sm leading-7 text-onSurfaceVariant">
            Send your order details, destination, phone model, and a
            screenshot or description of the issue. We will help with
            installation, activation, connectivity, payments, or refund
            review.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            {/* The page's one gradient CTA. It wraps on narrow phones, so it grows instead of clipping. */}
            <LinkButton className="!h-auto min-h-[54px] max-w-full flex-wrap py-2" href={`mailto:${supportEmail}`} size="lg">
              <Mail aria-hidden="true" size={17} />

              <span>Email support</span>
              <span className="break-all text-xs text-surface/80">esim2you@uplisoft.com</span>
            </LinkButton>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          <SupportInfo
            description="Most questions are answered within one business day."
            icon={Clock3}
            title="Fast response"
          />

          <SupportInfo
            description="Help with installation, connection, plans, payments, and refunds."
            icon={LifeBuoy}
            title="Complete assistance"
          />

          <SupportInfo
            description="Your account and payment details stay protected with secure sign-in."
            icon={KeyRound}
            title="Secure by design"
          />

          <SupportInfo
            description="Profile includes a signed-in flow to delete your account from the website."
            icon={Trash2}
            title="Account control"
          />
        </div>
      </div>
    </section>
  );
}

type SupportInfoProps = {
  title: string;
  description: string;
  icon: ComponentType<{
    size?: number;
    className?: string;
    strokeWidth?: number;
    "aria-hidden"?: boolean;
  }>;
};

function SupportInfo({
  title,
  description,
  icon: Icon,
}: SupportInfoProps) {
  return (
    <div className="flex items-start gap-4 rounded-[16px] border border-outline/70 bg-surfaceBright p-4">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[12px] bg-surface text-brandBlue">
        <Icon aria-hidden={true} size={18} />
      </span>

      <div className="min-w-0">
        <p className="text-sm font-black text-brandInk">{title}</p>

        <p className="mt-1 text-body-sm text-onSurfaceVariant">
          {description}
        </p>
      </div>
    </div>
  );
}

type NoResultsProps = {
  query: string;
  onClear: () => void;
};

function NoResults({ query, onClear }: NoResultsProps) {
  return (
    <div className="mx-auto max-w-2xl rounded-[24px] border border-outline/70 bg-surfaceBright px-5 py-12 text-center sm:px-6">
      <span className="mx-auto grid h-16 w-16 place-items-center rounded-[20px] bg-surface text-brandBlue">
        <HelpCircle aria-hidden="true" size={29} />
      </span>

      <h2 className="mt-6 font-display text-headline-md font-black text-brandInk">
        No support results found
      </h2>

      <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-onSurfaceVariant">
        We could not find anything matching “{query}”. Try a shorter
        search or browse all support topics.
      </p>

      {/* Flat: Email support below stays the page's one gradient CTA. */}
      <Button className="mt-6" onClick={onClear} size="md" variant="flat">
        <Sparkles aria-hidden="true" size={16} />

        View all help topics
      </Button>
    </div>
  );
}
```

Logic is untouched: `normalizeSearch`, both `useMemo` filters, `hasSearchResults`, the `openFaq` toggle, the NoResults reset and `QuickHelp`'s items are copied verbatim (including the odd indentation of one `description:` line). Every visible string is unchanged.

- [ ] **Step 5: Tests + types**

Run: `pnpm exec vitest run src/app/support` → PASS (2 files, 7 tests).
Run: `pnpm test && pnpm exec tsc --noEmit` → **97 files, 717 tests**; tsc clean.

- [ ] **Step 6: Commit (controller)**

```bash
git add src/app/support/SupportPageClient.tsx src/app/support/support-layout.test.ts
git commit -m "feat(support): restyle the help center on the app tokens; 44px targets, one gradient, sticky FAQ intro"
```

---

### Task 6: Full verification (no source changes)

**Files:** none in the repo. Scratch scripts go **outside the repo** (e.g. `$SCRATCH=/private/tmp/<session>/scratchpad`): `content-snapshot.cjs`, `snap-diff.cjs`, `content-matrix.cjs`. Nothing here talks to the backend from the browser; `pnpm build` reads the public catalog as every earlier phase did.

- [ ] **Step 1: Tests + types**

Run: `pnpm test && pnpm exec tsc --noEmit`
Expected: **97 files, 717 tests** (baseline 92 / 694: +5 primitives, +4 SEO page, +6 hubs, +3 legal, +5 support); tsc clean. Real tree with the owner's WIP: 97 files, **716 passed, 1 failed** (`src/content/landing.test.ts`, alt text: the owner's homepage WIP, not this phase).

- [ ] **Step 2: Production build: route types unchanged**

Run: `pnpm build`. Expected (dry run in brackets), **every type unchanged**:
- `○ /travel` [136 B / 117 kB], `● /travel/[slug]` [136 B / 117 kB];
- `○ /use-cases` [137 B / 117 kB], `● /use-cases/[slug]` [136 B / 117 kB];
- `○ /compare` [137 B / 117 kB, revalidate 1h], `● /compare/[slug]` [137 B / 117 kB, revalidate 1h];
- `○ /policy`, `○ /terms` [387 B / 114 kB];
- `○ /support` [8.59 kB → 8.49 kB / 147 kB];
- `○ /` unchanged [7.28 kB / 215 kB].

- [ ] **Step 3: JSON-LD, copy and links are byte-identical**

Save as `$SCRATCH/content-snapshot.cjs`:

```js
// Prints, per prerendered content page: its JSON-LD blocks, its visible text (tags stripped)
// and its link hrefs, so a before/after diff proves "no copy, link or JSON-LD change".
// Run from the repo root after `pnpm build`: node content-snapshot.cjs > snap.json
const fs = require("fs");
const path = require("path");
const root = path.join(process.cwd(), ".next/server/app");
const files = [];
for (const top of ["travel", "use-cases", "compare", "policy", "terms", "support"]) {
  if (fs.existsSync(path.join(root, `${top}.html`))) files.push(`${top}.html`);
  const dir = path.join(root, top);
  if (fs.existsSync(dir)) for (const f of fs.readdirSync(dir)) if (f.endsWith(".html")) files.push(`${top}/${f}`);
}
const out = {};
let blocks = 0;
for (const f of files.sort()) {
  const html = fs.readFileSync(path.join(root, f), "utf8");
  const body = html.slice(html.indexOf("<body"), html.lastIndexOf("</body>"));
  const jsonLd = [...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
  blocks += jsonLd.length;
  const text = body
    .replace(/<script[\s\S]*?<\/script>/g, " ")
    .replace(/<style[\s\S]*?<\/style>/g, " ")
    .replace(/<svg[\s\S]*?<\/svg>/g, " ")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const hrefs = [...body.matchAll(/<a\b[^>]*\bhref="([^"]*)"/g)].map((m) => m[1]);
  out["/" + f.replace(/\.html$/, "")] = { jsonLd, text, hrefs };
}
console.error(`${files.length} routes, ${blocks} JSON-LD blocks`);
process.stdout.write(JSON.stringify(out, null, 1));
```

Save as `$SCRATCH/snap-diff.cjs`:

```js
// Compares two content-snapshot.cjs outputs: JSON-LD must be byte-identical; visible text
// and link hrefs must match. Usage: node snap-diff.cjs before.json after.json
const [a, b] = process.argv.slice(2).map((f) => require(require("path").resolve(f)));
let bad = 0;
for (const route of new Set([...Object.keys(a), ...Object.keys(b)])) {
  if (!a[route] || !b[route]) { console.log(`ROUTE ${route}: only in ${a[route] ? "before" : "after"}`); bad++; continue; }
  for (const key of ["jsonLd", "text", "hrefs"]) {
    const x = JSON.stringify(a[route][key]);
    const y = JSON.stringify(b[route][key]);
    if (x !== y) {
      bad++;
      let i = 0;
      while (i < x.length && x[i] === y[i]) i++;
      console.log(`${key.toUpperCase()} ${route} differs at ${i}:\n  before …${x.slice(Math.max(0, i - 60), i + 80)}\n  after  …${y.slice(Math.max(0, i - 60), i + 80)}`);
    }
  }
}
console.log(bad ? `${bad} difference(s)` : `identical: ${Object.keys(a).length} routes (JSON-LD, text, hrefs)`);
process.exit(bad ? 1 : 0);
```

- **3a (before Task 2):** after a `pnpm build` of the pre-Task-2 tree, `node $SCRATCH/content-snapshot.cjs > $SCRATCH/snap-before.json` → `32 routes, 32 JSON-LD blocks`. (If it was skipped: build the Task 1 commit (the last commit before Task 2) in a scratch copy via `git archive <sha> | tar -x -C <dir>` + a `node_modules` symlink, and run it there.)
- **3b (now):** `node $SCRATCH/content-snapshot.cjs > $SCRATCH/snap-after.json && node $SCRATCH/snap-diff.cjs $SCRATCH/snap-before.json $SCRATCH/snap-after.json`
- Expected: `identical: 32 routes (JSON-LD, text, hrefs)`. Caveat: `/compare/<slug>` text includes the live global price range (`getGlobalOffer`) and GBP rate; if the catalog or rate changed between the two builds, the diff reports only those numbers in `TEXT /compare/...`. JSON-LD there has no prices (f196), so it must still be identical.

- [ ] **Step 4: Server + browser matrix**

```bash
pnpm exec next start -p 3108 &
```

Save as `$SCRATCH/content-matrix.cjs`:

```js
// Layout matrix for the public content pages (web UI polish phase 8). Read-only: no
// cookies besides a "no tracking" consent choice, every request that isn't the local app
// is aborted (fonts are self-hosted), and so is every /bff/** call. Nothing is submitted.
// The only interaction is typing into the /support search box (client-side filter).
// Run: BASE=http://localhost:3108 OUT=./shots node content-matrix.cjs
const pw = require(process.env.PW || require("child_process").execSync("ls -d ~/.npm/_npx/*/node_modules/playwright-core | tail -1", { shell: "/bin/zsh" }).toString().trim());
const fs = require("fs");

const BASE = process.env.BASE || "http://localhost:3108";
const OUT = process.env.OUT || __dirname + "/shots";
const WIDTHS = (process.env.WIDTHS || "320,375,768,1024,1440").split(",").map(Number);
fs.mkdirSync(OUT, { recursive: true });

const PAGES = [
  "/travel",
  "/travel/how-to-install-esim",
  "/use-cases/business-travel",
  "/compare/airalo-vs-esim2you",
  "/policy",
  "/terms",
  "/support",
  // Hubs not in the brief's list, cheap to include:
  "/use-cases",
  "/compare",
];

async function context(browser, width) {
  const ctx = await browser.newContext({
    viewport: { width, height: width < 768 ? 740 : 900 },
    isMobile: width < 768,
    hasTouch: width < 1024,
    deviceScaleFactor: 1,
  });
  const url = new URL(BASE);
  await ctx.addCookies([
    { name: "esim2you_consent", value: encodeURIComponent(JSON.stringify({ version: 1, analytics: false, marketing: false })), domain: url.hostname, path: "/" },
  ]);
  await ctx.addInitScript(() => {
    window.__cls = 0;
    window.__src = [];
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) {
        if (e.hadRecentInput) continue;
        window.__cls += e.value;
        window.__src.push(e.value.toFixed(4) + " " + e.sources.map((x) => (x.node ? x.node.nodeName + "." + String(x.node.className || "").slice(0, 40) : "?")).join(" | "));
      }
    }).observe({ type: "layout-shift", buffered: true });
  });
  await ctx.route("**/*", (route) => {
    const u = new URL(route.request().url());
    if (u.origin !== url.origin) return route.abort();
    if (u.pathname.startsWith("/bff/")) return route.abort();
    return route.continue();
  });
  return ctx;
}

const measure = () => {
  const de = document.documentElement;
  const main = document.querySelector("main");
  const visible = (el) => !!el && el.getClientRects().length > 0 && getComputedStyle(el).visibility !== "hidden";
  // Shell = the floating Navbar header (absolute), the dock and the footer. The legal page's own
  // slim header is NOT shell: its links are measured.
  const inShell = (el) => el.closest("main > header.absolute") || el.closest("footer") || el.closest("[data-bottom-dock]");
  const label = (el) => (el.getAttribute("aria-label") || el.textContent || el.id || "").trim().replace(/\s+/g, " ").slice(0, 32);
  const controls = [...main.querySelectorAll("a,button,input,select,summary")].filter((el) => visible(el) && !inShell(el));
  return {
    cls: Number((window.__cls || 0).toFixed(4)),
    clsSrc: window.__src,
    noHScroll: de.scrollWidth === de.clientWidth,
    sw: de.scrollWidth,
    gradients: controls.filter((el) => getComputedStyle(el).backgroundImage.includes("gradient")).map(label),
    small: controls
      .filter((el) => el.getBoundingClientRect().height < 44)
      .map((el) => `${el.tagName.toLowerCase()}:${label(el)}=${Math.round(el.getBoundingClientRect().height)}`),
    innerScrollers: [...main.querySelectorAll("*")]
      .filter((el) => visible(el) && !inShell(el) && ["auto", "scroll"].includes(getComputedStyle(el).overflowX) && el.scrollWidth > el.clientWidth)
      .map((el) => `${el.tagName.toLowerCase()} ${el.scrollWidth}/${el.clientWidth}`),
    dock: visible(document.querySelector("[data-bottom-dock]")),
    h1: (document.querySelector("main h1")?.textContent || "").trim().slice(0, 40),
  };
};

(async () => {
  const browser = await pw.chromium.launch({ headless: true });
  const results = {};
  const issues = [];

  for (const path of PAGES) {
    for (const w of WIDTHS) {
      const ctx = await context(browser, w);
      const tab = await ctx.newPage();
      const response = await tab.goto(BASE + path, { waitUntil: "load" });
      await tab.waitForTimeout(1200);
      const r = { status: response.status(), ...(await tab.evaluate(measure)) };
      const name = `${path.replace(/\//g, "_").replace(/^_/, "")}-${w}`;
      await tab.screenshot({ path: `${OUT}/${name}.png`, fullPage: true });

      // The support FAQ intro sticks beside the question list at lg (needs main overflow-x-clip, f215).
      if (w >= 1024 && path === "/support") {
        const selector = "section .lg\\:sticky";
        r.stickyTopAfterScroll = await tab.evaluate(async (sel) => {
          const el = document.querySelector(sel);
          if (!el) return null;
          const parent = el.parentElement.getBoundingClientRect();
          // globals.css sets scroll-behavior: smooth; jump instead of animating.
          window.scrollTo({ top: window.scrollY + parent.top + 120, behavior: "instant" });
          await new Promise((resolve) => setTimeout(resolve, 200));
          return Math.round(el.getBoundingClientRect().top);
        }, selector);
      }
      results[name] = r;
      if (r.status !== 200) issues.push(`${name}: HTTP ${r.status}`);
      if (!r.noHScroll) issues.push(`${name}: horizontal scroll (${r.sw})`);
      if (r.cls > 0) issues.push(`${name}: CLS ${r.cls} ${r.clsSrc.join("; ")}`);
      if (r.gradients.length > 1) issues.push(`${name}: ${r.gradients.length} gradients ${r.gradients.join(", ")}`);
      if (r.small.length) issues.push(`${name}: small ${r.small.join(", ")}`);
      await ctx.close();
    }
  }

  // /support search: a query that matches nothing shows NoResults (flat reset), a real one filters.
  for (const [query, w] of [["zzzz", 320], ["zzzz", 1440], ["refund", 375]]) {
    const ctx = await context(browser, w);
    const tab = await ctx.newPage();
    await tab.goto(BASE + "/support", { waitUntil: "load" });
    await tab.waitForTimeout(800);
    // Real key presses, so the filter's re-layout counts as input-driven (hadRecentInput), as for a user.
    await tab.click('input[type="search"]');
    await tab.keyboard.type(query, { delay: 30 });
    await tab.waitForTimeout(400);
    const r = await tab.evaluate(measure);
    r.noResults = await tab.evaluate(() => document.body.innerText.includes("No support results found"));
    r.faqCount = await tab.evaluate(() => document.querySelectorAll("main article button[aria-expanded]").length);
    results[`support-search-${query}-${w}`] = r;
    await tab.screenshot({ path: `${OUT}/support-search-${query}-${w}.png`, fullPage: true });
    if (r.gradients.length > 1) issues.push(`support-search-${query}-${w}: ${r.gradients.join(", ")}`);
    if (r.small.length) issues.push(`support-search-${query}-${w}: small ${r.small.join(", ")}`);
    if (!r.noHScroll) issues.push(`support-search-${query}-${w}: horizontal scroll`);
    await ctx.close();
  }

  await browser.close();
  fs.writeFileSync(`${OUT}/results.json`, JSON.stringify(results, null, 1));
  const rows = Object.entries(results).map(([k, r]) => `${k.padEnd(40)} cls=${r.cls} h=${r.noHScroll ? "ok" : r.sw} grad=[${r.gradients.join("|")}] small=${r.small.length} dock=${r.dock}${r.stickyTopAfterScroll !== undefined ? ` sticky=${r.stickyTopAfterScroll}` : ""}${r.innerScrollers.length ? ` inner=[${r.innerScrollers.join("|")}]` : ""}${r.noResults !== undefined ? ` noResults=${r.noResults} faqs=${r.faqCount}` : ""}`);
  console.log(rows.join("\n"));
  console.log(issues.length ? `\n${issues.length} ISSUE(S):\n` + issues.join("\n") : `\n0 issues across ${Object.keys(results).length} checks`);
  process.exit(issues.length ? 1 : 0);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
```

Run: `BASE=http://localhost:3108 OUT=$SCRATCH/shots node $SCRATCH/content-matrix.cjs`

Expected (all observed in the dry run): last line `0 issues across 48 checks`, and:

| Page × width | Check | Expected |
|---|---|---|
| all 9 pages × 320/375/768/1024/1440 | horizontal page scroll | none (`scrollWidth === clientWidth`, 45/45) |
| all | CLS (layout-shift observer, 1.2s) | 0 |
| all | controls < 44px in `main` (a, button, input, select, summary; outside the Navbar header, dock, footer) | none (baseline: 35 issue rows) |
| `/travel/<slug>`, `/use-cases/<slug>` | gradients | `Download eSim2you on the App Store` only |
| `/support` (also after typing `zzzz` at 320/1440 and `refund` at 375) | gradients | `Email support…` only (baseline `zzzz`: 2) |
| hubs, `/compare/<slug>`, `/policy`, `/terms` | gradients | none |
| `/support` 1024 / 1440 | FAQ intro sticky | `sticky=24` |
| `/support` `zzzz` / `refund` | search filter | `noResults=true faqs=0` / `noResults=false faqs=1` (CLS 0 with real key presses) |
| phones/tablets | dock | present on every page except `/policy`, `/terms` (own header, Decisions) |
| `/compare/<slug>` 320 | inner scroller | `inner=[div 331/278]`: the table scrolls inside its box only |

Look at the screenshots too: `travel_how-to-install-esim-375` (hero band, stacked cards, Related panel under them, FAQ), `support-1440` (topic grid, sticky FAQ intro, quick links, contact card), `policy-375` (one readable column in a card), `compare_airalo-vs-esim2you-320` (breadcrumb, table box). In full-page phone shots the fixed dock is drawn where the viewport ended; that's a screenshot artifact.

- [ ] **Step 5: Lighthouse (mobile)**

```bash
CONS=$(node -e 'process.stdout.write(encodeURIComponent(JSON.stringify({version:1,analytics:false,marketing:false})))')
LH=$(ls -d ~/.npm/_npx/*/node_modules/.bin/lighthouse | head -1)
for p in support policy travel/how-to-install-esim; do
  n=$(echo $p | tr / _)
  $LH http://localhost:3108/$p --only-categories=accessibility,performance --form-factor=mobile \
    --chrome-flags="--headless=new" --extra-headers="{\"Cookie\":\"esim2you_consent=$CONS\"}" \
    --output=json --output-path=$SCRATCH/lh-$n.json --quiet
  node -e 'const r=require(process.argv[1]);const a=r.audits;console.log(process.argv[2],"a11y",r.categories.accessibility.score,"CLS",a["cumulative-layout-shift"].numericValue.toFixed(3),"LCP",Math.round(a["largest-contentful-paint"].numericValue))' $SCRATCH/lh-$n.json $p
done
```

Run twice, sequentially (not while a build runs). Expected: **a11y 1 and CLS 0.000 on all three** [dry run: `/support` 1 / 1, LCP 3457–3458 ms (baseline 3457); `/policy` 1 / 1 (baseline **0.96**), LCP 2760 (2762); travel 1 / 1, LCP 2611–2614 (2611)].

- [ ] **Step 6: Stop the server**

`kill %1` (or `pkill -f "next start -p 3108"`).

- [ ] **Step 7: Manual check (optional)**

On a real phone: `/support` search with the iOS keyboard open (the field is 60px, the input 44px), FAQ open/close with VoiceOver (`aria-expanded`), `/policy` reading width, and a `/travel/<slug>` FAQ `<details>` with VoiceOver.

---

### Task 7: Knowledge + session log (repo rules)

**Files:**
- Modify: `feedAI/facts.jsonl` (append), `feedAI/topics/public-content-pages.json`, `feedAI/topics/ui-components-styling.json`, `feedAI/brain.json`, `docs/sessions/INDEX.md`, `docs/overview.md`
- Create: `docs/sessions/2026-10-01_web-ui-polish-content.md`

- [ ] **Step 1: Append facts**

Check the next free id with `tail -1 feedAI/facts.jsonl | cut -c1-20`. It was `f223` when this plan was written, so use `f224`–`f226` (shift them if phase 7 landed first).

```json
{"id": "f224", "date": "2026-10-01", "kind": "decision", "topic": "public-content-pages", "fact": "Content pages (phase 8 of the mobile-parity redesign, spec 8B: same structure, new styling): SeoContentPage (/travel/*, /use-cases/*), the /travel, /use-cases, /compare hubs, /compare/[slug], LegalDocumentPage and /support share src/app/components/contentClasses.ts (CONTENT_TOP pt-[92px] lg:pt-[100px] under the absolute Navbar capsule, CONTENT_GUTTER px-5 md:px-8, 20px outline/70 cards, surfaceBright hero bands/panels, min-h-11 row and text links) and ContentFaq (server <details> list, same markup as /esim/[slug]). Related panel stacks below lg and is not sticky (guide section columns are ~316px tall). Hubs are whole-card links on bg-surfaceBright, 1/2/3 columns. JSON-LD, copy and hrefs of all 32 prerendered content routes were proven byte-identical before/after (content-snapshot.cjs in the phase-8 plan, Task 6).", "source": "src/app/components/{contentClasses.ts,ContentFaq.tsx}; src/app/SeoContentPage.tsx; src/app/{travel,use-cases,compare}/page.tsx; src/app/compare/[slug]/page.tsx; docs/superpowers/plans/2026-10-01-web-ui-polish-phase8-content.md"}
{"id": "f225", "date": "2026-10-01", "kind": "fix", "topic": "public-content-pages", "fact": "LegalDocumentPage (/policy, /terms) used the retired midnight/line/cyan/cloud/ink tokens plus slate greys; its text-cyan eyebrow failed contrast (Lighthouse a11y 0.96). It is now on surface/brandInk/onSurfaceVariant/outline tokens with a max-w-3xl column and the sections in one card (a11y 1.0). It deliberately keeps its own slim logo + Home header (no Navbar, so no phone dock on legal pages); legal-pages.test.ts and seo-external-factors.test.ts pin the header's /app-logo.png and alt text. RETIRED_COLOR_CLASS (src/app/components/retiredTokens.ts) is the regex tests use to keep converted files off the old palette (incl. mist -> surfaceBright).", "source": "src/app/LegalDocumentPage.tsx; src/app/components/retiredTokens.ts; src/app/legal-layout.test.ts"}
{"id": "f226", "date": "2026-10-01", "kind": "invariant", "topic": "public-content-pages", "fact": "/support (SupportPageClient): <main> must be overflow-x-clip (was overflow-hidden, which silently disabled the FAQ intro's sticky, f215); the FAQ intro is lg:sticky lg:top-6. Exactly one gradient CTA in every search state: Email support (the no-results 'View all help topics' reset is variant=flat). Targets: search input h-11 inside a 60px field, Clear search h-11 w-11, text links min-h-11 (CONTENT_TEXT_LINK), FAQ buttons min-h-14. The Email support LinkButton uses !h-auto min-h-[54px] flex-wrap so the wrapped address isn't clipped at 320px. Support data arrays (f041) unchanged.", "source": "src/app/support/SupportPageClient.tsx; src/app/support/support-layout.test.ts"}
```

- [ ] **Step 2: Topics, session, index, brain sync, overview**

- **`feedAI/topics/public-content-pages.json`:** add `f224`, `f225`, `f226` to `facts`; in `support_page` and `legal_pages` add a `"layout_2026_10"` line each (shared content classes, sticky FAQ intro + one gradient / own slim header + sections card); in `seo_content_pages` add `"styling": "contentClasses.ts + ContentFaq (f224)"`.
- **`feedAI/topics/ui-components-styling.json`:** add `f224`; under shared components add `"content_pages": "contentClasses.ts (class strings), ContentFaq.tsx, retiredTokens.ts (test regex)"`.
- **Session log:** write `docs/sessions/2026-10-01_web-ui-polish-content.md` in the shape of `2026-10-01_web-ui-polish-account.md` (Goal, What changed, Decisions, Verification, Owner WIP, Commits, Next), with the stage counts, the build lines, the JSON-LD/text/href diff result, the matrix (35 → 0 issues) and Lighthouse numbers, "no changed assertions", and the legal-header decision.
- **`docs/sessions/INDEX.md`:** append
  `| 2026-10-01 | [Web UI polish: content pages](./2026-10-01_web-ui-polish-content.md) | Phase 8: SeoContentPage, hubs, compare, legal (off retired tokens) and /support restyled on the app card language; JSON-LD/copy byte-identical; 44px targets, one gradient; 717 tests. |`
- **`feedAI/brain.json`:** set `sync.date` to `2026-10-01`; prepend `f224-f226: content pages B (contentClasses, ContentFaq, legal token fix, support sticky/one gradient); next = partner pages on AccountShell.` to `sync.note_latest`; in `phase.current` add "content pages (f224-f226)" to the shipped list.
- **`docs/overview.md`:** in the public content section, name `contentClasses.ts` / `ContentFaq.tsx` and the legal header decision.

- [ ] **Step 3: Validate JSON**

Run: `tail -3 feedAI/facts.jsonl | while read -r l; do echo "$l" | node -e 'JSON.parse(require("fs").readFileSync(0,"utf8"))' && echo ok; done && node -e 'for (const f of ["feedAI/brain.json","feedAI/topics/public-content-pages.json","feedAI/topics/ui-components-styling.json"]) JSON.parse(require("fs").readFileSync(f,"utf8")); console.log("json ok")'`
Expected: `ok` ×3, `json ok`.

- [ ] **Step 4: Commit (controller)**

```bash
git add feedAI docs/sessions docs/overview.md
git commit -m "docs: feedAI + session log for web UI polish phase 8 (content pages)"
```

(`git add feedAI docs/sessions docs/overview.md` touches none of the owner's WIP paths.)

---

## Risks and open questions

1. **Legal pages have no Navbar/dock** (unchanged structure). A phone user on `/policy` gets the slim header (logo + Home) but no dock. Swapping to `<Navbar />` + `CONTENT_TOP` is small but changes two pinned assertions (`legal-pages.test.ts` logo src, `seo-external-factors.test.ts` alt text, since the Navbar's logo would carry them). **Owner call.**
2. **RESOLVED (controller, 2026-10-01): the guides' gradient is the App Store link** (US-first market priority); Google Play is `flat`. Already applied in Task 2's code and the Task 6 expectations.
3. **`/compare/<slug>` at 320px**: the table (331px) scrolls inside its 278px box. The box has no `tabIndex`, so keyboard-only users can't scroll it (axe `scrollable-region-focusable` would flag it at that width; Lighthouse's default mobile width, 412px, doesn't overflow). Same as before this phase. A `tabIndex={0}` + label is a follow-up if wanted.
4. **`font-black` (900) with fonts loaded at 600/700** renders synthetic bold, as on every page restyled so far; out of scope.
5. **The JSON-LD/text diff needs both builds close in time** for `/compare/*` text (live prices, GBP rate); see Task 6 Step 3.
6. **Retired tokens remain in the config** (used by the wizard, admin pages and `stroke-mist`), so `tailwind.config.ts` can't drop them yet.
7. **Owner WIP**: the plan never touches it, but `pnpm test` in the real tree shows 1 failure until the owner finishes `src/app/page.tsx` / `how-it-works.test.ts` (the `landing.test.ts` alt-text check).

## Verification numbers from the dry run

The dry run applied Tasks 1–5 to a scratch copy of `HEAD = c085128` (committed code, no owner WIP), built it with the normal env, and compared it with a second untouched build of `HEAD`. Headless Chromium via Playwright, Lighthouse 13 mobile.

| | before (HEAD) | after |
|---|---|---|
| `pnpm test` | 92 files / 694 | 97 / 717 (T1 93/699 → T2 94/703 → T3 95/709 → T4 96/712 → T5 97/717), tsc clean at each stage |
| route types | ○ hubs, legal, support; ● travel/use-cases/compare slugs | identical; `/support` 8.59 → 8.49 kB |
| JSON-LD / visible text / hrefs (32 routes) | – | **identical** |
| matrix issues (48 checks) | 35 | **0** |
| horizontal scroll / CLS | none / 0 | none / 0 |
| controls < 44px | 1–6 per page on compare, legal, guides, support | 0 |
| gradients | support no-results: 2 | ≤ 1 everywhere |
| support FAQ intro sticky (lg) | never stuck | top 24px |
| Lighthouse a11y `/support` · `/policy` · travel | 1 · **0.96** · 1 | 1 · 1 · 1 (×2 runs) |
| Lighthouse CLS / LCP | 0 / 3457 · 2762 · 2611 ms | 0 / 3457 · 2760 · 2611 ms |

Found and fixed during the dry run (already in the code above): the support search `<input>` was 20–24px tall inside the 60px field → `h-11`; a sticky Related aside rode the bottom of a ~316px grid → dropped; the matrix's sticky probe needed `behavior: "instant"` (globals.css sets `scroll-behavior: smooth`) and real key presses for the search (Playwright `fill()` has no `hadRecentInput`, so the filter's re-layout read as CLS 0.085).

## Next plans (not in this document)

7. Homepage bento blocks (overlaps the owner's WIP in `src/app/page.tsx`; check with the owner first)
10. Partner pages on `AccountShell`
