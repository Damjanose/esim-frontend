# Web UI Polish, Phase 4: Country Plans (PlanRow + Sidebar) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Repo rule (overrides any skill):** implementers **never** run `git commit`. Each "Commit (controller)" step is done by the controller, who stages the files, shows the message, and asks the user before every commit. Stay on the current branch, with no new branches, worktrees or stashes.

**Goal:** Give both country-plan surfaces the app's layout (spec option A): a rounded photo banner, a single scrollable chip row with the sort on the right, app-style plan rows (`PlanRow`, rules in a pure `planRowTags()`), a sticky right sidebar at lg+, and a collapsed country bar on phones. It covers the live view (`DestinationPlans`, `/destinations?country=`) and the static `/esim/[slug]` page, and `/pkg/[id]` reuses the row. Copy, links, data, JSON-LD and the Buy flows stay the same.

**Architecture:** Pure rules go in `lib/`, presentational pieces in `components/`, and `DestinationPlans.tsx` shrinks from 1443 to about 330 lines instead of growing.
- `src/lib/planRow.ts` holds the pure row rules: `planRowTags`, `hasBestValueTag`, `planDataDisc`, `planDurationText`, `planVoiceSmsDetail`, `planSubtitle`, `isUnlimitedPlan`.
- `src/app/destinations/planList.ts` holds the live view's chips, sorts and the filter+sort that used to sit inline in `DestinationPlans`.
- `src/app/components/PlanRow.tsx` is server-safe (no hooks, no client directive). It exports `PlanRow` plus the cell pieces `PlanDataDisc`, `PlanTags`, `PlanPrice` and `PlanBuyLink`, which the `/esim` table reuses cell by cell.
- `src/app/components/CountryBanner.tsx` is the shared photo banner with the breadcrumb. `CollapsedCountryBar.tsx` is a tiny client island that watches the banner (IntersectionObserver).
- The live view's toolbar, sidebar, states and hero-image hook move into `PlanFilterBar.tsx`, `PlansSidebar.tsx`, `PlansStates.tsx` and `useCountryHeroImage.ts`.
- `destinationPricing.ts` passes through the fields the `/esim` rows need (`dataNumericGb`, `durationDays`, minutes/texts, active discount) plus the destination's flag.

**Tech Stack:** Next.js 15.5 App Router, React 19 (`inert` is a typed boolean prop; `ref` is not needed: the bar finds the banner by id), Tailwind 3.4 (`overflow-x-clip`, `border-spacing-y-*`, `motion-safe:`, `max-*`/`not-sr-only` and arbitrary values are built in), lucide-react 0.475 (`ChevronLeft`, `ArrowRight`, `ArrowDownUp`, `Globe2`, `CalendarDays`, `Zap`, `Signal`, `ShieldCheck`, `Headphones`, `Wifi`, `CheckCircle2`, `CircleHelp` all exist under `dist/esm/icons/`), vitest in a node env (pure-logic and source-string tests; no RTL/jsdom).

**Spec:** `docs/superpowers/specs/2026-10-01-web-ui-mobile-polish-design.md`. See "Constraints carried over", "Breakpoints", "### 4. Country plans (option A: app plan rows + sidebar)" and "Shared components". The mobile reference (read-only) is `velocity-eSim/src/screens/Marketplace/{CountryPlanRow,CollapsedCountryHeader,CountryHero}.tsx`.

**Scope:** spec build-order step 5 ("Country plans A"; the phase-3 session calls it phase 4). The account top-up list (`/account/[orderId]`) will reuse `PlanRow` in the account phase, not here.

**Baseline (2026-10-01, after phase 3, `HEAD = f903dcc`):**
- `pnpm test` → **73 files, 590 tests passing**.
- `pnpm build`:
  - `○ /  7.32 kB  215 kB`
  - `ƒ /destinations  10.9 kB  243 kB`
  - `● /esim/[slug]  135 B  117 kB`
  - `ƒ /pkg/[id]  4.24 kB  118 kB`
- **Lighthouse 13.5 mobile, `/esim/usa`, local prod build** (5 runs; run 1 was a cold start and is dropped): **LCP 3683–3685 ms (median 3684 ms)**, **CLS 0**, FCP 1.06 s.
  - The LCP element is the hero `mountain.webp` `<img>`, which has `priority` but no `fetchPriority`.
  - **This is the number to beat: LCP ≤ 3.68 s, CLS 0.**
- **Live view `/destinations?country=hungary`** (for reference, 3 runs): LCP 10.6–10.8 s (the client-fetched Wikimedia photo), **CLS 0.0451**.

**Dry run:** every code block below was applied, in task order, to a scratch copy of this repo before the plan was written. Each task's `pnpm test` count, a clean `tsc`, `pnpm build` and a headless-Chromium pass at 320–1440px came out as stated. See "Verification numbers from the dry run" at the end.

---

## Decisions

### Best value: the rule already in the code, reused

Both surfaces already call **the first row of the displayed list** the best value:
- **Live view:** `FeaturedPlan` (the card with the "Best value" badge) is `visiblePlans[0]`, the first plan after the active filter and sort. With the default "Recommended" sort, that's the highest `getPlanValueScore`: GB per euro, or days per euro for unlimited plans. With another sort it's simply the first row, and the badge follows it, as it does today.
- **`/esim/[slug]`:** `const lowestPriced = plans[0]` is printed as "Best value starting point". The rows are sorted by price.

So `planRowTags(plan, { position })` tags `position === 0` as Best value, and `null` means "not in a list" (`/pkg`). `PlanRow` and the `/esim` table derive the gradient Buy now from that tag (`hasBestValueTag`). Exactly one row per list gets it, and every other row is `flat`.

The `-N%` badge comes from `discountPercentOff` (null for a markup, f078). The strike-through comes from `hasActiveDiscount` + `formatOriginalPrice`, as before. "Calls + SMS" shows when `voiceMinutes || smsCount`. The badge keeps today's ASCII `-20%` (mobile `formatDiscountBadge` uses the same); the spec's "−N%" is typography.

### `/esim` table vs `PlanRow`: keep the table, reuse the row's pieces

`PlanRow` is an `<article>` with a heading. Putting it inside a `<td>` would turn every row into one cell holding an article, and the table would lose its row header and column cells. That's the point of keeping it (spec: "keeps its `<table>`, `<caption>` and sr-only 'Buy' header").

So the table keeps real `th`/`td` cells and fills them with `PlanRow`'s own pieces: `PlanDataDisc`, `PlanTags`, `PlanPrice` and `PlanBuyLink`, with the same `planRowTags` rules.
- **sm+:** a real table with `border-separate border-spacing-y-2` and card-styled rows (rounded first/last cells).
- **Below sm:** each `<tr>` is `display:grid`, laid out like a `PlanRow`: disc | title + tags | validity / network | price | Buy now.
  - Changing a table's display drops its semantics in some engines (Safari), so every table element carries an explicit role: `table`, `rowgroup`, `row`, `columnheader`, `rowheader` and `cell`.
  - The dry run's Playwright aria snapshot at 375px still shows `table` → `rowgroup` → `row` → `cell`/`rowheader`, with the caption as the table name.
- **Column order** becomes Data, Plan, Validity, Network, Price, Buy, so the disc comes first, as in the app. That's also the caption's order ("data, validity, network, and price").
- The `thead` is visible from sm and `sr-only` below it, inside the `relative` scroller (f195).

### Content mapping (nothing dropped silently)

- **FeaturedPlan + CompactPlanCard → PlanRow:**

  | Old | New |
  |---|---|
  | "Best value" badge | tag |
  | data icon / `${dataLabel} data` | disc (sr-only `dataLabel`) |
  | `${duration} validity` | heading `7 days` |
  | `"10 min + 10 SMS"` chip | "Calls + SMS" tag + subtitle `10 min + 10 SMS` |
  | taglines | subtitle (CompactPlanCard's three lines, used for every row) |
  | `-N%` + strike-through | tag + `PlanPrice` |
  | price | price |
  | "Choose plan" | **"Buy now"** (spec) |

  - The visible `plan.title` (for example "1 GB - 10 SMS - 10 Mins - 7 days") is fully covered by the disc, the duration and the min/SMS subtitle. It moves into the Buy link's accessible name, `Buy now: <title>`.
  - The "Total price" captions go.
  - FeaturedPlan's hard-coded "5G/4G LTE network" and "Hotspot enabled" lines go, per the spec ("no per-plan network/hotspot line"). The sidebar keeps "Fast data · Premium local networks" and "All plans include premium network access…".
- **DestinationStats + PlansSupportBar → PlansSidebar** with identical strings.
- **`/esim`:**
  - The "Live plan pricing / Ready before you land / Data-first travel" cards move from the hero into the plans sidebar (sticky at lg).
  - The table's "Buy" text link becomes a "Buy now" button.
  - The Validity cell prints `planDurationText` ("7 days", not "7 Days Duration").
  - Rows gain the tags, and the hero gains the flag.
  - Both hero CTAs become `flat`, so the best-value row's Buy now is the page's one gradient primary (the App Store button was accidentally a gradient too: the primary classes plus `bg-white/10`).
- **`/pkg/[id]`:** the Destination/Data/Validity/Voice & SMS/Price `dl` becomes one `PlanRow` without a CTA. The country stays in the H1, and the coverage line and `OpenAppActions` are unchanged.
- **Live view:** gains a breadcrumb (Home / Destinations / country). The scanning hex loader becomes the banner's token gradient, plus an sr-only "Loading destination image" status. The unused search/menu state (never rendered) goes.

### Layout numbers (verified, don't re-derive)

- **Navbar clearance:** the capsule ends at 12 + 56 = **68px** below lg and 12 + 64 = **76px** at lg (`Navbar.tsx`: `pt-3`, `h-14 lg:h-16`). `CountryBanner` content starts at `pt-[92px] lg:pt-[100px]`, which is 24px under it. This replaces `DestinationPlans`' `pt-20` (4px at lg).
- **Sticky needs a non-scrolling ancestor:** `overflow-x-hidden` makes `<main>` a scroll container, so `position: sticky` never sticks. Every `<main>` above a sticky sidebar becomes `overflow-x-clip`: `EsimDestinationPage`, `DestinationPlans` and `destinations/page.tsx`. In the dry run the sidebar's `top` stayed 24px after scrolling 1400px at 1024 and 1440.
- **Collapsed bar:** `fixed inset-x-0 top-0 z-40 lg:hidden`, `h-14`, inert and `-translate-y-full opacity-0` until the banner's bottom passes under it (IO `rootMargin: -56px 0px 0px 0px`). Because it's fixed it never shifts layout, and the transition is `motion-safe:`. The navbar header is `absolute` (z-50), so it has already scrolled away when the bar appears.
- **PlanRow:**
  - The disc is `h-12 w-12` on phones and `sm:h-16 sm:w-16`.
  - Buy now is `LinkButton size="md"` (46px). Its arrow shows from sm.
  - The list is `ul.grid.grid-cols-1`. `grid-cols-1` is `minmax(0,1fr)`, so `truncate` subtitles can't widen the track: without it the dry run measured 388px rows at 320px.
  - Measured row heights: phone 103 / 119px (without / with a tag line), md+ 116 / 132px.
- **Chips and sort:**
  - Chips are `h-[46px]`, in a `relative overflow-x-auto` row inside `min-w-0 flex-1 [contain:inline-size]` (f195, f209).
  - Below sm the sort is a 46×46 icon button with the native `<select>` stretched invisibly over it, so tapping opens the picker. From sm it shows "Sort by" + the visible select.
- **CLS slots (live view):**
  - The flag pill and the "Plans from €X to €Y" line sit in fixed `h-9` slots.
  - The H1 accent is its own `block` line at 30px on phones, so "your destination" (loading) and a short country name are both one line.
  - The photo credit is `absolute bottom-2 right-4`.
  - `PlansLoading` uses the loaded grid, the 46px bar and row-sized boxes.
  - Measured CLS: 0.0000 at all widths, and Lighthouse 0 (was 0.0451).

---

## File map

| File | Action | Responsibility |
|---|---|---|
| `src/services/discountPricing.ts` | modify | helpers accept any `DiscountPricedPlan` shape (type-only widening) |
| `src/services/discountPricing.test.ts` | modify | +1 test (a non-`HeroPackageOption` row) |
| `src/lib/planRow.ts` | create | pure row rules: tags, best value, disc, duration, subtitle |
| `src/lib/planRow.test.ts` | create | 11 tests |
| `src/app/destinations/planList.ts` | create | chips, sorts, value score, `visiblePlans` (moved logic) |
| `src/app/destinations/planList.test.ts` | create | 4 tests |
| `src/lib/destinationPricing.ts` | modify | rows carry data/days/minutes/texts/discount; `getDestinationFlag` |
| `src/lib/destinationPricing.test.ts` | modify | +2 tests |
| `src/app/components/PlanRow.tsx` | create | `PlanRow` + `PlanDataDisc`/`PlanTags`/`PlanPrice`/`PlanBuyLink` |
| `src/app/components/CountryBanner.tsx` | create | rounded photo banner + breadcrumb + navbar clearance |
| `src/app/components/CollapsedCountryBar.tsx` | create | phone/tablet fixed country bar (IO on the banner) |
| `src/app/components/countryPlansComponents.test.ts` | create | source contracts for the three components (4 tests) |
| `src/app/EsimDestinationPage.tsx` | modify | banner, card-row table, sticky sidebar, restyled sections |
| `src/app/esim/[slug]/page.tsx` | modify | fetches the flag |
| `src/app/seo-content-page.test.ts` | modify | assertions follow the markup (+1 table-semantics test) |
| `src/app/destinations/useCountryHeroImage.ts` | create | the hero-photo hook, moved out unchanged |
| `src/app/destinations/PlanFilterBar.tsx` | create | chip row + sort |
| `src/app/destinations/PlansSidebar.tsx` | create | stats + support (old DestinationStats + PlansSupportBar) |
| `src/app/destinations/PlansStates.tsx` | create | loading / error / empty-filter / missing states |
| `src/app/destinations/destinationPlans-wiring.test.ts` | create | contracts for the pieces (3 tests) + `DestinationPlans` (1 test) |
| `src/app/destinations/DestinationPlans.tsx` | rewrite | banner, filters, `PlanRow` list, sidebar, collapsed bar |
| `src/app/destinations/page.tsx` | modify | `<main>` `overflow-x-clip` |
| `src/app/globals.css` | modify | drop the now-unused `destination-loader-scan` keyframes |
| `src/app/public-shell.test.ts` | modify | loader assertion follows the banner |
| `src/app/discount-display-wiring.test.ts` | modify | discount assertion follows `PlanRow` |
| `src/app/pkg/[id]/page.tsx` | modify | plan details as a `PlanRow` (no CTA) |
| `src/app/pkg/[id]/pkgPlanRow.test.ts` | create | 1 test |
| `feedAI/*`, `docs/sessions/*` | modify/create | Task 11 |

`src/app/core-web-vitals.test.ts` is **not** changed: its f195 guard (`className="relative mt-8 overflow-x-auto`) still matches the plan table wrapper.

---

### Task 1: Pure plan-row rules (TDD)

**Files:**
- Modify: `src/services/discountPricing.ts`, `src/services/discountPricing.test.ts`
- Create: `src/lib/planRow.ts`
- Test: `src/lib/planRow.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/planRow.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  hasBestValueTag,
  isUnlimitedPlan,
  planDataDisc,
  planDurationText,
  planRowTags,
  planSubtitle,
  planVoiceSmsDetail,
  type PlanRowPlan,
} from "./planRow";

function plan(overrides: Partial<PlanRowPlan> = {}): PlanRowPlan {
  return {
    id: "change-in-7days-1gb",
    title: "1 GB - 7 days",
    dataLabel: "1GB",
    durationLabel: "7 Days Duration",
    price: "€4.00",
    priceNumeric: 4,
    dataNumericGb: 1,
    durationDays: 7,
    ...overrides,
  };
}

describe("planRowTags", () => {
  it("tags only the first row of the displayed list as Best value", () => {
    expect(planRowTags(plan(), { position: 0 })).toEqual([{ kind: "best-value", label: "Best value" }]);
    expect(planRowTags(plan(), { position: 1 })).toEqual([]);
    // Outside a list (/pkg) nothing is the best value.
    expect(planRowTags(plan(), { position: null })).toEqual([]);
  });

  it("adds the -N% badge through discountPercentOff, never for a markup", () => {
    expect(
      planRowTags(plan({ hasDiscount: true, priceNumeric: 8, retailPrice: 10, price: "€8.00" }), { position: 3 }),
    ).toEqual([{ kind: "discount", label: "-20%" }]);
    // discountDirection 'increase': still hasDiscount, but no badge (f078).
    expect(planRowTags(plan({ hasDiscount: true, priceNumeric: 12, retailPrice: 10 }), { position: 3 })).toEqual([]);
    // retailPrice alone is not a discount.
    expect(planRowTags(plan({ retailPrice: 3.52 }), { position: 3 })).toEqual([]);
  });

  it("adds Calls + SMS when the plan includes minutes or texts, in a fixed order", () => {
    expect(planRowTags(plan({ voiceMinutes: 10 }), { position: 2 })).toEqual([
      { kind: "calls-sms", label: "Calls + SMS" },
    ]);
    expect(planRowTags(plan({ smsCount: 10 }), { position: 2 })).toEqual([
      { kind: "calls-sms", label: "Calls + SMS" },
    ]);
    expect(
      planRowTags(plan({ voiceMinutes: 10, smsCount: 10, hasDiscount: true, priceNumeric: 7, retailPrice: 10 }), {
        position: 0,
      }).map((tag) => tag.kind),
    ).toEqual(["best-value", "discount", "calls-sms"]);
  });

  it("hasBestValueTag picks the list's single gradient Buy now", () => {
    expect(hasBestValueTag(planRowTags(plan(), { position: 0 }))).toBe(true);
    expect(hasBestValueTag(planRowTags(plan({ voiceMinutes: 5 }), { position: 1 }))).toBe(false);
  });
});

describe("planDataDisc", () => {
  it("splits the data label into the number and the unit", () => {
    expect(planDataDisc(plan())).toEqual({ unlimited: false, value: "1", unit: "GB" });
    expect(planDataDisc(plan({ dataLabel: "500MB", dataNumericGb: 0.49 }))).toEqual({
      unlimited: false,
      value: "500",
      unit: "MB",
    });
    expect(planDataDisc(plan({ dataLabel: "3 GB", dataNumericGb: 3 }))).toEqual({ unlimited: false, value: "3", unit: "GB" });
  });

  it("shows ∞ + UNL for unlimited plans (dataNumericGb >= 999 or an Unlimited label)", () => {
    const unl = { unlimited: true, value: "∞", unit: "UNL" };
    expect(planDataDisc(plan({ dataLabel: "Unlimited", dataNumericGb: 999 }))).toEqual(unl);
    expect(planDataDisc(plan({ dataLabel: "Unlimited", dataNumericGb: undefined }))).toEqual(unl);
    expect(planDataDisc(plan({ dataLabel: "1GB", title: "Unlimited - 3 days" }))).toEqual(unl);
  });

  it("falls back to dataNumericGb, then to the raw label", () => {
    expect(planDataDisc(plan({ dataLabel: "Data plan", dataNumericGb: 0.5 }))).toEqual({
      unlimited: false,
      value: "512",
      unit: "MB",
    });
    expect(planDataDisc(plan({ dataLabel: "Data plan", dataNumericGb: 1.5 }))).toEqual({
      unlimited: false,
      value: "1.5",
      unit: "GB",
    });
    expect(planDataDisc(plan({ dataLabel: "Data plan", dataNumericGb: 0 }))).toEqual({
      unlimited: false,
      value: "Data plan",
      unit: "",
    });
  });
});

describe("plan row text", () => {
  it("prints the duration from durationDays, else the label without 'Duration'", () => {
    expect(planDurationText(plan())).toBe("7 days");
    expect(planDurationText(plan({ durationDays: 1 }))).toBe("1 day");
    expect(planDurationText(plan({ durationDays: 0 }))).toBe("7 Days");
    expect(planDurationText(plan({ durationDays: undefined, durationLabel: "Flexible validity" }))).toBe(
      "Flexible validity",
    );
  });

  it("formats minutes and texts like the old plan cards", () => {
    expect(planVoiceSmsDetail(plan({ voiceMinutes: 75, smsCount: 30 }))).toBe("75 min + 30 SMS");
    expect(planVoiceSmsDetail(plan({ smsCount: 30 }))).toBe("30 SMS");
    expect(planVoiceSmsDetail(plan())).toBeNull();
  });

  it("subtitles a row with its minutes/texts, else the old CompactPlanCard line", () => {
    expect(planSubtitle(plan({ voiceMinutes: 10, smsCount: 10 }))).toBe("10 min + 10 SMS");
    expect(planSubtitle(plan({ dataLabel: "Unlimited", dataNumericGb: 999 }))).toBe("High-speed data without limits.");
    expect(planSubtitle(plan({ durationDays: 15 }))).toBe("Perfect for short trips.");
    expect(planSubtitle(plan({ durationDays: 30 }))).toBe("More data for longer adventures.");
  });

  it("isUnlimitedPlan matches the live view's old rule", () => {
    expect(isUnlimitedPlan(plan({ dataNumericGb: 999 }))).toBe(true);
    expect(isUnlimitedPlan(plan({ dataLabel: "UNLIMITED" }))).toBe(true);
    expect(isUnlimitedPlan(plan())).toBe(false);
  });
});
```

Append to `src/services/discountPricing.test.ts`:

```ts

describe("plan shapes", () => {
  it("accepts any plan carrying the discount fields, like the static /esim plan rows", () => {
    const row = { price: "€8.00", priceNumeric: 8, hasDiscount: true, retailPrice: 10 };

    expect(hasActiveDiscount(row)).toBe(true);
    expect(formatOriginalPrice(row)).toBe("€10.00");
    expect(discountPercentOff(row)).toBe(20);
  });
});
```

- [ ] **Step 2: Run them and watch them fail**

Run: `pnpm exec vitest run src/lib/planRow.test.ts`
Expected: FAIL. `./planRow` can't be resolved.

Run: `pnpm exec tsc --noEmit`
Expected: errors, including `discountPricing.test.ts … Argument of type '{ price: string; … }' is not assignable to parameter of type 'HeroPackageOption'`. The new shape test passes at runtime but not in types. Step 3 fixes it.

- [ ] **Step 3: Widen the discount helpers (types only)**

Replace the whole of `src/services/discountPricing.ts` with:

```ts
import type { HeroPackageOption } from "./packages";

/**
 * The fields the discount helpers read. Any plan shape that carries them works:
 * HeroPackageOption (live catalog) and the static /esim plan rows
 * (DestinationPlanRow) both do.
 */
export type DiscountPricedPlan = Pick<HeroPackageOption, "price" | "priceNumeric" | "hasDiscount" | "retailPrice">;

/** The currency prefix `plan.price` carries (e.g. "€"), for formatting other amounts to match. */
function pricePrefix(plan: DiscountPricedPlan): string {
  return plan.price.match(/^[^\d]*/)?.[0] ?? "";
}

/**
 * Renders `retailPrice` with the same currency prefix `plan.price` already
 * carries (e.g. "€") — the backend only sends the final price pre-formatted,
 * so the pre-discount amount is formatted client-side to match it exactly.
 */
export function formatOriginalPrice(plan: DiscountPricedPlan): string {
  return `${pricePrefix(plan)}${plan.retailPrice!.toFixed(2)}`;
}

/**
 * Renders a cents amount (e.g. `finalCustomerPriceCents` from the partner
 * promo-code endpoint) with the same currency prefix `plan.price` carries.
 */
export function formatPriceFromCents(plan: DiscountPricedPlan, cents: number): string {
  return `${pricePrefix(plan)}${(cents / 100).toFixed(2)}`;
}

/**
 * `-N%` savings, or `null` when there's nothing worth badging — no discount,
 * or a discount that raised the price instead of lowering it
 * (`discountDirection: 'increase'`, still `hasDiscount: true` on the
 * backend). Matches the mobile app's `formatDiscountBadge`
 * (`src/currency/formatPrice.ts`): the strikethrough original price still
 * shows via `hasActiveDiscount`/`formatOriginalPrice` regardless — only the
 * percent badge is conditional on the discount actually being a discount.
 */
export function discountPercentOff(plan: DiscountPricedPlan): number | null {
  if (!hasActiveDiscount(plan) || plan.retailPrice <= 0) return null;
  const pctOff = Math.round((1 - plan.priceNumeric / plan.retailPrice) * 100);
  return pctOff > 0 ? pctOff : null;
}

export function hasActiveDiscount<T extends DiscountPricedPlan>(
  plan: T,
): plan is T & { hasDiscount: true; retailPrice: number } {
  return Boolean(plan.hasDiscount && plan.retailPrice != null);
}
```

There's no runtime change. `hasActiveDiscount` becomes generic, so `CheckoutPriceSection` (a `HeroPackageOption`) still narrows to `retailPrice: number`.

- [ ] **Step 4: Implement the rules**

Create `src/lib/planRow.ts`:

```ts
import { discountPercentOff, type DiscountPricedPlan } from "@/services/discountPricing";

/**
 * Pure presentation rules for a plan row (PlanRow, the /esim plan table, /pkg).
 * The live catalog's HeroPackageOption and the static /esim DestinationPlanRow
 * both satisfy PlanRowPlan.
 */
export type PlanRowPlan = DiscountPricedPlan & {
  id: string;
  title: string;
  dataLabel: string;
  durationLabel: string;
  dataNumericGb?: number;
  durationDays?: number;
  voiceMinutes?: number;
  smsCount?: number;
};

export type PlanRowTag =
  | { kind: "best-value"; label: string }
  | { kind: "discount"; label: string }
  | { kind: "calls-sms"; label: string };

export type PlanDataDisc = { unlimited: boolean; value: string; unit: string };

/** The catalog's "unlimited" sentinel (mobile UNLIMITED_DATA_GB). */
const UNLIMITED_DATA_GB = 999;

/** Same rule DestinationPlans used for its Unlimited / Fixed data filters and icons. */
export function isUnlimitedPlan(plan: Pick<PlanRowPlan, "dataLabel" | "title" | "dataNumericGb">): boolean {
  return (
    (plan.dataNumericGb ?? 0) >= UNLIMITED_DATA_GB ||
    plan.dataLabel.toLowerCase().includes("unlimited") ||
    plan.title.toLowerCase().includes("unlimited")
  );
}

/**
 * The row's tags, in display order.
 * - "Best value": the first row of the list as displayed (position 0). That's
 *   the rule both surfaces already used: the live view headlined
 *   visiblePlans[0] as FeaturedPlan with a "Best value" badge, and /esim names
 *   plans[0] its "Best value starting point". Outside a list (null) there's none.
 * - "-N%": discountPercentOff, so a markup (hasDiscount with a higher price) gets no badge (f078).
 * - "Calls + SMS": the plan includes minutes or texts.
 */
export function planRowTags(plan: PlanRowPlan, context: { position: number | null }): PlanRowTag[] {
  const tags: PlanRowTag[] = [];
  if (context.position === 0) tags.push({ kind: "best-value", label: "Best value" });

  const percentOff = discountPercentOff(plan);
  if (percentOff != null) tags.push({ kind: "discount", label: `-${percentOff}%` });

  if (plan.voiceMinutes || plan.smsCount) tags.push({ kind: "calls-sms", label: "Calls + SMS" });
  return tags;
}

/** The best-value row carries the list's single gradient Buy now; every other row is flat. */
export function hasBestValueTag(tags: readonly PlanRowTag[]): boolean {
  return tags.some((tag) => tag.kind === "best-value");
}

/** The data disc: "1" + "GB", "500" + "MB", or "∞" + "UNL". */
export function planDataDisc(plan: Pick<PlanRowPlan, "dataLabel" | "title" | "dataNumericGb">): PlanDataDisc {
  if (isUnlimitedPlan(plan)) return { unlimited: true, value: "∞", unit: "UNL" };

  const match = plan.dataLabel.trim().match(/^(\d+(?:[.,]\d+)?)\s*(GB|MB|TB)$/i);
  if (match) return { unlimited: false, value: match[1], unit: match[2].toUpperCase() };

  const gb = plan.dataNumericGb ?? 0;
  if (gb > 0 && gb < 1) return { unlimited: false, value: String(Math.round(gb * 1024)), unit: "MB" };
  if (gb >= 1) return { unlimited: false, value: String(Number(gb.toFixed(2))), unit: "GB" };
  return { unlimited: false, value: plan.dataLabel, unit: "" };
}

/** "7 days" from durationDays, else the backend label without its " Duration" suffix. */
export function planDurationText(plan: Pick<PlanRowPlan, "durationDays" | "durationLabel">): string {
  const days = plan.durationDays ?? 0;
  if (days > 0) return `${days} ${days === 1 ? "day" : "days"}`;
  return plan.durationLabel.replace(/\s*Duration\s*$/i, "");
}

/** "75 min + 30 SMS", or null on a data-only plan. */
export function planVoiceSmsDetail(plan: Pick<PlanRowPlan, "voiceMinutes" | "smsCount">): string | null {
  const parts = [
    plan.voiceMinutes ? `${plan.voiceMinutes} min` : null,
    plan.smsCount ? `${plan.smsCount} SMS` : null,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(" + ") : null;
}

/** The row's second line: its minutes/texts, else the old CompactPlanCard line. */
export function planSubtitle(plan: PlanRowPlan): string {
  const voiceSms = planVoiceSmsDetail(plan);
  if (voiceSms) return voiceSms;
  if (isUnlimitedPlan(plan)) return "High-speed data without limits.";
  return (plan.durationDays ?? 0) <= 15 ? "Perfect for short trips." : "More data for longer adventures.";
}
```

- [ ] **Step 5: Run them and watch them pass**

Run: `pnpm exec vitest run src/lib/planRow.test.ts src/services/discountPricing.test.ts`
Expected: PASS, 11 + 10 tests.

- [ ] **Step 6: Full suite + types**

Run: `pnpm test && pnpm exec tsc --noEmit`
Expected: **74 files, 602 tests**; tsc prints nothing.

- [ ] **Step 7: Commit (controller)**

```bash
git add src/lib/planRow.ts src/lib/planRow.test.ts src/services/discountPricing.ts src/services/discountPricing.test.ts
git commit -m "feat(plans): pure planRowTags + row text rules; discount helpers take any priced plan"
```

---

### Task 2: Live-view filter/sort logic as a pure module (TDD)

Unused until Task 8, so nothing on screen changes. The logic is moved from `DestinationPlans.tsx` lines 68–119 (types and chips), 141–165 (`isUnlimitedPlan`, `getPlanValueScore`) and 524–587 (filter + sort), unchanged.

**Files:**
- Create: `src/app/destinations/planList.ts`
- Test: `src/app/destinations/planList.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/app/destinations/planList.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import type { HeroPackageOption } from "@/services/packages";
import { PLAN_FILTERS, PLAN_SORTS, planValueScore, visiblePlans } from "./planList";

function plan(id: string, overrides: Partial<HeroPackageOption> = {}): HeroPackageOption {
  return {
    kind: "standard",
    id,
    country: "Hungary",
    countryCode: "hungary",
    flagUri: "",
    dataLabel: "1GB",
    durationLabel: "7 Days Duration",
    title: "1 GB - 7 days",
    price: "€4.00",
    priceNumeric: 4,
    dataNumericGb: 1,
    durationDays: 7,
    filters: ["local"],
    query: "",
    ...overrides,
  };
}

const small = plan("small", { dataNumericGb: 1, priceNumeric: 4, durationDays: 7 });
const big = plan("big", { dataLabel: "20GB", dataNumericGb: 20, priceNumeric: 12.5, durationDays: 30 });
const unl = plan("unl", { dataLabel: "Unlimited", title: "Unlimited - 10 days", dataNumericGb: 999, priceNumeric: 16, durationDays: 10 });
const zero = plan("zero", { priceNumeric: 0, durationDays: 0 });
const all = [small, big, unl, zero];

describe("planList", () => {
  it("keeps the six chips and four sorts, in order", () => {
    expect(PLAN_FILTERS.map((item) => item.label)).toEqual([
      "All plans",
      "Unlimited",
      "Fixed data",
      "1–7 days",
      "8–15 days",
      "16+ days",
    ]);
    expect(PLAN_SORTS.map((item) => item.label)).toEqual([
      "Recommended",
      "Price: low to high",
      "Price: high to low",
      "Longest validity",
    ]);
  });

  it("scores GB per euro, or days per euro for unlimited plans, and 0 when unpriced", () => {
    expect(planValueScore(small)).toBe(0.25);
    expect(planValueScore(big)).toBe(1.6);
    expect(planValueScore(unl)).toBe(10 / 16);
    expect(planValueScore(zero)).toBe(0);
  });

  it("filters by data type and by validity bucket", () => {
    const ids = (filter: Parameters<typeof visiblePlans>[1]) =>
      visiblePlans(all, filter, "price-low").map((item) => item.id);

    expect(ids("all")).toEqual(["zero", "small", "big", "unl"]);
    expect(ids("unlimited")).toEqual(["unl"]);
    expect(ids("fixed")).toEqual(["zero", "small", "big"]);
    expect(ids("short")).toEqual(["small"]);
    expect(ids("medium")).toEqual(["unl"]);
    expect(ids("long")).toEqual(["big"]);
  });

  it("sorts without mutating the input; Recommended puts the best value score first", () => {
    const ids = (sort: Parameters<typeof visiblePlans>[2]) =>
      visiblePlans(all, "all", sort).map((item) => item.id);

    expect(ids("recommended")).toEqual(["big", "unl", "small", "zero"]);
    expect(ids("price-high")).toEqual(["unl", "big", "small", "zero"]);
    expect(ids("duration")).toEqual(["big", "unl", "small", "zero"]);
    expect(all.map((item) => item.id)).toEqual(["small", "big", "unl", "zero"]);
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `pnpm exec vitest run src/app/destinations/planList.test.ts`
Expected: FAIL. `./planList` can't be resolved.

- [ ] **Step 3: Implement**

Create `src/app/destinations/planList.ts`:

```ts
import { isUnlimitedPlan } from "@/lib/planRow";
import type { HeroPackageOption } from "@/services/packages";

/** The live view's filter chips and sort options (moved out of DestinationPlans unchanged). */
export type PlanFilter = "all" | "unlimited" | "fixed" | "short" | "medium" | "long";
export type PlanSort = "recommended" | "price-low" | "price-high" | "duration";

export const PLAN_FILTERS: ReadonlyArray<{ value: PlanFilter; label: string }> = [
  { value: "all", label: "All plans" },
  { value: "unlimited", label: "Unlimited" },
  { value: "fixed", label: "Fixed data" },
  { value: "short", label: "1–7 days" },
  { value: "medium", label: "8–15 days" },
  { value: "long", label: "16+ days" },
];

export const PLAN_SORTS: ReadonlyArray<{ value: PlanSort; label: string }> = [
  { value: "recommended", label: "Recommended" },
  { value: "price-low", label: "Price: low to high" },
  { value: "price-high", label: "Price: high to low" },
  { value: "duration", label: "Longest validity" },
];

/** "Recommended" order: GB per euro, or days per euro for unlimited plans. */
export function planValueScore(plan: HeroPackageOption): number {
  if (plan.priceNumeric <= 0) return 0;
  if (isUnlimitedPlan(plan)) return Math.max(plan.durationDays, 1) / plan.priceNumeric;
  return Math.max(plan.dataNumericGb, 0.1) / plan.priceNumeric;
}

function matchesFilter(plan: HeroPackageOption, filter: PlanFilter): boolean {
  switch (filter) {
    case "unlimited":
      return isUnlimitedPlan(plan);
    case "fixed":
      return !isUnlimitedPlan(plan);
    case "short":
      return plan.durationDays > 0 && plan.durationDays <= 7;
    case "medium":
      return plan.durationDays > 7 && plan.durationDays <= 15;
    case "long":
      return plan.durationDays > 15;
    default:
      return true;
  }
}

function compare(first: HeroPackageOption, second: HeroPackageOption, sort: PlanSort): number {
  switch (sort) {
    case "price-low":
      return first.priceNumeric - second.priceNumeric;
    case "price-high":
      return second.priceNumeric - first.priceNumeric;
    case "duration":
      return second.durationDays - first.durationDays;
    default:
      return planValueScore(second) - planValueScore(first);
  }
}

/**
 * The plan list as displayed. Its first row is the list's Best value
 * (planRowTags position 0), as FeaturedPlan was before.
 */
export function visiblePlans(
  plans: readonly HeroPackageOption[],
  filter: PlanFilter,
  sort: PlanSort,
): HeroPackageOption[] {
  return plans.filter((plan) => matchesFilter(plan, filter)).sort((first, second) => compare(first, second, sort));
}
```

- [ ] **Step 4: Run it and watch it pass**

Run: `pnpm exec vitest run src/app/destinations/planList.test.ts`
Expected: PASS, 4 tests.

- [ ] **Step 5: Full suite + types**

Run: `pnpm test && pnpm exec tsc --noEmit`
Expected: **75 files, 606 tests**; tsc clean.

- [ ] **Step 6: Commit (controller)**

```bash
git add src/app/destinations/planList.ts src/app/destinations/planList.test.ts
git commit -m "feat(plans): move the live view's chips, sorts and filter/sort into planList.ts"
```

---

### Task 3: `/esim` plan rows carry what PlanRow shows, plus the flag (TDD)

**Files:**
- Modify: `src/lib/destinationPricing.ts`
- Test: `src/lib/destinationPricing.test.ts`

- [ ] **Step 1: Write the failing tests**

In `src/lib/destinationPricing.test.ts`, add `getDestinationFlag` to the import:

```ts
import {
  getDestinationCoverage,
  getDestinationFlag,
  getDestinationOffer,
  getDestinationPlanRows
} from "./destinationPricing";
```

Insert these two blocks **immediately before** `describe("getDestinationCoverage", () => {`:

```ts
describe("plan row fields", () => {
  it("carries what the plan rows show: data, days, minutes/texts and an active discount", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        packagesResponse([
          {
            id: "us-plus",
            countryCode: "united-states",
            title: "1 GB - 10 SMS - 10 Mins - 7 days",
            dataLabel: "1GB",
            durationLabel: "7 Days Duration",
            price: "€4.00",
            priceNumeric: 4,
            dataNumericGb: 1,
            durationDays: 7,
            voiceMinutes: 10,
            smsCount: 10,
            hasDiscount: true,
            retailPrice: 5
          },
          {
            id: "us-data",
            countryCode: "united-states",
            price: "€6.00",
            priceNumeric: 6,
            voiceMinutes: 0,
            hasDiscount: false,
            retailPrice: 5.5
          }
        ])
      )
    );

    const [withExtras, dataOnly] = await getDestinationPlanRows("usa");

    expect(withExtras).toEqual(
      expect.objectContaining({
        dataNumericGb: 1,
        durationDays: 7,
        voiceMinutes: 10,
        smsCount: 10,
        hasDiscount: true,
        retailPrice: 5
      })
    );
    // Data-only, undiscounted rows stay slim: no zero minutes, no retailPrice without a discount.
    expect(dataOnly).toEqual({
      id: "us-data",
      title: "Data · plan",
      dataLabel: "Data plan",
      durationLabel: "Flexible validity",
      network: "4G/5G",
      price: "€6.00",
      priceNumeric: 6,
      dataNumericGb: 0,
      durationDays: 0
    });
  });
});

describe("getDestinationFlag", () => {
  it("returns the first flag the destination's packages carry, or null", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        packagesResponse([
          { countryCode: "japan", priceNumeric: 4, flagUri: "" },
          { countryCode: "japan", priceNumeric: 9, flagUri: "https://cdn.example/jp.png" },
          { countryCode: "japan", priceNumeric: 12, flagUri: "https://cdn.example/other.png" }
        ])
      )
    );

    await expect(getDestinationFlag("japan")).resolves.toBe("https://cdn.example/jp.png");
    await expect(getDestinationFlag("france")).resolves.toBeNull();
  });
});
```

- [ ] **Step 2: Run them and watch them fail**

Run: `pnpm exec vitest run src/lib/destinationPricing.test.ts`
Expected: FAIL, 2 failed and 7 passed. `getDestinationFlag` is not a function, and the row has no `dataNumericGb`.

- [ ] **Step 3: Implement**

Make these exact replacements in `src/lib/destinationPricing.ts`.

(a) The row type:

```ts
export type DestinationPlanRow = {
  id: string;
  title: string;
  dataLabel: string;
  durationLabel: string;
  network: string;
  price: string;
  priceNumeric: number;
  /** 999+ means unlimited; 0 when the backend didn't say. */
  dataNumericGb: number;
  /** 0 when the backend didn't say. */
  durationDays: number;
  /** Only set when the plan includes minutes / texts. */
  voiceMinutes?: number;
  smsCount?: number;
  /** Only set while an admin discount is active (see services/discountPricing). */
  hasDiscount?: true;
  retailPrice?: number;
};
```

(b) In `type ApiPackage`, replace `  network?: string;\n  filters?: string[];` with:

```ts
  network?: string;
  flagUri?: string;
  dataNumericGb?: number;
  durationDays?: number;
  voiceMinutes?: number;
  smsCount?: number;
  hasDiscount?: boolean;
  retailPrice?: number;
  filters?: string[];
```

(c) After `type CoverageIndex = Record<string, string[]>;` add:

```ts
/** Code -> the first flag image its packages carry. */
type FlagIndex = Record<string, string>;
```

and in `type DestinationCatalog` add `flags: FlagIndex;` after `coverage: CoverageIndex;`.

(d) In `catalogFromPackages`, after `const coverageByCode = new Map<string, Set<string>>();` add `const flags: FlagIndex = {};`. Then replace the end of the row literal:

```ts
      price: pkg.price?.trim() || `€${pkg.priceNumeric.toFixed(2)}`,
      priceNumeric: pkg.priceNumeric
    };
```

with:

```ts
      price: pkg.price?.trim() || `€${pkg.priceNumeric.toFixed(2)}`,
      priceNumeric: pkg.priceNumeric,
      dataNumericGb: typeof pkg.dataNumericGb === "number" ? pkg.dataNumericGb : 0,
      durationDays: typeof pkg.durationDays === "number" ? pkg.durationDays : 0,
      ...(typeof pkg.voiceMinutes === "number" && pkg.voiceMinutes > 0 ? { voiceMinutes: pkg.voiceMinutes } : {}),
      ...(typeof pkg.smsCount === "number" && pkg.smsCount > 0 ? { smsCount: pkg.smsCount } : {}),
      ...(pkg.hasDiscount === true && typeof pkg.retailPrice === "number"
        ? { hasDiscount: true as const, retailPrice: pkg.retailPrice }
        : {})
    };

    const flagUri = pkg.flagUri?.trim();
    if (flagUri && !flags[code]) flags[code] = flagUri;
```

(e) `return { offers, plans, coverage };` → `return { offers, plans, coverage, flags };`. In `loadCatalog`, both `return { offers: {}, plans: {}, coverage: {} };` → `return { offers: {}, plans: {}, coverage: {}, flags: {} };`.

(f) Before `export async function getGlobalOffer()` add:

```ts
/** The destination's flag image (Airalo CDN), or null. */
export async function getDestinationFlag(slug: string): Promise<string | null> {
  const catalog = await getCachedCatalog();
  return catalog.flags?.[backendCountryCode(slug)] ?? null;
}
```

`catalog.flags?.` (like the existing `catalog.coverage?.`) tolerates a catalog cached by the previous build. Size: the slim catalog grows to about 0.6 MB for the 215 codes in today's `/packages`, still well under the 2 MB data-cache limit the file's comment warns about.

- [ ] **Step 4: Run them and watch them pass**

Run: `pnpm exec vitest run src/lib/destinationPricing.test.ts`
Expected: PASS, 9 tests.

- [ ] **Step 5: Full suite + types**

Run: `pnpm test && pnpm exec tsc --noEmit`
Expected: **75 files, 608 tests**; tsc clean.

- [ ] **Step 6: Commit (controller)**

```bash
git add src/lib/destinationPricing.ts src/lib/destinationPricing.test.ts
git commit -m "feat(esim): plan rows carry data/days/minutes/discount; getDestinationFlag"
```

---

### Task 4: `PlanRow` and its cell pieces

Unused until Task 6. The component is server-safe, so `/esim` stays static HTML and `/pkg` stays a server component.

**Files:**
- Create: `src/app/components/PlanRow.tsx`
- Test: `src/app/components/countryPlansComponents.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/app/components/countryPlansComponents.test.ts` with the header and the `PlanRow` block. Task 5 appends two more blocks.

```ts
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function read(file: string) {
  return readFileSync(join(process.cwd(), "src/app/components", file), "utf8");
}

describe("PlanRow", () => {
  it("renders the app's plan row: disc, duration, tags, subtitle, price, Buy now", () => {
    const source = read("PlanRow.tsx");

    // Server-safe: no hooks and no client directive, so /esim and /pkg stay static HTML.
    expect(source).not.toContain('"use client"');
    expect(source).not.toMatch(/\buse(State|Effect|Ref)\(/);
    // The tag and the text rules live in lib/planRow.ts (tested there).
    expect(source).toContain("planDataDisc(plan)");
    expect(source).toContain("planDurationText(plan)");
    expect(source).toContain("planSubtitle(plan)");
    // Disc: number in brandBlue, unit in onSurfaceVariant (brandTeal on the light disc is
    // ~2.1:1, failing WCAG AA); the data label for screen readers,
    // inside a positioned disc so the sr-only text can't escape a scroller (f195).
    expect(source).toContain("text-brandBlue");
    expect(source).toContain("text-onSurfaceVariant sm:text-[10px]");
    expect(source).toContain('className="relative grid h-12 w-12 shrink-0 place-items-center rounded-full');
    expect(source).toContain('<span className="sr-only">{plan.dataLabel}</span>');
    // Discount: strike-through original price whenever a discount is active (f078).
    expect(source).toContain("hasActiveDiscount(plan)");
    expect(source).toContain("formatOriginalPrice(plan)");
    expect(source).toContain("line-through");
  });

  it("gives only the best-value row the gradient Buy now, at a 46px tap target", () => {
    const source = read("PlanRow.tsx");

    expect(source).toContain("const bestValue = hasBestValueTag(tags);");
    expect(source).toContain('variant={primary ? "primary" : "flat"}');
    expect(source).toContain("primary={bestValue}");
    expect(source).toContain('size="md"');
    expect(source).toContain("aria-label={`Buy now: ${planTitle}`}");
    // No CTA when the caller has its own actions (/pkg).
    expect(source).toContain("{buyHref ? <PlanBuyLink");
    // Tokens only.
    expect(source).not.toMatch(/#[0-9a-fA-F]{3,6}\b/);
    expect(source).not.toContain("text-white");
    expect(source).not.toContain("bg-white");
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `pnpm exec vitest run src/app/components/countryPlansComponents.test.ts`
Expected: FAIL with `ENOENT … PlanRow.tsx`.

- [ ] **Step 3: Implement**

Create `src/app/components/PlanRow.tsx`:

```tsx
import { ArrowRight } from "lucide-react";
import {
  hasBestValueTag,
  planDataDisc,
  planDurationText,
  planSubtitle,
  type PlanRowPlan,
  type PlanRowTag,
} from "@/lib/planRow";
import { formatOriginalPrice, hasActiveDiscount } from "@/services/discountPricing";
import { LinkButton } from "./Button";

/**
 * The app's CountryPlanRow at web scale, plus the pieces the /esim plan table
 * reuses cell by cell. No hooks and no client directive: it renders on the server
 * (/esim, /pkg) and inside DestinationPlans alike.
 */

const TAG_CLASSES: Record<PlanRowTag["kind"], string> = {
  "best-value": "bg-brandBlue text-surface",
  discount: "bg-error/10 text-error",
  "calls-sms": "bg-brandTeal/15 text-brandInk",
};

/** GB number in brandBlue, unit in onSurfaceVariant (teal fails contrast on the light disc), ∞ + UNL for unlimited. Screen readers get the data label. */
export function PlanDataDisc({ plan }: { plan: PlanRowPlan }) {
  const disc = planDataDisc(plan);

  return (
    <span className="relative grid h-12 w-12 shrink-0 place-items-center rounded-full border border-brandBlue/15 bg-brandBlue/5 sm:h-16 sm:w-16">
      <span aria-hidden="true" className="flex max-w-full flex-col items-center px-1 leading-none">
        <span
          className={`max-w-full truncate font-display font-black text-brandBlue ${
            disc.unlimited ? "text-2xl sm:text-[28px]" : "text-base sm:text-xl"
          }`}
        >
          {disc.value}
        </span>
        {disc.unit ? (
          <span className="mt-0.5 text-[9px] font-black uppercase tracking-[0.08em] text-onSurfaceVariant sm:text-[10px]">
            {disc.unit}
          </span>
        ) : null}
      </span>
      <span className="sr-only">{plan.dataLabel}</span>
    </span>
  );
}

export function PlanTags({ tags, className = "" }: { tags: readonly PlanRowTag[]; className?: string }) {
  if (tags.length === 0) return null;

  return (
    <span className={`flex flex-wrap gap-1 ${className}`}>
      {tags.map((tag) => (
        <span
          className={`inline-flex h-5 items-center whitespace-nowrap rounded-full px-1.5 text-[10px] font-black uppercase tracking-[0.04em] ${TAG_CLASSES[tag.kind]}`}
          key={tag.kind}
        >
          {tag.label}
        </span>
      ))}
    </span>
  );
}

/** Strike-through original price while a discount is active (f078), then the charged price. */
export function PlanPrice({ plan }: { plan: PlanRowPlan }) {
  return (
    <span className="flex flex-col items-end">
      {hasActiveDiscount(plan) ? (
        <span className="text-xs font-semibold text-onSurfaceVariant line-through">{formatOriginalPrice(plan)}</span>
      ) : null}
      <span className="whitespace-nowrap font-display text-lg font-black leading-tight text-brandInk sm:text-xl">
        {plan.price}
      </span>
    </span>
  );
}

/** "Buy now": the list's best-value row is its one gradient primary, every other row is flat. */
export function PlanBuyLink({ href, primary, planTitle }: { href: string; primary: boolean; planTitle: string }) {
  return (
    <LinkButton
      aria-label={`Buy now: ${planTitle}`}
      className="whitespace-nowrap"
      href={href}
      size="md"
      variant={primary ? "primary" : "flat"}
    >
      Buy now
      <ArrowRight aria-hidden="true" className="hidden sm:block" size={16} />
    </LinkButton>
  );
}

type PlanRowProps = {
  plan: PlanRowPlan;
  /** planRowTags(plan, { position }). A "Best value" tag makes this row's Buy now the gradient one. */
  tags: readonly PlanRowTag[];
  /** Buy now target. Omit it to show the plan without a CTA (/pkg keeps its own actions). */
  buyHref?: string;
};

export function PlanRow({ plan, tags, buyHref }: PlanRowProps) {
  const bestValue = hasBestValueTag(tags);

  return (
    <article
      className={`relative flex items-center gap-3 rounded-[18px] border bg-surface p-3 sm:gap-4 sm:p-4 ${
        bestValue ? "border-brandBlue/40 shadow-brandGlow" : "border-outline/70"
      }`}
    >
      <PlanDataDisc plan={plan} />

      <div className="min-w-0 flex-1">
        <h2 className="font-display text-title-sm font-black text-brandInk sm:text-lg">{planDurationText(plan)}</h2>
        <PlanTags className="mt-1" tags={tags} />
        <p className="mt-1 truncate text-body-sm text-onSurfaceVariant">{planSubtitle(plan)}</p>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-2">
        <PlanPrice plan={plan} />
        {buyHref ? <PlanBuyLink href={buyHref} planTitle={plan.title} primary={bestValue} /> : null}
      </div>
    </article>
  );
}
```

Every `sr-only` here sits inside the disc's own `relative` box, so it stays contained even inside the `/esim` table's scroller (f195). The header comment says "no client directive" on purpose: the test asserts the file never contains the directive string.

- [ ] **Step 4: Run it and watch it pass**

Run: `pnpm exec vitest run src/app/components/countryPlansComponents.test.ts`
Expected: PASS, 2 tests.

- [ ] **Step 5: Full suite + types**

Run: `pnpm test && pnpm exec tsc --noEmit`
Expected: **76 files, 610 tests**; tsc clean.

- [ ] **Step 6: Commit (controller)**

```bash
git add src/app/components/PlanRow.tsx src/app/components/countryPlansComponents.test.ts
git commit -m "feat(plans): PlanRow (app CountryPlanRow at web scale) + reusable cell pieces"
```

---

### Task 5: `CountryBanner` + `CollapsedCountryBar`

Unused until Task 6.

**Files:**
- Create: `src/app/components/CountryBanner.tsx`, `src/app/components/CollapsedCountryBar.tsx`
- Test: `src/app/components/countryPlansComponents.test.ts` (append)

- [ ] **Step 1: Write the failing tests**

Append to `src/app/components/countryPlansComponents.test.ts`:

```ts
describe("CountryBanner", () => {
  it("is the rounded photo banner with a breadcrumb, clearing the navbar capsule", () => {
    const source = read("CountryBanner.tsx");

    expect(source).not.toContain('"use client"');
    expect(source).toContain('export const COUNTRY_BANNER_ID = "country-banner";');
    expect(source).toContain("rounded-b-[24px]");
    expect(source).toContain("bg-gradient-to-br from-brandBlue via-[#0E86C0] to-brandTeal");
    expect(source).toContain('aria-label="Breadcrumb"');
    expect(source).toContain('href="/destinations"');
    expect(source).toContain('aria-current="page"');
    // Capsule bottom: 68px below lg, 76px at lg. Content starts 24px under it.
    expect(source).toContain("pt-[92px]");
    expect(source).toContain("lg:pt-[100px]");
    // The photo credit is out of flow, so it can't shift anything when it appears.
    expect(source).toContain('className="absolute bottom-2 right-4');
    expect(source).not.toMatch(/#(?!0E86C0)[0-9a-fA-F]{3,6}\b/);
    expect(source).not.toContain("text-white");
  });
});

describe("CollapsedCountryBar", () => {
  it("pins back, flag, name and from-price once the banner scrolls away (phones/tablets only)", () => {
    const source = read("CollapsedCountryBar.tsx");

    expect(source).toContain('"use client"');
    expect(source).toContain("document.getElementById(COUNTRY_BANNER_ID)");
    expect(source).toContain("new IntersectionObserver(");
    expect(source).toContain("setShown(!entry.isIntersecting && entry.boundingClientRect.top < 0)");
    expect(source).toContain("observer.disconnect()");
    // Fixed (no layout shift), phone/tablet only, motion-safe, and inert while hidden.
    expect(source).toContain("fixed inset-x-0 top-0 z-40");
    expect(source).toContain("lg:hidden");
    expect(source).toContain("motion-safe:transition");
    expect(source).toContain("inert={!shown}");
    expect(source).toContain('aria-label="Back to destinations"');
    expect(source).toContain("grid h-11 w-11");
    expect(source).toContain("alt={`${country} flag`}");
    expect(source).toContain("from {fromPrice}");
    expect(source).not.toMatch(/#[0-9a-fA-F]{3,6}\b/);
  });
});
```

- [ ] **Step 2: Run them and watch them fail**

Run: `pnpm exec vitest run src/app/components/countryPlansComponents.test.ts`
Expected: 2 failed (ENOENT) and 2 passed.

- [ ] **Step 3: Implement the banner**

Create `src/app/components/CountryBanner.tsx`:

```tsx
import Link from "next/link";
import type { ReactNode } from "react";

/** CollapsedCountryBar watches this element: the bar appears once the banner has scrolled away. */
export const COUNTRY_BANNER_ID = "country-banner";

type CountryBannerProps = {
  /** Current page, the last breadcrumb item. */
  crumb: string;
  /** A `fill` next/image. The brand gradient shows until (or instead of) it. */
  photo?: ReactNode;
  /** Photo credit, pinned to the bottom-right corner, out of flow so it can't shift the layout. */
  credit?: ReactNode;
  children: ReactNode;
};

/**
 * Country hero for /esim/[slug] and the live plans view: a full-bleed photo
 * banner with a rounded bottom (app CountryHero), under the floating navbar.
 * The navbar capsule ends 68px down below lg and 76px at lg, so the content
 * starts 24px under it.
 */
export function CountryBanner({ crumb, photo, credit, children }: CountryBannerProps) {
  return (
    <section
      className="relative isolate overflow-hidden rounded-b-[24px] bg-gradient-to-br from-brandBlue via-[#0E86C0] to-brandTeal"
      id={COUNTRY_BANNER_ID}
    >
      {photo ? <div className="absolute inset-0 -z-20">{photo}</div> : null}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-gradient-to-t from-brandInk/95 via-brandInk/70 to-brandInk/40"
      />

      <div className="mx-auto max-w-6xl px-5 pb-8 pt-[92px] md:px-8 lg:pb-12 lg:pt-[100px]">
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-sm font-bold text-surface/70">
          <Link className="transition hover:text-surface" href="/">
            Home
          </Link>
          <span aria-hidden="true">/</span>
          <Link className="transition hover:text-surface" href="/destinations">
            Destinations
          </Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page" className="text-surface">
            {crumb}
          </span>
        </nav>

        {children}
      </div>

      {credit ? <div className="absolute bottom-2 right-4 text-[10px] text-surface/50">{credit}</div> : null}
    </section>
  );
}
```

The photo is at `-z-20` and the scrim at `-z-10`, inside `isolate`, so they paint above the section's gradient and below the text. The gradient is what shows until the photo loads, or instead of it.

- [ ] **Step 4: Implement the bar**

Create `src/app/components/CollapsedCountryBar.tsx`:

```tsx
"use client";

import { ChevronLeft, Globe2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { COUNTRY_BANNER_ID } from "./CountryBanner";

/** The bar is h-14. The banner counts as gone once its bottom slides under the bar. */
const BAR_HEIGHT_PX = 56;

type CollapsedCountryBarProps = {
  country: string;
  flagUri?: string;
  /** "€4.00": the destination's cheapest plan. */
  fromPrice?: string;
};

/**
 * Phones and tablets: once the CountryBanner scrolls away, a slim bar pins the
 * country to the top (app CollapsedCountryHeader). It's position:fixed, so it
 * never shifts the layout, and it's inert while hidden. lg+ has the sidebar.
 */
export function CollapsedCountryBar({ country, flagUri, fromPrice }: CollapsedCountryBarProps) {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const banner = document.getElementById(COUNTRY_BANNER_ID);
    if (!banner || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      ([entry]) => setShown(!entry.isIntersecting && entry.boundingClientRect.top < 0),
      { rootMargin: `-${BAR_HEIGHT_PX}px 0px 0px 0px` },
    );
    observer.observe(banner);

    return () => observer.disconnect();
  }, []);

  return (
    <div
      aria-hidden={!shown}
      className={`fixed inset-x-0 top-0 z-40 border-b border-outline/60 bg-surface/90 backdrop-blur-md motion-safe:transition motion-safe:duration-200 lg:hidden ${
        shown ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-full opacity-0"
      }`}
      data-collapsed-country-bar
      inert={!shown}
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-2 md:px-5">
        <Link
          aria-label="Back to destinations"
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-brandBlue transition hover:bg-brandBlue/5"
          href="/destinations"
        >
          <ChevronLeft aria-hidden="true" size={22} />
        </Link>

        {flagUri ? (
          <img
            alt={`${country} flag`}
            className="h-5 w-7 shrink-0 rounded-[4px] border border-outline/60 object-cover"
            src={flagUri}
          />
        ) : (
          <Globe2 aria-hidden="true" className="shrink-0 text-brandBlue" size={18} />
        )}

        <p className="min-w-0 flex-1 leading-tight">
          <span className="block truncate text-sm font-black text-brandInk">{country}</span>
          {fromPrice ? (
            <span className="block text-xs font-semibold text-onSurfaceVariant">from {fromPrice}</span>
          ) : null}
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Run them and watch them pass**

Run: `pnpm exec vitest run src/app/components/countryPlansComponents.test.ts`
Expected: PASS, 4 tests.

- [ ] **Step 6: Full suite + types**

Run: `pnpm test && pnpm exec tsc --noEmit`
Expected: **76 files, 612 tests**; tsc clean.

- [ ] **Step 7: Commit (controller)**

```bash
git add src/app/components/CountryBanner.tsx src/app/components/CollapsedCountryBar.tsx src/app/components/countryPlansComponents.test.ts
git commit -m "feat(plans): CountryBanner (photo banner + breadcrumb) and phone CollapsedCountryBar"
```

---

### Task 6: `/esim/[slug]`: banner, card-row table, sticky sidebar, restyled sections

**Files:**
- Modify: `src/app/EsimDestinationPage.tsx`, `src/app/esim/[slug]/page.tsx`
- Test: `src/app/seo-content-page.test.ts`

- [ ] **Step 1: Update the page's markup contract (failing first)**

Replace the whole of `src/app/seo-content-page.test.ts` with the version below. These are the **deliberate assertion changes**:
- `toContain("{h1}")` → `"name: h1,"`, `"{h1Lead}"` and the accent span. The H1 text is unchanged ("eSIM for <country>"), but the country name renders as the teal accent, and JSON-LD still uses `h1`.
- `'aria-label="Breadcrumb"'` is now asserted on `CountryBanner.tsx`, plus `<CountryBanner` in the page, because the breadcrumb moved into the shared banner.
- `toContain("bg-brandInk")` → `priority`, `fetchPriority="high"`, `<CollapsedCountryBar`, `overflow-x-clip` and `lg:sticky lg:top-6`. The dark card is gone; the banner's brandInk scrim lives in `CountryBanner`.
- The test title "uses the homepage visual language…" becomes "uses the app country hero and plan-row cards…".
- A new test pins the table semantics: caption, sr-only Buy, `scope="row"`, the explicit roles, `border-separate`, the shared pieces, and exactly two `variant="flat"` hero CTAs.

```ts
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("SEO content page template", () => {
  it("renders the shared site footer on guide, destination, and use-case pages", () => {
    const source = readFileSync("src/app/SeoContentPage.tsx", "utf8");

    expect(source).toContain('import { SiteFooter } from "./SiteFooter"');
    expect(source).toContain("<SiteFooter />");
  });

  it("renders destination pages with a keyword H1, breadcrumbs, and a live plan table", () => {
    const source = readFileSync("src/app/EsimDestinationPage.tsx", "utf8");
    const banner = readFileSync("src/app/components/CountryBanner.tsx", "utf8");

    // The H1 text is still "eSIM for <country>"; the country name is the teal accent.
    expect(source).toContain("name: h1,");
    expect(source).toContain("{h1Lead}");
    expect(source).toContain('{h1Accent ? <span className="text-brandTeal">{h1Accent}</span> : null}');
    expect(source).toContain("<CountryBanner");
    expect(banner).toContain('aria-label="Breadcrumb"');
    expect(source).toContain("<table");
    expect(source).toContain("Related destinations");
    expect(source).toContain("Plans from €");
    expect(source).toContain("Buy from €");
    expect(source).toContain("are the cheapest on the market");
  });

  it("uses the app country hero and plan-row cards for the destination hero and plan section", () => {
    const source = readFileSync("src/app/EsimDestinationPage.tsx", "utf8");

    expect(source).toContain('import Image from "next/image"');
    expect(source).toContain('src="/images/mountain.webp"');
    // The banner photo is the LCP element.
    expect(source).toContain("priority");
    expect(source).toContain('fetchPriority="high"');
    expect(source).toContain("rounded-[26px]");
    expect(source).toContain("Live plan pricing");
    expect(source).toContain("Ready before you land");
    expect(source).toContain("<CollapsedCountryBar");
    // Sticky sidebar at lg needs a non-scrolling main: overflow-x-clip, not hidden.
    expect(source).toContain('<main className="min-h-screen overflow-x-clip');
    expect(source).toContain("lg:sticky lg:top-6");
  });

  it("keeps the plan table's semantics while its rows render as plan-row cards", () => {
    const source = readFileSync("src/app/EsimDestinationPage.tsx", "utf8");

    expect(source).toContain('<caption className="sr-only">');
    expect(source).toContain('<span className="sr-only">Buy</span>');
    expect(source).toContain('scope="row"');
    // Phones switch rows to display:grid, so the roles are explicit (Safari drops them otherwise).
    expect(source).toContain('role="table"');
    expect(source).toContain('role="rowgroup"');
    expect(source).toContain('role="row"');
    expect(source).toContain('role="columnheader"');
    expect(source).toContain('role="rowheader"');
    expect(source).toContain('role="cell"');
    expect(source).toContain("sm:border-separate sm:border-spacing-y-2");
    // Same pieces and rules as PlanRow; the best-value row has the page's only gradient CTA.
    expect(source).toContain("planRowTags(plan, { position: index })");
    expect(source).toContain("<PlanDataDisc plan={plan} />");
    expect(source).toContain("<PlanPrice plan={plan} />");
    expect(source).toContain("primary={bestValue}");
    expect(source).toContain("href={`/checkout?package=${encodeURIComponent(plan.id)}`}");
    expect(source.match(/variant="flat"/g)).toHaveLength(2);
    expect(source).not.toContain("text-white");
    expect(source).not.toContain("bg-white");
    expect(source).not.toMatch(/#[0-9a-fA-F]{3,6}\b/);
  });
});
```

Run: `pnpm exec vitest run src/app/seo-content-page.test.ts`
Expected: FAIL, 3 failed and 1 passed.

- [ ] **Step 2: Rewrite the page view**

Replace the whole of `src/app/EsimDestinationPage.tsx` with:

```tsx
import { ArrowRight, CheckCircle2, CircleHelp } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { JsonLd } from "./JsonLd";
import { Navbar } from "./components/Navbar";
import { LinkButton } from "./components/Button";
import { CountryBanner } from "./components/CountryBanner";
import { CollapsedCountryBar } from "./components/CollapsedCountryBar";
import { PlanBuyLink, PlanDataDisc, PlanPrice, PlanTags } from "./components/PlanRow";
import { SiteFooter } from "./SiteFooter";
import { landingContent } from "@/content/landing";
import {
  destinationPages,
  priorityDestinationEnhancements,
  type SeoContentPage
} from "@/content/seo-pages";
import { destinationDisplay, destinationH1 } from "@/lib/esim-routes";
import {
  createContentPageJsonLd,
  type DestinationOfferInput
} from "@/lib/seo";
import type { DestinationPlanRow } from "@/lib/destinationPricing";
import { convertEurToGbp, formatGbp } from "@/lib/exchangeRate";
import { hasBestValueTag, planDurationText, planRowTags } from "@/lib/planRow";

function relatedDestinationLinks(slug: string) {
  const related = destinationDisplay[slug]?.relatedSlugs ?? [];
  return related
    .map((relatedSlug) => {
      const page = destinationPages.find((entry) => entry.slug === relatedSlug);
      const name = destinationDisplay[relatedSlug]?.countryName;
      if (!page || !name) return null;
      return { href: page.path, label: `${name} eSIM plans` };
    })
    .filter((link): link is { href: string; label: string } => link !== null);
}

function trustPoints(offer?: DestinationOfferInput) {
  return [
    ["Live plan pricing", offer ? `${offer.offerCount} options available` : "Compare current options"],
    ["Ready before you land", "Install on stable Wi-Fi"],
    ["Data-first travel", "Keep your usual number"]
  ];
}

/*
 * Plan table cells. Phones: each row is a PlanRow-style card (display:grid), so
 * the table, its rows and cells carry explicit ARIA roles: changing a table's
 * display drops its semantics in some browsers (Safari) otherwise. sm+: a real
 * table with border-separate card rows.
 */
const CELL = "p-0 sm:border-y sm:bg-surface sm:px-4 sm:py-3 sm:align-middle";
const FIRST_CELL = "sm:rounded-l-[18px] sm:border-l";
const LAST_CELL = "sm:rounded-r-[18px] sm:border-r";

export function EsimDestinationPageView({
  page,
  offer,
  plans,
  coverage = [],
  gbpRate,
  flagUri
}: {
  page: SeoContentPage;
  offer?: DestinationOfferInput;
  plans: DestinationPlanRow[];
  /** Countries every plan covers; only set for regional destinations. */
  coverage?: string[];
  gbpRate?: number;
  /** The destination's flag image, when the catalog has one. */
  flagUri?: string;
}) {
  const countryName = destinationDisplay[page.slug]?.countryName ?? page.eyebrow;
  const h1 = destinationH1(page.slug) ?? `eSIM for ${countryName}`;
  // "eSIM for <country>": the country name is the H1's teal accent.
  const accentStart = h1.lastIndexOf(countryName);
  const h1Lead = accentStart > 0 ? h1.slice(0, accentStart) : h1;
  const h1Accent = accentStart > 0 ? h1.slice(accentStart) : "";
  const neighborLinks = relatedDestinationLinks(page.slug);
  const lowestPriced = plans[0];
  const coverageNote = destinationDisplay[page.slug]?.coverageNote;
  const sections = [
    ...page.sections,
    ...(priorityDestinationEnhancements[page.slug] ?? [])
  ];

  return (
    <main className="min-h-screen overflow-x-clip bg-surface text-onSurface">
      <JsonLd
        data={createContentPageJsonLd({
          path: page.path,
          name: h1,
          description: page.description,
          breadcrumbName: countryName,
          parent: { name: "Destinations", path: "/destinations" },
          faqs: page.faqs,
          offer
        })}
      />
      <Navbar />

      <article>
        <CountryBanner
          crumb={countryName}
          photo={
            <Image
              alt=""
              className="object-cover"
              fetchPriority="high"
              fill
              priority
              sizes="100vw"
              src="/images/mountain.webp"
            />
          }
        >
          <div className="mt-6 flex items-center gap-3">
            {flagUri ? (
              <img
                alt={`${countryName} flag`}
                className="h-8 w-8 shrink-0 rounded-full border border-surface/30 object-cover"
                src={flagUri}
              />
            ) : null}
            <p className="text-label-caps uppercase text-brandTeal">{page.eyebrow}</p>
          </div>
          <h1 className="mt-3 max-w-4xl font-display text-[34px] font-black leading-[1.08] tracking-[-0.03em] text-surface sm:text-5xl lg:text-[56px]">
            {h1Lead}
            {h1Accent ? <span className="text-brandTeal">{h1Accent}</span> : null}
          </h1>
          <p className="mt-3 max-w-3xl text-lg font-semibold text-surface/90">{page.heading}</p>
          {offer ? (
            <p className="mt-5 inline-flex flex-wrap items-center gap-x-1 rounded-full border border-surface/20 bg-surface/10 px-4 py-2 text-sm font-black text-surface backdrop-blur">
              Plans from €{offer.lowPrice.toFixed(2)} to €{offer.highPrice.toFixed(2)}
              {gbpRate
                ? ` (~${formatGbp(convertEurToGbp(offer.lowPrice, gbpRate))}–${formatGbp(
                    convertEurToGbp(offer.highPrice, gbpRate)
                  )})`
                : ""}
              {offer.offerCount > 0 ? ` · ${offer.offerCount} plans` : ""}
            </p>
          ) : null}
          {offer && gbpRate ? (
            <p className="mt-2 text-xs font-semibold text-surface/60">
              Approximate GBP conversion, updated daily. You&apos;re charged in EUR at checkout.
            </p>
          ) : null}
          <p className="mt-5 max-w-3xl text-base leading-7 text-surface/75 sm:text-lg sm:leading-8">{page.intro}</p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            {/* Flat: the best-value row's Buy now is this page's one gradient CTA. */}
            <LinkButton href="#plans" size="lg" variant="flat">
              {offer ? `Buy from €${offer.lowPrice.toFixed(2)}` : "View plans"}
              <ArrowRight aria-hidden="true" size={18} />
            </LinkButton>
            <LinkButton href={landingContent.appLinks.ios.href} size="lg" variant="flat">
              {landingContent.appLinks.ios.label}
              <ArrowRight aria-hidden="true" size={18} />
            </LinkButton>
          </div>
        </CountryBanner>

        <CollapsedCountryBar
          country={countryName}
          flagUri={flagUri}
          fromPrice={offer ? `€${offer.lowPrice.toFixed(2)}` : undefined}
        />

        <section className="px-5 py-10 md:px-8 md:py-16" id="plans">
          <div className="mx-auto max-w-6xl lg:grid lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start lg:gap-8">
            <div className="min-w-0">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-label-caps uppercase text-brandBlue">Plan comparison</p>
                  <h2 className="mt-2 font-display text-display-lg font-black text-brandInk md:text-[32px] md:leading-[38px]">
                    Live {countryName} eSIM plans
                  </h2>
                </div>
                <span className="w-fit rounded-full border border-brandBlue/20 bg-brandBlue/5 px-4 py-2 text-xs font-black text-brandBlue">
                  Current availability
                </span>
              </div>
              <p className="mt-4 max-w-3xl leading-7 text-onSurfaceVariant">
                Prices are what eSIM2you currently sells for this destination. We do not claim these
                are the cheapest on the market. Prefer the lowest-priced row for a short trip, or a
                higher-data / longer-validity row when that matches your itinerary.
              </p>
              {lowestPriced ? (
                <p className="mt-3 text-sm font-bold text-brandInk">
                  Best value starting point: {lowestPriced.dataLabel} for {lowestPriced.durationLabel} at{" "}
                  {lowestPriced.price}.
                </p>
              ) : null}

              {/* `relative` keeps the sr-only (absolute) caption, "Buy" header and phone thead
                  inside this scroller; without it they escape to the page and widen the mobile
                  layout viewport (375px phones rendered /esim/* at 479px, f195). */}
              {plans.length > 0 ? (
                <div className="relative mt-8 overflow-x-auto">
                  <table className="block w-full text-left text-sm sm:table sm:border-separate sm:border-spacing-y-2" role="table">
                    <caption className="sr-only">
                      {countryName} eSIM plans with data, validity, network, and price
                    </caption>
                    <thead
                      className="sr-only sm:not-sr-only sm:table-header-group"
                      role="rowgroup"
                    >
                      <tr className="text-label-caps uppercase text-onSurfaceVariant" role="row">
                        <th className="px-4 pb-1" role="columnheader" scope="col">
                          Data
                        </th>
                        <th className="px-4 pb-1" role="columnheader" scope="col">
                          Plan
                        </th>
                        <th className="px-4 pb-1" role="columnheader" scope="col">
                          Validity
                        </th>
                        <th className="px-4 pb-1" role="columnheader" scope="col">
                          Network
                        </th>
                        <th className="px-4 pb-1 text-right" role="columnheader" scope="col">
                          Price
                        </th>
                        <th className="px-4 pb-1" role="columnheader" scope="col">
                          <span className="sr-only">Buy</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="grid gap-2 sm:table-row-group" role="rowgroup">
                      {plans.map((plan, index) => {
                        const tags = planRowTags(plan, { position: index });
                        const bestValue = hasBestValueTag(tags);
                        const border = bestValue ? "border-brandBlue/40" : "border-outline/70";

                        return (
                          <tr
                            className={`grid grid-cols-[48px_minmax(0,1fr)_auto] gap-x-3 gap-y-1 rounded-[18px] border bg-surface p-3 sm:table-row sm:rounded-none sm:border-0 sm:bg-transparent sm:p-0 ${border}`}
                            key={plan.id}
                            role="row"
                          >
                            <td
                              className={`${CELL} ${FIRST_CELL} ${border} col-start-1 row-span-3 row-start-1 self-center`}
                              role="cell"
                            >
                              <PlanDataDisc plan={plan} />
                            </td>
                            <th
                              className={`${CELL} ${border} col-span-2 col-start-2 row-start-1 font-bold text-brandInk`}
                              role="rowheader"
                              scope="row"
                            >
                              {plan.title}
                              <PlanTags className="mt-1" tags={tags} />
                            </th>
                            <td
                              className={`${CELL} ${border} col-start-2 row-start-2 self-center text-xs text-onSurfaceVariant sm:text-sm`}
                              role="cell"
                            >
                              {planDurationText(plan)}
                            </td>
                            <td
                              className={`${CELL} ${border} col-start-2 row-start-3 self-center text-xs text-onSurfaceVariant sm:text-sm`}
                              role="cell"
                            >
                              {plan.network}
                            </td>
                            <td
                              className={`${CELL} ${border} col-start-3 row-start-2 self-center text-right`}
                              role="cell"
                            >
                              <PlanPrice plan={plan} />
                            </td>
                            <td
                              className={`${CELL} ${LAST_CELL} ${border} col-start-3 row-start-3 text-right`}
                              role="cell"
                            >
                              <PlanBuyLink
                                href={`/checkout?package=${encodeURIComponent(plan.id)}`}
                                planTitle={plan.title}
                                primary={bestValue}
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="mt-8 rounded-[20px] border border-outline/70 bg-surfaceBright p-6 text-onSurfaceVariant">
                  Live plans for this destination are loading or temporarily unavailable. Browse all
                  destinations or check back shortly.
                </p>
              )}

              {coverage.length > 0 ? (
                <div className="mt-8 rounded-[26px] border border-outline/70 bg-surfaceBright p-5 md:p-8" id="coverage">
                  <h3 className="font-display text-headline-md font-black text-brandInk">
                    {coverage.length} countries covered by every {countryName} plan
                  </h3>
                  {coverageNote ? (
                    <p className="mt-3 max-w-3xl leading-7 text-onSurfaceVariant">{coverageNote}</p>
                  ) : null}
                  <ul className="mt-5 flex flex-wrap gap-2">
                    {coverage.map((country) => (
                      <li
                        className="rounded-full border border-outline/70 bg-surface px-3 py-1.5 text-sm font-bold text-brandInk"
                        key={country}
                      >
                        {country}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>

            <aside className="mt-8 lg:sticky lg:top-6 lg:mt-0">
              <ul className="grid gap-4 rounded-[20px] border border-outline/70 bg-surface p-5 shadow-brandCard sm:grid-cols-3 lg:grid-cols-1">
                {trustPoints(offer).map(([label, value]) => (
                  <li className="flex items-start gap-3" key={label}>
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[12px] bg-brandBlue/10 text-brandBlue">
                      <CheckCircle2 aria-hidden="true" size={18} />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-black text-brandInk">{label}</span>
                      <span className="mt-0.5 block text-xs font-semibold text-onSurfaceVariant">{value}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </aside>
          </div>
        </section>

        <section className="px-5 pb-16 md:px-8 md:pb-24">
          <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
            <div className="min-w-0 space-y-4">
              {sections.map((section) => (
                <section className="rounded-[20px] border border-outline/70 bg-surface p-5 sm:p-7" key={section.title}>
                  <div className="flex gap-4">
                    <span className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-[12px] bg-brandBlue/10 text-brandBlue">
                      <CheckCircle2 aria-hidden="true" size={20} />
                    </span>
                    <div className="min-w-0">
                      <h2 className="font-display text-headline-md font-black text-brandInk">{section.title}</h2>
                      <p className="mt-2 leading-7 text-onSurfaceVariant">{section.body}</p>
                    </div>
                  </div>
                </section>
              ))}
              <section className="rounded-[20px] border border-outline/70 bg-surface p-5 sm:p-7">
                <h2 className="font-display text-headline-md font-black text-brandInk">How to install</h2>
                <p className="mt-2 leading-7 text-onSurfaceVariant">
                  Check that your phone supports eSIM, install the profile on Wi-Fi before you travel,
                  then enable the travel data line when you arrive. See the{" "}
                  <Link className="font-bold text-brandBlue" href="/travel/how-to-install-esim">
                    travel eSIM installation guide
                  </Link>
                  .
                </p>
              </section>
            </div>

            <aside className="h-fit space-y-4">
              {neighborLinks.length > 0 ? (
                <div className="rounded-[20px] border border-outline/70 bg-surfaceBright p-5 sm:p-6">
                  <h2 className="font-display text-title-sm font-black text-brandInk sm:text-xl">Related destinations</h2>
                  <div className="mt-4 grid gap-2">
                    {neighborLinks.map((link) => (
                      <Link
                        className="flex min-h-11 items-center justify-between gap-3 rounded-[14px] border border-outline/70 bg-surface px-4 py-2.5 text-sm font-bold text-brandInk transition hover:border-brandBlue/50"
                        href={link.href}
                        key={link.href}
                      >
                        {link.label}
                        <ArrowRight aria-hidden="true" className="shrink-0 text-brandBlue" size={16} />
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null}
              <div className="rounded-[20px] border border-outline/70 bg-surfaceBright p-5 sm:p-6">
                <h2 className="font-display text-title-sm font-black text-brandInk sm:text-xl">Guides</h2>
                <div className="mt-4 grid gap-2">
                  {page.relatedLinks.map((link) => (
                    <Link
                      className="flex min-h-11 items-center justify-between gap-3 rounded-[14px] border border-outline/70 bg-surface px-4 py-2.5 text-sm font-bold text-brandInk transition hover:border-brandBlue/50"
                      href={link.href}
                      key={link.href}
                    >
                      {link.label}
                      <ArrowRight aria-hidden="true" className="shrink-0 text-brandBlue" size={16} />
                    </Link>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </section>

        <section className="bg-surfaceBright px-5 py-16 md:px-8 md:py-24">
          <div className="mx-auto max-w-3xl">
            <p className="text-center text-label-caps uppercase text-brandBlue">FAQ</p>
            <h2 className="mt-2 text-center font-display text-display-lg font-black text-brandInk md:text-[32px] md:leading-[38px]">
              Quick answers before you travel.
            </h2>
            <div className="mt-8 space-y-3">
              {page.faqs.map((faq) => (
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
          </div>
        </section>
      </article>
      <SiteFooter />
    </main>
  );
}
```

What stays byte-identical in behavior:
- the `JsonLd` call (Product/AggregateOffer + FAQ + breadcrumb);
- `relatedDestinationLinks`;
- the "Plans from €… (~£…) · N plans" line and the GBP note;
- "Buy from €X";
- the disclaimer and "Best value starting point";
- the caption text, the sr-only "Buy" header and the `/checkout?package=` hrefs;
- the coverage block with its `id="coverage"`;
- the sections, install copy, related/guides links and the FAQ `<details>`.

- [ ] **Step 3: Pass the flag in**

Replace the whole of `src/app/esim/[slug]/page.tsx` with:

```tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EsimDestinationPageView } from "../../EsimDestinationPage";
import { destinationPages } from "@/content/seo-pages";
import { createMetadata } from "@/lib/seo";
import {
  getDestinationCoverage,
  getDestinationFlag,
  getDestinationOffer,
  getDestinationPlanRows
} from "@/lib/destinationPricing";
import { getGbpRate } from "@/lib/exchangeRate";

export const revalidate = 3600;

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export function generateStaticParams() {
  return destinationPages.map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = destinationPages.find((entry) => entry.slug === slug);

  if (!page) {
    return {};
  }

  return createMetadata({
    path: page.path,
    title: page.title,
    description: page.description
  });
}

export default async function EsimDestinationPage({ params }: PageProps) {
  const { slug } = await params;
  const page = destinationPages.find((entry) => entry.slug === slug);

  if (!page) {
    notFound();
  }

  const [offer, plans, coverage, gbpRate, flagUri] = await Promise.all([
    getDestinationOffer(page.slug),
    getDestinationPlanRows(page.slug),
    getDestinationCoverage(page.slug),
    page.slug === "uk" ? getGbpRate() : Promise.resolve(null),
    getDestinationFlag(page.slug)
  ]);

  return (
    <EsimDestinationPageView
      offer={offer ?? undefined}
      page={page}
      plans={plans}
      coverage={coverage}
      gbpRate={gbpRate ?? undefined}
      flagUri={flagUri ?? undefined}
    />
  );
}
```

- [ ] **Step 4: Run the page tests**

Run: `pnpm exec vitest run src/app/seo-content-page.test.ts src/app/core-web-vitals.test.ts src/lib/destinationPricing.test.ts`
Expected: PASS: 4 + 7 + 9 tests. The core-web-vitals f195 guard still matches `className="relative mt-8 overflow-x-auto"`.

- [ ] **Step 5: Full suite + types**

Run: `pnpm test && pnpm exec tsc --noEmit`
Expected: **76 files, 613 tests**; tsc clean.

- [ ] **Step 6: Look at it**

Run `pnpm dev` and open `/esim/usa` (Calls + SMS rows) and `/esim/croatia` (discounted rows).
- **375px:** the banner shows the breadcrumb, flag, a teal "USA" and the two white flat CTAs. Rows are cards: disc | title + tags | validity / network | price | Buy now. Only the first row's Buy now is a gradient. After scrolling past the banner, the white bar shows back, flag, "USA" and "from €4.00".
- **1440px:** the table has a small-caps header row, card rows 90px tall, and the sticky trust card on the right.

- [ ] **Step 7: Commit (controller)**

```bash
git add src/app/EsimDestinationPage.tsx "src/app/esim/[slug]/page.tsx" src/app/seo-content-page.test.ts
git commit -m "feat(esim): app country hero, card-row plan table, sticky trust sidebar"
```

---

### Task 7: Live-view pieces: filter bar, sidebar, states, hero-image hook

Unused until Task 8. `useCountryHeroImage` is moved from `DestinationPlans.tsx` lines 244–330, unchanged except formatting.

**Files:**
- Create: `src/app/destinations/useCountryHeroImage.ts`, `src/app/destinations/PlanFilterBar.tsx`, `src/app/destinations/PlansSidebar.tsx`, `src/app/destinations/PlansStates.tsx`
- Test: `src/app/destinations/destinationPlans-wiring.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/app/destinations/destinationPlans-wiring.test.ts` with the header and the first block. Task 8 appends the `DestinationPlans` block.

```ts
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function read(file: string) {
  return readFileSync(join(process.cwd(), "src/app/destinations", file), "utf8");
}

describe("live plans view pieces", () => {
  it("PlanFilterBar: one scrollable row of 44px chips, sort on the right", () => {
    const source = read("PlanFilterBar.tsx");

    expect(source).toContain("PLAN_FILTERS.map(");
    expect(source).toContain("PLAN_SORTS.map(");
    expect(source).toContain("aria-pressed={active}");
    expect(source).toContain("h-[46px] shrink-0 whitespace-nowrap rounded-full");
    // f209: the nowrap row can't widen its flex parent; f195: the scroller is positioned.
    expect(source).toContain('className="min-w-0 flex-1 [contain:inline-size]"');
    expect(source).toContain('className="relative flex gap-2 overflow-x-auto');
    // Sort: a 46px icon target on phones (invisible native select on top), labelled select from sm.
    expect(source).toContain("relative flex h-[46px] w-[46px] shrink-0");
    expect(source).toContain("absolute inset-0 h-full w-full cursor-pointer");
    expect(source).toContain("sm:static sm:h-11 sm:w-auto sm:opacity-100");
    expect(source).not.toMatch(/#[0-9a-fA-F]{3,6}\b/);
    expect(source).not.toContain("text-white");
  });

  it("PlansSidebar keeps the DestinationStats and PlansSupportBar content", () => {
    const source = read("PlansSidebar.tsx");

    for (const text of [
      '"plan available"',
      '"plans available"',
      '"Instant activation"',
      '"Start using in minutes"',
      '"Fast data"',
      '"Premium local networks"',
      '"Secure checkout"',
      '"Encrypted and trusted"',
      "All plans include premium network access and 24/7 customer support.",
      "Visit Help Center",
      'href="/support"',
    ]) {
      expect(source).toContain(text);
    }
    expect(source).toContain("min-h-11");
  });

  it("PlansStates: tokens only, a loading skeleton shaped like the loaded view", () => {
    const source = read("PlansStates.tsx");

    expect(source).toContain("Plans are temporarily unavailable");
    expect(source).toContain("No plans match this filter");
    expect(source).toContain("Show all plans");
    expect(source).toContain("No plans found for this destination");
    expect(source).toContain('href="/destinations"');
    expect(source).toContain("lg:grid-cols-[minmax(0,1fr)_280px]");
    expect(source).toContain('<div aria-hidden="true" className="lg:grid');
    expect(source).not.toMatch(/#[0-9a-fA-F]{3,6}\b/);
    expect(source).not.toContain("bg-white");
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `pnpm exec vitest run src/app/destinations/destinationPlans-wiring.test.ts`
Expected: FAIL, 3 × ENOENT.

- [ ] **Step 3: Move the hook**

Create `src/app/destinations/useCountryHeroImage.ts`:

```ts
import { useEffect, useState } from "react";

export type CountryHeroImage = {
  imageUrl: string;
  alt: string;
  sourceUrl: string;
};

/**
 * The live plans view's banner photo, from /bff/country-image (f153). Moved
 * out of DestinationPlans unchanged.
 */
export function useCountryHeroImage(input: { country?: string; slug?: string }) {
  const [image, setImage] = useState<CountryHeroImage | null>(null);
  const [loading, setLoading] = useState(false);

  const country = input.country?.trim() ?? "";
  const slug = input.slug?.trim() ?? "";

  useEffect(() => {
    if (!country && !slug) {
      setImage(null);
      setLoading(false);
      return;
    }

    const countryName = country;
    const destinationSlug = slug;
    const controller = new AbortController();

    async function loadCountryImage() {
      try {
        setLoading(true);

        const params = new URLSearchParams();
        if (destinationSlug) params.set("slug", destinationSlug);
        if (countryName) params.set("country", countryName);

        const response = await fetch(`/bff/country-image?${params.toString()}`, {
          signal: controller.signal,
          cache: "force-cache",
        });

        if (!response.ok) {
          throw new Error(`Country image request failed: ${response.status}`);
        }

        const payload = (await response.json()) as CountryHeroImage;

        if (!payload.imageUrl) {
          throw new Error("Country image URL is missing");
        }

        setImage(payload);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        console.error("Failed to load country hero image:", error);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadCountryImage();

    return () => {
      controller.abort();
    };
  }, [country, slug]);

  return { image, loading };
}
```

- [ ] **Step 4: The filter bar**

Create `src/app/destinations/PlanFilterBar.tsx`:

```tsx
import { ArrowDownUp } from "lucide-react";
import { PLAN_FILTERS, PLAN_SORTS, type PlanFilter, type PlanSort } from "./planList";

type PlanFilterBarProps = {
  filter: PlanFilter;
  sort: PlanSort;
  onFilterChange: (filter: PlanFilter) => void;
  onSortChange: (sort: PlanSort) => void;
};

/** The six filter chips as one sideways-scrolling row, with the sort on the right. */
export function PlanFilterBar({ filter, sort, onFilterChange, onSortChange }: PlanFilterBarProps) {
  return (
    <div className="flex items-center gap-3">
      {/* contain:inline-size stops the unwrapped chip row from widening the page (f209);
          the scroller is positioned (f195). */}
      <div className="min-w-0 flex-1 [contain:inline-size]">
        <div aria-label="Filter plans" className="relative flex gap-2 overflow-x-auto [scrollbar-width:none]" role="group">
          {PLAN_FILTERS.map((item) => {
            const active = filter === item.value;

            return (
              <button
                aria-pressed={active}
                className={`h-[46px] shrink-0 whitespace-nowrap rounded-full border px-4 text-xs font-black transition ${
                  active
                    ? "border-brandBlue bg-brandBlue text-surface"
                    : "border-outline bg-surface text-onSurfaceVariant hover:border-brandBlue/50 hover:text-brandInk"
                }`}
                key={item.value}
                onClick={() => onFilterChange(item.value)}
                type="button"
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Phones: a 46px icon button with the native select stretched invisibly over it.
          sm+: "Sort by" + the visible select. */}
      <label className="relative flex h-[46px] w-[46px] shrink-0 items-center justify-center gap-2 rounded-full border border-outline bg-surface focus-within:ring-2 focus-within:ring-brandBlue sm:w-auto sm:justify-start sm:pl-4 sm:pr-2">
        <ArrowDownUp aria-hidden="true" className="text-brandBlue" size={15} />
        <span className="sr-only sm:not-sr-only sm:whitespace-nowrap sm:text-[11px] sm:font-bold sm:text-onSurfaceVariant">
          Sort by
        </span>
        <select
          className="absolute inset-0 h-full w-full cursor-pointer bg-surface text-xs font-black text-brandInk opacity-0 outline-none sm:static sm:h-11 sm:w-auto sm:opacity-100"
          onChange={(event) => onSortChange(event.target.value as PlanSort)}
          value={sort}
        >
          {PLAN_SORTS.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
```

There's no client directive. Like `PlansStates`, it's only imported from the client `DestinationPlans`, so the handlers stay on the client side. Below sm, the sr-only "Sort by" sits inside the `relative` label (f195-safe) and still names the select.

- [ ] **Step 5: The sidebar**

Create `src/app/destinations/PlansSidebar.tsx`:

```tsx
import { ArrowRight, CalendarDays, ShieldCheck, Signal, Zap } from "lucide-react";
import Link from "next/link";

/**
 * The trust points and support line that used to sit above and below the plan
 * cards (DestinationStats + PlansSupportBar). A sticky right column at lg+,
 * after the plan list on phones.
 */
export function PlansSidebar({ plansCount }: { plansCount: number }) {
  const stats = [
    {
      icon: CalendarDays,
      title: String(plansCount),
      description: plansCount === 1 ? "plan available" : "plans available",
    },
    { icon: Zap, title: "Instant activation", description: "Start using in minutes" },
    { icon: Signal, title: "Fast data", description: "Premium local networks" },
    { icon: ShieldCheck, title: "Secure checkout", description: "Encrypted and trusted" },
  ];

  return (
    <aside className="rounded-[20px] border border-outline/70 bg-surface p-5 shadow-brandCard">
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
        {stats.map(({ icon: Icon, title, description }) => (
          <li className="flex items-center gap-3" key={title}>
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[12px] bg-brandBlue/10 text-brandBlue">
              <Icon aria-hidden={true} size={18} />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-black text-brandInk">{title}</span>
              <span className="mt-0.5 block text-xs text-onSurfaceVariant">{description}</span>
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-5 border-t border-outline/70 pt-4">
        <p className="flex gap-3 text-sm leading-6 text-onSurfaceVariant">
          <ShieldCheck aria-hidden="true" className="mt-0.5 shrink-0 text-brandBlue" size={18} />
          All plans include premium network access and 24/7 customer support.
        </p>
        <Link className="mt-1 inline-flex min-h-11 items-center gap-2 text-sm font-black text-brandBlue" href="/support">
          Visit Help Center
          <ArrowRight aria-hidden="true" size={16} />
        </Link>
      </div>
    </aside>
  );
}
```

- [ ] **Step 6: The states**

Create `src/app/destinations/PlansStates.tsx`:

```tsx
import { Globe2, Headphones, Wifi } from "lucide-react";
import { Button, LinkButton } from "../components/Button";

/** Same grid, bar height and row height as the loaded view, so the swap doesn't shift the page. */
export function PlansLoading({ withFilters }: { withFilters: boolean }) {
  return (
    <div aria-hidden="true" className="lg:grid lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start lg:gap-8">
      <div className="min-w-0">
        {withFilters ? <div className="h-[46px] animate-pulse rounded-full bg-surfaceBright" /> : null}
        <div className="mt-4 grid gap-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div className="h-[106px] animate-pulse rounded-[18px] border border-outline/70 bg-surfaceBright sm:h-[114px]" key={index} />
          ))}
        </div>
      </div>
      <div className="mt-8 hidden h-[316px] animate-pulse rounded-[20px] border border-outline/70 bg-surfaceBright lg:mt-0 lg:block" />
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="mx-auto max-w-2xl rounded-[20px] border border-error/30 bg-error/5 p-8 text-center">
      <Headphones aria-hidden="true" className="mx-auto text-error" size={32} />
      <h2 className="mt-4 font-display text-headline-md font-black text-brandInk">Plans are temporarily unavailable</h2>
      <p className="mt-2 text-sm leading-6 text-onSurfaceVariant">{message}</p>
    </div>
  );
}

export function EmptyFilterState({ onReset }: { onReset: () => void }) {
  return (
    <div className="mt-4 rounded-[20px] border border-outline/70 bg-surfaceBright p-8 text-center sm:p-10">
      <Wifi aria-hidden="true" className="mx-auto text-brandBlue" size={30} />
      <h2 className="mt-4 font-display text-title-sm font-black text-brandInk sm:text-xl">No plans match this filter</h2>
      <p className="mt-2 text-sm text-onSurfaceVariant">Choose another data or validity option.</p>
      <Button className="mt-5" onClick={onReset}>
        Show all plans
      </Button>
    </div>
  );
}

export function MissingDestinationState() {
  return (
    <div className="mx-auto max-w-2xl rounded-[24px] border border-outline/70 bg-surfaceBright p-9 text-center">
      <Globe2 aria-hidden="true" className="mx-auto text-brandBlue" size={34} />
      <h2 className="mt-5 font-display text-headline-md font-black text-brandInk">No plans found for this destination</h2>
      <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-onSurfaceVariant">
        Search for another destination or return to the destination directory.
      </p>
      <LinkButton className="mt-6" href="/destinations">
        View all destinations
      </LinkButton>
    </div>
  );
}
```

The copy is the same as the old `PlansLoading`/`ErrorState`/`EmptyFilterState`/`MissingDestinationState`. The colors are tokens (`bg-mist` → `bg-surfaceBright`), and "Show all plans" grows from `size="sm"` (34px) to the default `md` (46px). It stays the gradient primary because no rows are shown in that state.

- [ ] **Step 7: Run it and watch it pass**

Run: `pnpm exec vitest run src/app/destinations/destinationPlans-wiring.test.ts`
Expected: PASS, 3 tests.

- [ ] **Step 8: Full suite + types**

Run: `pnpm test && pnpm exec tsc --noEmit`
Expected: **77 files, 616 tests**; tsc clean.

- [ ] **Step 9: Commit (controller)**

```bash
git add src/app/destinations/useCountryHeroImage.ts src/app/destinations/PlanFilterBar.tsx src/app/destinations/PlansSidebar.tsx src/app/destinations/PlansStates.tsx src/app/destinations/destinationPlans-wiring.test.ts
git commit -m "feat(plans): live-view filter bar, sidebar, states and hero-image hook as their own files"
```

---

### Task 8: `DestinationPlans`: banner, chip row, PlanRow list, sticky sidebar, collapsed bar

**Files:**
- Rewrite: `src/app/destinations/DestinationPlans.tsx`
- Modify: `src/app/destinations/page.tsx`, `src/app/globals.css`
- Test: `src/app/destinations/destinationPlans-wiring.test.ts` (append), `src/app/public-shell.test.ts`, `src/app/discount-display-wiring.test.ts`

- [ ] **Step 1: Update the contracts (failing first)**

(a) Append to `src/app/destinations/destinationPlans-wiring.test.ts`:

```ts
describe("DestinationPlans", () => {
  it("lays out banner, filters, plan rows and a sticky lg sidebar", () => {
    const source = read("DestinationPlans.tsx");

    expect(source).toContain("<CountryBanner");
    expect(source).toContain('<span className="block text-brandTeal">{countryName}</span>');
    expect(source).toContain("Plans from €{selectedCountryOffer.lowPrice.toFixed(2)} to €");
    expect(source).toContain("<CollapsedCountryBar");
    expect(source).toContain("<PlanFilterBar");
    expect(source).toContain("visiblePlans(selectedCountryPlans, filter, sort)");
    expect(source).toContain("tags={planRowTags(plan, { position: index })}");
    expect(source).toContain("buyHref={`/checkout?package=${encodeURIComponent(plan.id)}`}");
    expect(source).toContain('className="mt-8 lg:sticky lg:top-6 lg:mt-0"');
    expect(source).toContain("<PlansSidebar plansCount={selectedCountryPlans.length} />");
    // Sticky needs a main that isn't a scroll container: clip, not hidden (here and in page.tsx).
    expect(source).toContain('<main className="min-h-screen overflow-x-clip');
    expect(read("page.tsx")).toContain('<main className="min-h-screen overflow-x-clip');
    expect(source).not.toContain("overflow-x-hidden");
    // Loaded-later bits sit in fixed-height slots or out of flow (CLS).
    expect(source).toContain('<div className="mt-6 flex h-9 items-center">');
    expect(source).toContain('<div className="mt-5 h-9">');
    // Wizard hand-off filters still hide the chips; Product JSON-LD unchanged.
    expect(source).toContain("{!wizardFiltersActive ? (");
    expect(source).toContain("createOfferProductJsonLd({");
    expect(source).not.toMatch(/#(?!0E86C0)[0-9a-fA-F]{3,6}\b/);
    expect(source).not.toContain("text-white");
  });
});
```

(b) In `src/app/public-shell.test.ts`, replace the whole `it("uses a branded loader while destination hero images load", …)` block. **Old → new:**
- `function DestinationHeroImageLoader` and `animate-[destination-loader-scan_2.8s_ease-in-out_infinite]` are now asserted **absent**;
- `<CountryBanner` and the banner's token gradient are asserted **present**;
- "Loading destination image" is kept, as an sr-only status.

Why: the loader was 20+ hard-coded hex colors, against the token rule, and the banner's gradient is now the placeholder.

```ts
  it("shows the brand gradient banner while the destination photo loads", () => {
    const destinationPlans = readFileSync(
      "src/app/destinations/DestinationPlans.tsx",
      "utf8",
    );
    const banner = readFileSync("src/app/components/CountryBanner.tsx", "utf8");

    // The hex-coloured scanning loader is gone: CountryBanner's token gradient is the placeholder.
    expect(destinationPlans).toContain("<CountryBanner");
    expect(destinationPlans).toContain("Loading destination image");
    expect(destinationPlans).not.toContain("DestinationHeroImageLoader");
    expect(destinationPlans).not.toContain("destination-loader-scan");
    expect(banner).toContain("bg-gradient-to-br from-brandBlue via-[#0E86C0] to-brandTeal");
  });
```

(c) In `src/app/discount-display-wiring.test.ts`, replace the whole `it("destination plan cards (featured + compact) show the same discount treatment", …)` block. **Old → new:** "`hasActiveDiscount(plan)` appears exactly 2× in `DestinationPlans.tsx`" becomes:
- `PlanRow.tsx` has `hasActiveDiscount(plan)` + `formatOriginalPrice(plan)`;
- `lib/planRow.ts` has `discountPercentOff(plan)`;
- `DestinationPlans` renders `<PlanRow` and has **no** `hasActiveDiscount(plan)`.

Why: FeaturedPlan and CompactPlanCard are replaced by one `PlanRow` shared with `/esim` and `/pkg`.

```ts
  it("destination plan rows (live view, /esim table, /pkg) show the same discount treatment", () => {
    const planRow = readFileSync(join(process.cwd(), "src/app/components/PlanRow.tsx"), "utf8");
    const tags = readFileSync(join(process.cwd(), "src/lib/planRow.ts"), "utf8");
    const destinationPlans = readFileSync(
      join(process.cwd(), "src/app/destinations/DestinationPlans.tsx"),
      "utf8",
    );

    // One implementation: PlanPrice strikes through the original price, planRowTags adds -N%.
    expect(planRow).toContain("hasActiveDiscount(plan)");
    expect(planRow).toContain("formatOriginalPrice(plan)");
    expect(tags).toContain("discountPercentOff(plan)");
    expect(destinationPlans).toContain("<PlanRow");
    expect(destinationPlans).not.toContain("hasActiveDiscount(plan)");
  });
```

Run: `pnpm exec vitest run src/app/destinations/destinationPlans-wiring.test.ts src/app/public-shell.test.ts src/app/discount-display-wiring.test.ts`
Expected: FAIL, 3 failed (`DestinationPlans` and the two replaced blocks); the rest pass.

- [ ] **Step 2: Rewrite the view**

Replace the whole of `src/app/destinations/DestinationPlans.tsx` with:

```tsx
"use client";

import { Globe2 } from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

import {
  coveredDestinationsForOption,
  fetchPackageOptions,
  planCoversDestination,
  type HeroPackageOption,
} from "@/services/packages";
import {
  isDestinationFiltersActive,
  matchesDestinationFilters,
  parseDestinationFiltersFromParams,
} from "@/services/destinationFilters";
import { planRowTags } from "@/lib/planRow";
import { absoluteUrl, createOfferProductJsonLd } from "@/lib/seo";
import { Navbar } from "../components/Navbar";
import { CountryBanner } from "../components/CountryBanner";
import { CollapsedCountryBar } from "../components/CollapsedCountryBar";
import { PlanRow } from "../components/PlanRow";
import { SiteFooter } from "../SiteFooter";
import { JsonLd } from "../JsonLd";
import { visiblePlans, type PlanFilter, type PlanSort } from "./planList";
import { PlanFilterBar } from "./PlanFilterBar";
import { PlansSidebar } from "./PlansSidebar";
import { EmptyFilterState, ErrorState, MissingDestinationState, PlansLoading } from "./PlansStates";
import { useCountryHeroImage } from "./useCountryHeroImage";

type DestinationPlansProps = {
  countryCode: string;
  /** The wizard's `daysMin`/`daysMax`/`dataMin`/`dataMax`/`unlimited` query params, if it handed off a destination. */
  searchFilters?: Record<string, string | undefined>;
};

type CountryOption = {
  country: string;
  countryCode: string;
  flagUri: string;
  planCount: number;
};

function normalizeCountryCode(value: string) {
  return value.trim().toLowerCase().replace(/_/g, "-").replace(/\s+/g, "-");
}

function countryCodesMatch(firstCode: string, secondCode: string) {
  return normalizeCountryCode(firstCode) === normalizeCountryCode(secondCode);
}

function getCountryOptions(packages: readonly HeroPackageOption[]): CountryOption[] {
  const countryMap = new Map<string, CountryOption>();

  for (const plan of packages) {
    const destinations = [
      {
        country: plan.country,
        countryCode: plan.countryCode,
        flagUri: plan.flagUri,
      },
      ...(!plan.filters.includes("local")
        ? coveredDestinationsForOption(plan).map((destination) => ({
            country: destination.title,
            countryCode: destination.slug,
            flagUri: "",
          }))
        : []),
    ];

    for (const destination of destinations) {
      const normalizedCode = normalizeCountryCode(destination.countryCode);
      if (!destination.country.trim() || !normalizedCode) continue;

      const existingCountry = countryMap.get(normalizedCode);
      if (existingCountry) {
        existingCountry.planCount += 1;
        if (!existingCountry.flagUri && destination.flagUri) {
          existingCountry.flagUri = destination.flagUri;
        }
        continue;
      }

      countryMap.set(normalizedCode, {
        country: destination.country,
        countryCode: destination.countryCode,
        flagUri: destination.flagUri,
        planCount: 1,
      });
    }
  }

  return Array.from(countryMap.values()).sort((first, second) => first.country.localeCompare(second.country));
}

/**
 * Live plans for a destination without an /esim page (`/destinations?country=`).
 * Layout follows the app: photo banner, chip filters, plan rows, a sticky
 * sidebar at lg+, and a collapsed country bar on phones.
 */
export function DestinationPlans({ countryCode, searchFilters }: DestinationPlansProps) {
  const [packages, setPackages] = useState<HeroPackageOption[]>([]);
  const [filter, setFilter] = useState<PlanFilter>("all");
  const [sort, setSort] = useState<PlanSort>("recommended");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadPackages() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetchPackageOptions();

        if (active) {
          setPackages(response);
        }
      } catch (loadError) {
        console.error("Failed to load destination plans:", loadError);

        if (active) {
          setError("Available eSIM plans could not be loaded. Please try again shortly.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadPackages();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    setFilter("all");
    setSort("recommended");
  }, [countryCode]);

  const countries = useMemo(() => getCountryOptions(packages), [packages]);

  const selectedCountry = useMemo(
    () => countries.find((country) => countryCodesMatch(country.countryCode, countryCode)),
    [countries, countryCode],
  );

  const wizardFilters = useMemo(() => parseDestinationFiltersFromParams(searchFilters ?? {}), [searchFilters]);
  const wizardFiltersActive = isDestinationFiltersActive(wizardFilters);

  const selectedCountryPlans = useMemo(
    () =>
      packages.filter(
        (plan) => planCoversDestination(plan, countryCode) && matchesDestinationFilters(plan, wizardFilters),
      ),
    [packages, countryCode, wizardFilters],
  );

  const selectedCountryOffer = useMemo(() => {
    const prices = selectedCountryPlans.map((plan) => plan.priceNumeric).filter((price) => price > 0);

    if (prices.length === 0) {
      return null;
    }

    return {
      lowPrice: Math.min(...prices),
      highPrice: Math.max(...prices),
      currency: "EUR",
      offerCount: prices.length,
    };
  }, [selectedCountryPlans]);

  // The list as displayed. Its first row is the Best value (planRowTags position 0).
  const displayedPlans = useMemo(
    () => visiblePlans(selectedCountryPlans, filter, sort),
    [filter, selectedCountryPlans, sort],
  );

  const { image: heroImage, loading: heroImageLoading } = useCountryHeroImage({
    country: selectedCountry?.country,
    slug: selectedCountry?.countryCode ?? countryCode,
  });

  const countryName = loading ? "your destination" : (selectedCountry?.country ?? "your destination");

  return (
    <main className="min-h-screen overflow-x-clip bg-surface text-onSurface">
      {selectedCountry && selectedCountryOffer ? (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            ...createOfferProductJsonLd({
              url: absoluteUrl(`/destinations?country=${countryCode}`),
              name: `${selectedCountry.country} eSIM data plans`,
              description: `Prepaid travel eSIM data plans for ${selectedCountry.country}.`,
              offer: selectedCountryOffer,
            }),
          }}
        />
      ) : null}
      <Navbar />

      <CountryBanner
        credit={
          heroImage?.sourceUrl ? (
            <a className="transition hover:text-surface/80" href={heroImage.sourceUrl} rel="noreferrer" target="_blank">
              Image source: Wikimedia Commons
            </a>
          ) : undefined
        }
        crumb={selectedCountry?.country ?? "Plans"}
        photo={
          heroImage?.imageUrl ? (
            <Image
              alt={heroImage.alt || `${selectedCountry?.country ?? "International"} travel destination`}
              className={`object-cover motion-safe:transition-opacity motion-safe:duration-500 ${
                heroImageLoading ? "opacity-70" : "opacity-100"
              }`}
              fill
              key={heroImage.imageUrl}
              priority
              sizes="100vw"
              src={heroImage.imageUrl}
            />
          ) : undefined
        }
      >
        {heroImageLoading ? (
          <span className="sr-only" role="status">
            Loading destination image
          </span>
        ) : null}

        {/* Fixed-height slots: the flag pill and the price line appear after the catalog loads without moving anything. */}
        <div className="mt-6 flex h-9 items-center">
          {selectedCountry ? (
            <span className="inline-flex h-9 items-center gap-2 rounded-full border border-surface/25 bg-surface/10 pl-1 pr-3 backdrop-blur">
              {selectedCountry.flagUri ? (
                <img
                  alt={`${selectedCountry.country} flag`}
                  className="h-7 w-7 rounded-full border border-surface/20 object-cover"
                  src={selectedCountry.flagUri}
                />
              ) : (
                <span className="grid h-7 w-7 place-items-center">
                  <Globe2 aria-hidden="true" className="text-brandTeal" size={18} />
                </span>
              )}
              <span className="text-label-caps uppercase text-surface">{selectedCountry.country}</span>
            </span>
          ) : (
            <span aria-hidden="true" className="h-9 w-28 rounded-full bg-surface/10" />
          )}
        </div>

        <h1 className="mt-4 max-w-3xl font-display text-[30px] font-black leading-[1.08] tracking-[-0.03em] text-surface sm:text-5xl lg:text-[56px]">
          eSIM plans for
          <span className="block text-brandTeal">{countryName}</span>
        </h1>

        <p className="mt-4 max-w-[470px] text-sm leading-6 text-surface/75 sm:text-base sm:leading-7">
          Fast, reliable data wherever you go.
          <br />
          Choose the plan that fits your journey.
        </p>

        <div className="mt-5 h-9">
          {selectedCountryOffer ? (
            <p className="inline-flex h-9 items-center whitespace-nowrap rounded-full border border-surface/20 bg-surface/10 px-3 text-[11px] font-black text-surface backdrop-blur sm:px-4 sm:text-xs">
              Plans from €{selectedCountryOffer.lowPrice.toFixed(2)} to €{selectedCountryOffer.highPrice.toFixed(2)} ·{" "}
              {selectedCountryOffer.offerCount} plans
            </p>
          ) : null}
        </div>
      </CountryBanner>

      {selectedCountry ? (
        <CollapsedCountryBar
          country={selectedCountry.country}
          flagUri={selectedCountry.flagUri || undefined}
          fromPrice={selectedCountryOffer ? `€${selectedCountryOffer.lowPrice.toFixed(2)}` : undefined}
        />
      ) : null}

      <section className="mx-auto max-w-6xl px-5 pb-16 pt-6 md:px-8 md:pb-24 md:pt-8">
        {loading ? (
          <PlansLoading withFilters={!wizardFiltersActive} />
        ) : error ? (
          <ErrorState message={error} />
        ) : selectedCountry && selectedCountryPlans.length > 0 ? (
          <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start lg:gap-8">
            <div className="min-w-0">
              {!wizardFiltersActive ? (
                <PlanFilterBar filter={filter} onFilterChange={setFilter} onSortChange={setSort} sort={sort} />
              ) : null}

              {displayedPlans.length > 0 ? (
                <ul className="mt-4 grid grid-cols-1 gap-3">
                  {displayedPlans.map((plan, index) => (
                    <li key={plan.id}>
                      <PlanRow
                        buyHref={`/checkout?package=${encodeURIComponent(plan.id)}`}
                        plan={plan}
                        tags={planRowTags(plan, { position: index })}
                      />
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyFilterState onReset={() => setFilter("all")} />
              )}
            </div>

            <div className="mt-8 lg:sticky lg:top-6 lg:mt-0">
              <PlansSidebar plansCount={selectedCountryPlans.length} />
            </div>
          </div>
        ) : (
          <MissingDestinationState />
        )}
      </section>

      <SiteFooter />
    </main>
  );
}
```

Kept:
- the package fetch and its error copy;
- `getCountryOptions` + `countryCodesMatch` (selected country, f115 coverage);
- the wizard hand-off filters (`matchesDestinationFilters`, chips hidden while they're active);
- `selectedCountryOffer` and the Product JSON-LD;
- the reset of filter/sort when `countryCode` changes;
- `/checkout?package=` Buy targets;
- the H1 copy, the sub-copy and the price line.

Removed (never rendered): `query`/`debouncedQuery`/`isSearchOpen`/`mobileMenuOpen`, the outside-click effect, `matchingCountries`, `selectCountry` and `useRouter`.

- [ ] **Step 3: Unblock sticky on the route's outer `<main>`**

In `src/app/destinations/page.tsx`, replace:

```tsx
    <main className="min-h-screen overflow-x-hidden bg-surface text-onSurface">
```

with:

```tsx
    <main className="min-h-screen overflow-x-clip bg-surface text-onSurface">
```

- [ ] **Step 4: Drop the dead keyframes**

In `src/app/globals.css`, delete the whole `@keyframes destination-loader-scan { … }` block (the 10 lines from `@keyframes destination-loader-scan {` through its closing `}`, plus the blank line after it). Nothing references it any more: `grep -rn "destination-loader-scan" src` should only show the test's `not.toContain`.

- [ ] **Step 5: Run the tests**

Run: `pnpm exec vitest run src/app/destinations/destinationPlans-wiring.test.ts src/app/public-shell.test.ts src/app/discount-display-wiring.test.ts src/app/destinations/destinationBrowse-wiring.test.ts`
Expected: PASS. `destinationBrowse-wiring` still finds `<DestinationPlans countryCode={countryCode} searchFilters={wizardFilterParams} />` in `page.tsx`, and `public-shell` still finds `<Navbar />`, `<SiteFooter />` and the SiteFooter import in `DestinationPlans`.

- [ ] **Step 6: Full suite + types**

Run: `pnpm test && pnpm exec tsc --noEmit`
Expected: **77 files, 617 tests**; tsc clean. `wc -l src/app/destinations/DestinationPlans.tsx` → about 330 (was 1443).

- [ ] **Step 7: Look at it**

Run `pnpm dev` and open `/destinations?country=hungary`. Every Hungary plan is discounted, and the view includes the Europe bundles that cover it (f115).
- **320px:** the banner shows the breadcrumb, the "HUNGARY" flag pill, the H1 with "Hungary" in teal, and "Plans from €… to €… · N plans". Then come a chip row (swipe) and a round sort button that opens the native picker. Rows are 280px wide (not 388), and the first row's Buy now is the only gradient. After scrolling, the collapsed bar appears.
- **1440px:** rows on the left, and the sticky sidebar on the right (65 plans available, Instant activation, …, Visit Help Center).
- `/destinations?country=xyz` shows the banner with "your destination" and "No plans found for this destination".

- [ ] **Step 8: Commit (controller)**

```bash
git add src/app/destinations/DestinationPlans.tsx src/app/destinations/page.tsx src/app/globals.css src/app/destinations/destinationPlans-wiring.test.ts src/app/public-shell.test.ts src/app/discount-display-wiring.test.ts
git commit -m "feat(plans): live destination view on PlanRow with banner, chip row, sticky sidebar, collapsed bar"
```

---

### Task 9: `/pkg/[id]` shows the plan as a PlanRow

**Files:**
- Modify: `src/app/pkg/[id]/page.tsx`
- Test: `src/app/pkg/[id]/pkgPlanRow.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/app/pkg/[id]/pkgPlanRow.test.ts`:

```ts
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("/pkg/[id] shared-plan landing", () => {
  it("shows the plan as a PlanRow and keeps its own open-in-app / buy actions", () => {
    const source = readFileSync(join(process.cwd(), "src/app/pkg/[id]/page.tsx"), "utf8");

    expect(source).toContain('import { PlanRow } from "../../components/PlanRow";');
    // Not part of a list: no Best value tag, and no Buy now (OpenAppActions owns the CTAs).
    expect(source).toContain("<PlanRow plan={plan} tags={planRowTags(plan, { position: null })} />");
    expect(source).not.toContain("buyHref=");
    expect(source).toContain("Covers {coverage.length} countries:");
    // Buy flow and app links unchanged.
    expect(source).toContain("webCheckoutUrl={plan ? `/checkout?package=${encodeURIComponent(plan.id)}` : null}");
    expect(source).toContain("<OpenAppActions");
    expect(source).toContain("indexable: false");
    expect(source).not.toContain("bg-white");
  });
});
```

Run: `pnpm exec vitest run "src/app/pkg/[id]/pkgPlanRow.test.ts"`
Expected: FAIL, 1 failed (no `PlanRow` import).

- [ ] **Step 2: Implement**

Replace the whole of `src/app/pkg/[id]/page.tsx` with:

```tsx
import type { Metadata } from "next";
import { Globe2 } from "lucide-react";
import { createMetadata } from "@/lib/seo";
import { planRowTags } from "@/lib/planRow";
import { landingContent } from "@/content/landing";
import { getPackageOption } from "@/services/server-packages";
import { Navbar } from "../../components/Navbar";
import { PlanRow } from "../../components/PlanRow";
import { SiteFooter } from "../../SiteFooter";
import { OpenAppActions } from "./OpenAppActions";

function safeDecode(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const plan = await getPackageOption(safeDecode(id));
  return createMetadata({
    path: `/pkg/${id}`,
    title: plan ? `${plan.country} eSIM · ${plan.title} | eSim2you` : "eSIM plan | eSim2you",
    description: plan
      ? `${plan.title} for ${plan.price}. Open it in the eSim2you app or buy it on the web.`
      : "Open this eSIM plan in the eSim2you app, or download the app to get it.",
    indexable: false
  });
}

/**
 * Landing for a package shared from the mobile app (`/pkg/{id}`).
 *
 * With the app installed, universal / App Links open the app before this page
 * loads. Reaching it means the app isn't installed, or the link was opened
 * somewhere links don't fire (in-app browsers, a debug build), so it shows the
 * plan itself and offers every next step: open in the app, buy on the web, or
 * download the app. It never gates the plan behind a download.
 */
export default async function PackageLinkPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const packageId = safeDecode(id);
  const plan = await getPackageOption(packageId);
  const { appLinks } = landingContent;

  const coverage = plan?.countries ?? [];

  return (
    <main className="min-h-screen bg-surface text-onSurface">
      <Navbar />

      <section className="mx-auto w-full max-w-[520px] px-5 pb-24 pt-28">
        <p className="text-xs font-bold text-brandBlue">Shared with you</p>

        {plan ? (
          <>
            <div className="mt-4 flex items-center gap-4">
              {plan.flagUri ? (
                <img alt="" className="h-12 w-12 shrink-0 rounded-full object-cover" src={plan.flagUri} />
              ) : (
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-outline bg-mist text-brandBlue">
                  <Globe2 size={22} />
                </span>
              )}
              <div className="min-w-0">
                <h1 className="font-display text-2xl font-black tracking-[-0.02em] text-brandInk sm:text-3xl">
                  {plan.country}
                </h1>
                <p className="text-sm text-onSurfaceVariant">{plan.title}</p>
              </div>
            </div>

            <div className="mt-6">
              <PlanRow plan={plan} tags={planRowTags(plan, { position: null })} />
              {coverage.length > 1 ? (
                <p className="mt-3 rounded-[14px] bg-surfaceBright px-4 py-3 text-xs text-onSurfaceVariant">
                  Covers {coverage.length} countries: {coverage.map((country) => country.title).join(", ")}
                </p>
              ) : null}
            </div>
          </>
        ) : (
          <>
            <h1 className="mt-3 font-display text-2xl font-black tracking-[-0.02em] text-brandInk sm:text-3xl">
              Get this eSIM plan in eSim2you
            </h1>
            <p className="mt-2 text-sm text-onSurfaceVariant">
              This plan is no longer available on the web. Open eSim2you to see the latest plans.
            </p>
          </>
        )}

        <OpenAppActions
          packageId={packageId}
          webCheckoutUrl={plan ? `/checkout?package=${encodeURIComponent(plan.id)}` : null}
          appStoreUrl={appLinks.ios.href}
          playStoreUrl={appLinks.android.href}
        />
      </section>

      <SiteFooter />
    </main>
  );
}
```

`generateMetadata`, `safeDecode`, the header (flag + country H1 + title), the not-found branch and `OpenAppActions` (open in app, Buy on the web, store links: f185/f199/f200) are unchanged. `PlanRow` gets no `buyHref`, because `OpenAppActions` owns the CTAs on this page.

- [ ] **Step 3: Run it, full suite, types**

Run: `pnpm exec vitest run "src/app/pkg/[id]/pkgPlanRow.test.ts" && pnpm test && pnpm exec tsc --noEmit`
Expected: PASS, 1 test; then **78 files, 618 tests**; tsc clean.

- [ ] **Step 4: Commit (controller)**

```bash
git add "src/app/pkg/[id]/page.tsx" "src/app/pkg/[id]/pkgPlanRow.test.ts"
git commit -m "feat(pkg): show the shared plan as a PlanRow"
```

---

### Task 10: Full verification

- [ ] **Step 1: Full test suite + types**

Run: `pnpm test && pnpm exec tsc --noEmit`
Expected: **78 files, 618 tests** passing (baseline 73 / 590: +12 rules, +4 list, +2 pricing, +4 components, +1 seo, +4 live view, +1 pkg); tsc clean.

- [ ] **Step 2: Production build**

Run: `pnpm build`
Expected (dry run in brackets):
- `/esim/[slug]` is still **● (SSG)** with `1h` revalidate [`● /esim/[slug]  4.16 kB  118 kB  1h  1y`, up from 135 B / 117 kB: the collapsed-bar island];
- `/` is still **○** [`○ /  7.32 kB  215 kB`, unchanged];
- `/destinations` is still **ƒ** [`10.9 kB / 243 kB` → `9.7 kB / 242 kB`];
- `/pkg/[id]` is still **ƒ** [`4.24 kB / 118 kB`].

If `/esim/[slug]` or `/` flipped to ƒ, something read request data. Fix it before going on.

- [ ] **Step 3: Browser matrix**

Run `pnpm build && pnpm start`. Test **`/esim/usa`** (Calls + SMS rows), **`/esim/croatia`** (discounted rows) and **`/destinations?country=hungary`**. That's the real query param: `page.tsx` reads `searchParams.country`, and known countries such as `usa` 301 to `/esim/*`, so use a country without an `/esim` page. Accept cookies first (or set `esim2you_consent`), or the consent sheet covers the phone viewport.

Check at **320, 375, 768, 1024 and 1440px**:

| Width | Check | Expected (dry-run result in brackets) |
|---|---|---|
| all | horizontal scroll | `document.documentElement.scrollWidth === clientWidth` and `innerWidth` equals the emulated width (no f195 widening) [true at all 5, on both pages, and on `/destinations`, `/pkg/change-plus-7days-1gb`, `/esim/europe` and `/destinations?country=xyz`] |
| all | single gradient Buy | in `main`, exactly one visible element whose computed `background-image` is a gradient: the first row's "Buy now" [1 at all widths; the navbar's "Get eSIM Now" is shell, outside the list] |
| all | tap targets | every `main` link/button/select outside the breadcrumb, footer and inline copy is ≥ 44px tall [chips 46, sort 46, Buy now 46, sidebar/related links 44; the only exception is the pre-existing 12px "Image source" credit] |
| 320/375 | `/esim/usa` rows | grid cards 280/335px wide, 147–167px tall; disc \| title + tags \| validity / network \| price \| Buy now [measured] |
| 768+ | `/esim/usa` rows | table rows 90px (110 with a wrapped tag), visible header row [measured] |
| 320/375/768 | collapsed bar | hidden at the top; after scrolling past the banner it's at `top: 0`, opacity 1, `inert === false`, with back → `/destinations`, flag, name, "from €4.00" [true] |
| 1024/1440 | collapsed bar | `display: none` [true] |
| 1024/1440 | sidebar | `position: sticky`; after `scrollTo(0, 1400)` its `top` is 24px [24 on both pages] |
| 375 | table semantics | Playwright `locator("table").ariaSnapshot()` (or DevTools → Accessibility) shows `table "USA eSIM plans with data, validity, network, and price"` → `rowgroup` → `row` → `cell "1GB"`, `rowheader "1 GB - 7 days Best value"`, … [as stated] |
| all | navbar clearance | the breadcrumb starts 24px under the capsule (H1 top 180px below lg, 188–196 at lg; the banner content's `pt` is 92/100px) |
| all | `/destinations?country=hungary` rows | phone 280/335 × 103–119px, md+ 116–132px [measured]; the first row has "BEST VALUE" + "-19%", and the strike-through shows on discounted rows |
| 320 | chips + sort | the chip row swipes sideways, and the 46px sort button opens the native picker; changing sort or a chip re-orders and keeps exactly one gradient Buy now |
| all | reduced motion | DevTools → emulate `prefers-reduced-motion: reduce`: the collapsed bar snaps in and out without sliding, and the banner photo has no fade |
| 375 | dock | the last row and the sidebar aren't hidden behind the bottom dock when scrolled to the end |

- [ ] **Step 4: Lighthouse (mobile) on `/esim/usa`**

On the prod build, run Lighthouse mobile on `/esim/usa` 5 times. Drop run 1 if it's a cold start (TBT > 500 ms) and take the median. Expected:
- **CLS 0.000.**
- **LCP not worse than the baseline of 3.684 s.** The dry run measured **2.84–2.92 s** (median 2.91 s). The LCP element is still the banner `mountain.webp`, now with `fetchPriority="high"`, and the element render delay is about 50 ms.
- The accessibility score was 0.97. The only failing audit is `color-contrast` on the disc's `brandTeal` unit text: see Risks.

For reference, `/destinations?country=hungary` measured CLS **0** (was 0.0451) and LCP ~10.7 s, unchanged: that's the client-fetched Wikimedia photo.

---

### Task 11: Knowledge + session log (repo rules)

**Files:**
- Modify: `feedAI/facts.jsonl` (append)
- Modify: `feedAI/topics/ui-components-styling.json`
- Create: `docs/sessions/2026-10-01_web-ui-polish-plans.md`
- Modify: `docs/sessions/INDEX.md`, `feedAI/brain.json` (`sync`, `phase.current`)

- [ ] **Step 1: Append facts**

Check the next free id with `tail -1 feedAI/facts.jsonl | cut -c1-20`. It was `f212` when this plan was written, so use `f213`–`f215` unless something landed in between. Replace `<LCP>` with the Task 10 median.

```json
{"id": "f213", "date": "2026-10-01", "kind": "decision", "topic": "ui-components-styling", "fact": "Country plans (spec option A, the phase after browse): /esim/[slug] and the live /destinations?country= view share CountryBanner (full-bleed photo, rounded-b-[24px], brand-gradient placeholder, brandInk scrim, breadcrumb; content at pt-[92px] lg:pt-[100px] = 24px under the navbar capsule, which ends at 68px / 76px) and CollapsedCountryBar (fixed, lg:hidden, inert until the banner's bottom passes under it via IntersectionObserver rootMargin -56px; back -> /destinations, flag, name, from €X). Live view: PlanFilterBar (6 chips h-[46px] in one relative overflow-x-auto row inside min-w-0 [contain:inline-size]; sort = 46px icon with an invisible native select below sm), a PlanRow list (ul.grid.grid-cols-1 so truncate can't widen the track) and a sticky 280px PlansSidebar (old DestinationStats + PlansSupportBar copy). /esim: same banner (mountain.webp, priority + fetchPriority=high), trust cards moved into a sticky sidebar, hero CTAs flat. /pkg/[id] shows the plan as a PlanRow without a CTA (OpenAppActions keeps the buttons). Lighthouse mobile /esim/usa: CLS 0, LCP <LCP>s (baseline 3.68s). Live view CLS 0.045 -> 0.", "source": "src/app/components/{CountryBanner,CollapsedCountryBar,PlanRow}.tsx; src/app/EsimDestinationPage.tsx; src/app/destinations/{DestinationPlans,PlanFilterBar,PlansSidebar,PlansStates}.tsx; src/app/pkg/[id]/page.tsx; docs/superpowers/plans/2026-10-01-web-ui-polish-phase4-plans.md"}
{"id": "f214", "date": "2026-10-01", "kind": "invariant", "topic": "ui-components-styling", "fact": "Plan rows have ONE rule set: src/lib/planRow.ts. planRowTags(plan, { position }) = 'Best value' for position 0 (the first row of the list as displayed: the old FeaturedPlan = visiblePlans[0] in the live view, plans[0] 'Best value starting point' on /esim; null = not in a list, /pkg), '-N%' via discountPercentOff (no badge for a markup, f078), 'Calls + SMS' when voiceMinutes||smsCount. hasBestValueTag(tags) picks the list's single gradient 'Buy now' (LinkButton md, 46px); every other row is flat. PlanRow.tsx is server-safe (no hooks/directive) and exports PlanDataDisc/PlanTags/PlanPrice/PlanBuyLink, which the /esim <table> reuses cell by cell: the table keeps caption, sr-only 'Buy' header and th scope=row; below sm each tr is display:grid, so every table element carries explicit ARIA roles (table/rowgroup/row/columnheader/rowheader/cell) or Safari drops the semantics. destinationPricing rows carry dataNumericGb/durationDays/voiceMinutes/smsCount/hasDiscount+retailPrice (only while discounted) and getDestinationFlag(slug).", "source": "src/lib/planRow.ts; src/app/components/PlanRow.tsx; src/app/EsimDestinationPage.tsx; src/lib/destinationPricing.ts; src/app/seo-content-page.test.ts"}
{"id": "f215", "date": "2026-10-01", "kind": "invariant", "topic": "ui-components-styling", "fact": "position: sticky never sticks under an ancestor with overflow-x-hidden (overflow-y computes to auto, so that ancestor is a non-scrolling scroll container). Pages with a sticky sidebar use overflow-x-clip on every <main> above it: EsimDestinationPage, DestinationPlans and destinations/page.tsx (which wraps DestinationPlans). seo-content-page.test.ts and destinationPlans-wiring.test.ts assert it.", "source": "src/app/EsimDestinationPage.tsx; src/app/destinations/DestinationPlans.tsx; src/app/destinations/page.tsx"}
```

- [ ] **Step 2: Topic + session + index + brain sync**

- In `feedAI/topics/ui-components-styling.json`:
  - add `f213`, `f214` and `f215` to `facts`;
  - add to `notable_components`: `"src/app/components/PlanRow.tsx + src/lib/planRow.ts": "app plan row + pure tag/best-value rules; cell pieces reused by the /esim table (f213, f214)"`;
  - add `"src/app/components/CountryBanner.tsx + CollapsedCountryBar.tsx": "country photo banner with breadcrumb + phone collapsed bar (f213)"`.
- Write `docs/sessions/2026-10-01_web-ui-polish-plans.md` in the same shape as `2026-10-01_web-ui-polish-browse.md` (Goal, What changed, Review findings, Verification, Commits, Next). Include:
  - the test counts and the build lines;
  - the Task 10 matrix and the Lighthouse runs;
  - the deliberately changed assertions: `seo-content-page.test.ts` (`{h1}` / Breadcrumb / `bg-brandInk`), `public-shell.test.ts` (the loader) and `discount-display-wiring.test.ts` (2× `hasActiveDiscount` → `PlanRow`);
  - the content mapping from this plan's Decisions section.
- Append a row to `docs/sessions/INDEX.md`:
  `| 2026-10-01 | [Web UI polish: country plans](./2026-10-01_web-ui-polish-plans.md) | Country plans A: PlanRow + planRowTags (one gradient Buy per list), CountryBanner + phone collapsed bar, sticky sidebar; /esim keeps its table as card rows; /pkg reuses PlanRow; 618 tests, /esim/usa CLS 0, LCP <LCP>s. |`
- In `feedAI/brain.json`:
  - set `sync.date` to `2026-10-01`;
  - prepend `f213-f215: country plans A (PlanRow + planRowTags, CountryBanner, CollapsedCountryBar, sticky sidebars need overflow-x-clip); /esim keeps its table as role-explicit card rows; next plan = checkout B + sign-in.` to `sync.note_latest`;
  - in `phase.current`, add "country plans A (f213-f215)" to the shipped list, and change "Next:" to checkout B + sign-in.

- [ ] **Step 3: Validate JSON**

Run: `tail -3 feedAI/facts.jsonl | while read -r l; do echo "$l" | node -e 'JSON.parse(require("fs").readFileSync(0,"utf8"))' && echo ok; done && node -e 'JSON.parse(require("fs").readFileSync("feedAI/brain.json","utf8"));JSON.parse(require("fs").readFileSync("feedAI/topics/ui-components-styling.json","utf8"));console.log("json ok")'`
Expected: `ok`, `ok`, `ok`, `json ok`.

- [ ] **Step 4: Commit (controller)**

```bash
git add feedAI docs/sessions
git commit -m "docs: feedAI + session log for web UI polish country plans"
```

---

## Risks and open questions

1. **RESOLVED (controller, 2026-10-01): the disc unit uses `text-onSurfaceVariant`.** `brandTeal` (#09C3BE) on the near-white disc is about 2.1:1 and failed `color-contrast` (a11y 0.97). The code and test in Task 4 already use `onSurfaceVariant`; expect a11y 1.0 in Task 10.
2. **Safari table semantics.** The explicit roles are the documented fix, and Chromium was verified. The scratch machine has no WebKit, so check VoiceOver on an iPhone once.
3. **Hero CTAs on `/esim` became flat** to keep one gradient per view. That's a conversion trade-off; confirm.
4. **`mountain.webp` uses `sizes="100vw"`** on a banner that's taller than wide on phones (815px at 320). The bitmap is upscaled under a 40–95% scrim. That's acceptable visually, and LCP improved.
5. **Not changed (pre-existing):**
   - `useCountryHeroImage` requests twice (`?slug=`, then `?slug=&country=` once the catalog arrives). `countryImageCache` can't be reused yet because it drops `alt`/`sourceUrl`.
   - The live view's LCP of about 10.7 s is the client-fetched photo.
   - `destinations/page.tsx` wraps `DestinationPlans`' `<main>` in another `<main>`.

## Verification numbers from the dry run

The dry run applied Tasks 1–9 to a scratch copy, built it, and ran `next start` against the hosted backend with headless Chromium (Playwright) and Lighthouse 13.5.

| | 320 | 375 | 768 | 1024 | 1440 |
|---|---|---|---|---|---|
| scrollWidth = clientWidth = innerWidth (both pages) | ✓ | ✓ | ✓ | ✓ | ✓ |
| `/esim/usa` banner height | 815 | 767 | 588 | 620 | 620 |
| `/esim/usa` row (w×h) | 280×147 | 335×147 | 704×90 | 648×90 | 840×90 |
| live hungary banner height | 405 | 405 | 444 | 484 | 484 |
| live hungary row (w×h) | 280×119 | 335×119 | 704×132 | 648×132 | 776×132 |
| gradient "Buy now" in `main` | 1 | 1 | 1 | 1 | 1 |
| collapsed bar after scroll | shown | shown | shown | hidden | hidden |
| sidebar `top` after scroll | static | static | static | 24 (sticky) | 24 (sticky) |
| `layout-shift` total (observer) | 0.0000 | 0.0000 | 0.0000 | 0.0000 | 0.0000 |

- Stage counts: base 73/590 → T1 74/602 → T2 75/606 → T3 75/608 → T4 76/610 → T5 76/612 → T6 76/613 → T7 77/616 → T8 77/617 → T9 78/618, with `tsc` clean at each stage.
- Lighthouse mobile `/esim/usa`: LCP 2916 / 2912 / 2915 / 2841 ms (warm runs), CLS 0, TBT ≤ 4 ms. Baseline: 3684 / 3684 / 3683 / 3685 ms.

## Next plans (not in this document)

6. Checkout B + sign-in
7. Account: desktop sidebar dashboard / phone app layout + order detail (its top-up list reuses `PlanRow`)
8. Homepage bento blocks
9. Content pages restyle + legal token fix
10. Partner pages on the account shell
