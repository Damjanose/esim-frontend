# Web UI Polish, Phase 5: Checkout + Sign-in (One-page, Stripe-style) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Repo rule (overrides any skill):** implementers **never** run `git commit`. Each "Commit (controller)" step is done by the controller, who stages the files, shows the message, and asks the user before every commit. Stay on the current branch, with no new branches, worktrees or stashes.
>
> **Payment safety (overrides everything):** never enter real card, billing or personal data anywhere, never sign in with real credentials, and never click Pay or submit anything to Pokpay (sandbox included). The browser checks below verify layout only, against fixtures.

**Goal:** Give `/checkout` and `/signin` the spec's option B: a one-page, Stripe-style checkout and a centered sign-in card.
- **Checkout, lg+:** two columns. The left column has the "Secure checkout" eyebrow, the plan title H1, the sub-copy, then 01 Billing address and 02 Card details. The right column is a sticky order summary on `bg-surfaceBright`: flag + plan (built from `PlanRow` pieces), the partner-code field, the plan price / discount / total lines, and the Pokpay trust note.
- **Checkout, phones/tablets:** a "Show order summary · €X" disclosure bar under the top bar opens the same summary. The sections stack, and CardStep's **real** Pay button sticks to the bottom of the screen.
- **Sign-in:** a centered card with the shield icon, heading, copy, email → 6-digit code, then Google/Apple. Field order is unchanged and the shared 48px inputs have focus rings. `LinkEmailStep` gets the same treatment.
- `checkout/failed`, `checkout/not-found` and `checkout/loading` are restyled to match.

Copy, flows, Pokpay tokenization, error and reference handling, partner-code gating, the sign-in gate and consent/tracking all stay the same.

**Architecture:** pure rules go in `lib/`, presentational pieces in `components/`, and there is still **one** summary instance.
- `src/lib/checkoutSummary.ts` holds the pure summary rules: `checkoutTotal` (the old `displayPrice`), `checkoutPriceLines` (Plan price → Discount → Partner code), `orderSummaryToggleLabel`, `coverageCountries`, and `PAYMENT_TRUST_NOTE`.
- `src/app/components/fieldClasses.ts` holds the shared form-control classes for checkout and sign-in (48px, focus ring, 16px text on phones).
- `src/app/checkout/OrderSummary.tsx` is the summary: the phone disclosure bar plus the panel, which is always open and sticky at lg. It mounts `PromoCodeField` exactly once.
- `CheckoutPriceSection.tsx` becomes the grid and owns the promo state. The server page passes the heading in as `children`.
- `CheckoutWizard.tsx` gets numbered step headings. Step 02 stays `invisible` until billing has loaded, which keeps CLS at 0.
- `steps/CardStep.tsx` wraps the real Pay button in a sticky bar below lg.
- `src/app/signin/signInClasses.ts` holds the card, code-input and text-action classes shared by `SignInForm` and `LinkEmailStep`.

**Tech Stack:** Next.js 15.5 App Router, React 19, Tailwind 3.4.19, lucide-react 0.475, vitest in a node env (pure-logic and source-string tests; no RTL/jsdom).
- **Tailwind:** `min-h-11`, `min-h-12`, `h-10`, `scroll-mb-32`, `empty:hidden`, `not-sr-only`, `motion-safe:`, `after:`, `overflow-x-clip`, `min-h-[100svh]` and arbitrary `[&>div]:grid` / `[grid-area:1/1]` are all built in to 3.4.
- **lucide-react icons:** `Lock`, `ShieldCheck`, `ChevronDown`, `Globe2`, `AlertTriangle`, `SearchX`, `MailCheck`, `LifeBuoy`, `LogIn` and `Loader2` all exist under `dist/esm/icons/`.

**Spec:** `docs/superpowers/specs/2026-10-01-web-ui-mobile-polish-design.md`. See "Constraints carried over", "Breakpoints" and "### 5. Checkout + sign-in (option B: one-page, Stripe-style)".

**Scope:** spec build-order step 6 ("Checkout B + sign-in"). The phase-4 session calls it phase 5. The dock is already hidden on `/checkout*` and `/signin*` (`dockNav.ts` `HIDDEN_ON`, pinned by `dockNav.test.ts`). This phase only verifies that.

**Baseline (2026-10-01, after phase 4, `HEAD = 39ada94`):**
- `pnpm test` → **78 files, 620 tests passing**; `tsc` clean.
- `pnpm build`:
  - `○ /  7.32 kB  215 kB`
  - `ƒ /checkout  41.9 kB  249 kB`
  - `ƒ /checkout/failed  137 B  117 kB`
  - `○ /signin  7.16 kB  121 kB`
- **Lighthouse 13.5 mobile, `/signin`, local prod build** (3 runs): a11y **1.0**, **CLS 0.0228 / 0.0919 / 0.0919**, LCP 3.68–3.76 s.
  - The shift is the Google button: Google mounts a fallback button, then its iframe beside it, and the row grows and shrinks.
  - **To beat: CLS 0, a11y 1.0, LCP not worse.**
- **`/checkout` (fixture-signed-in, see Task 7)**, `layout-shift` observer, 320/375/768/1024/1440:
  - returning buyer: `0 0 0.003 0.068 0.036`;
  - first-time buyer: `0 0 0 0.067 0`.
  - These numbers vary run to run, because the order depends on the timing of the billing and intent fetches.
- **Found during the dry run:** on `/checkout/failed` at 320px both buttons rendered **23–25px tall**. `flex-1` (basis 0) in the phone column squashed the 54px buttons. Task 5 fixes it.

**Dry run:** every code block below was applied, in task order, to a scratch copy of this repo before the plan was written, then replayed from a clean copy file by file. Each task's `pnpm test` count, a clean `tsc`, `pnpm build`, a headless-Chromium matrix at 320–1440px and Lighthouse on `/signin` came out as stated. See "Verification numbers from the dry run" at the end.

---

## Decisions

### One summary, rendered once, first in the DOM

`PromoCodeField` holds its own state and re-validates a stored code on mount (f094). Two summaries (one for the phone, one for desktop) would double that request and could disagree. So there is **one** `OrderSummary`:
- **Below lg:** a 56px disclosure `<button aria-expanded aria-controls="checkout-order-summary">` is followed by the panel `div#checkout-order-summary`. The panel is `hidden` until opened.
- **lg+:** the button is `lg:hidden` and the panel is `lg:block`, so it's always open. The `aside` is `lg:sticky lg:top-6 lg:self-start` in grid column 2.
- `hidden` is `display:none`, so the collapsed panel stays **mounted**. A stored partner code is still re-checked on phones, and Pay stays gated on `promoPending` exactly as today.
- **`<details>` was rejected** because a closed `<details>` can't be forced open at lg with CSS.

The summary comes **first in the DOM**: `[OrderSummary, left column]`, with `lg:col-start-2 lg:row-start-1` / `lg:col-start-1 lg:row-start-1`.
- That puts the phone bar directly under the top bar, in both visual and reading order. That was the requirement.
- On desktop, screen-reader order is summary → H1. That's acceptable, because the `aside` is a labelled landmark ("Order summary").
- The old code used `order-1/order-2` instead. On phones that put VoiceOver's summary *after* the Pay button.

### The sticky Pay is the real Pay

CardStep keeps its one `<Button>` (pinned by a test: exactly one `<Button` in `CardStep.tsx`). Below lg it's wrapped in:

```
sticky bottom-0 z-30 -mx-4 sm:-mx-6 px-4 sm:px-6 pt-3 pb-[max(12px,env(safe-area-inset-bottom))]
border-t border-outline/60 bg-surface/95 backdrop-blur
lg:static lg:mx-0 lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none
```

How the bar behaves:
- **Sticky is bounded by CardStep's own box.** Pay only pins while the card fields are on screen. It never floats over the billing form, and it doesn't exist before billing is saved and the intent exists (CardStep only mounts then, as today). Dry run: with only the top of the card step visible, the bar's bottom equals `innerHeight` (740/740 at 320 and 375, 900/900 at 768). At `scrollY 0` with the saved address on screen, Pay is below the fold.
- **The negative margin matches the page gutter** (`px-4 sm:px-6` on the checkout `<section>`), so the bar spans the screen. Both sides carry a comment naming the other.
- **Safe area:** `max(12px, env(safe-area-inset-bottom))`, the same idiom as `BottomDock`.
- **Card inputs get `scroll-mb-32`**, so a focused field scrolls clear of the bar instead of sitting under it.
- **`<main>` is `overflow-x-clip`, not `-hidden`** (f215), or neither sticky element would stick.
- **The dock is hidden here** (`isDockVisible`), so nothing else competes for the bottom edge. That's verified in Task 7.

### Price lines: plan price, then each discount, adding up to the total

The old aside showed one "Total" row: an admin `-N%` badge, a strike-through original, a partner `-N%` badge and the price. The spec asks for plan price / discount / total. `checkoutPriceLines` produces the lines:

| Case | Lines | Total |
|---|---|---|
| no discount | Plan price `€4.00` | `€4.00` |
| admin discount (`discountPercentOff != null`) | Plan price `formatOriginalPrice` → `Discount -N%` `-€(retail−price)` | `plan.price` |
| partner code applied | … → `Partner code -N%` `-€(price−final)`, or `-N%` if that isn't a saving | `formatPriceFromCents(final)` (the backend's number wins outright, as before) |
| code being checked (`promoPending`) | lines unchanged | placeholder bar (never flashes the full price) |

- **One deliberate behaviour change: a markup.** That's `hasDiscount` with a price *above* `retailPrice` (f078). It now shows just the charged price as "Plan price", with no strike-through, because a struck-through *lower* price would make the lines not add up.
  - `PlanRow` everywhere else keeps f078's strike-through.
  - The live catalog has **0** such packages today (checked against `/api/packages`).
  - Flagged in Risks.
- The values use ASCII `-`, like the existing `-N%` tags.

### Content mapping (nothing dropped silently)

| Old (CheckoutPriceSection aside / page) | New |
|---|---|
| flag + country + `plan.title` | same, top of the panel |
| `dl` Destination / Data / Validity / Voice & SMS | country name (header), `PlanDataDisc` (data; sr-only `dataLabel`), `planDurationText` ("7 days"), `planVoiceSmsDetail` ("10 min + 10 SMS"), plus `PlanTags` (`-N%`, Calls + SMS; never "Best value": `position: null`) |
| "{country} covers N countries" disclosure + chips | same, now `min-h-11`, chips in a `relative` scroller (f195). **Shown only when there's more than one country**: the catalog now sends a one-country `countries` list for *local* plans too, so US plans read "United States covers 1 countries". f108's intent was bundles only. |
| `PromoCodeField` | same component, restyled; Apply is `flat` `md` (46px) |
| Total row with badges | price lines + Total (above) |
| "Changed your mind? Browse other destinations" | same, bottom of the panel |
| step 02 sub-copy "Payments are handled by Pokpay — eSim2you never sees your card details." | `PAYMENT_TRUST_NOTE`: in step 02 below lg (`lg:hidden`), in the summary at lg (`hidden lg:flex`, with a `Lock` icon). Once per screen. |
| "Secure checkout" `p` | pill with a `Lock` icon |
| gate `h3` + `Sign in to checkout` `sm` | `h2` (the old `h3` skipped a level) + `md` (46px). Same copy, href and behaviour |
| "Order summary" | new `h2`: `sr-only` below lg, a caps label at lg; the `aside` is `aria-label="Order summary"` |

### One gradient primary per view

- **Checkout:** the gradient is **Pay**.
  - "Save address" (BillingStep) and "Apply" (PromoCodeField) become `variant="flat"`. Both can be on screen with Pay, for example after "Change address".
  - A first-time buyer's billing form therefore shows **no** gradient until the card step appears. Signed out, the gate's "Sign in to checkout" is the only one. Pay never renders signed out: the intent call 401s and redirects to sign-in, f180.
- **Sign-in:** "Send code" on the email step, then "Verify and continue" on the code step. In `LinkEmailStep` they're "Send code" and "Confirm and continue". Google and Apple aren't gradients.
- **Failed:** "Try again" or "Go to my eSIMs". **Not found:** "Browse destinations".
- The navbar's "Get eSIM Now" (lg) is shell, as in phase 4. The checks look inside `main section`/the card, not the header.

### CLS 0 on both pages

- **`/signin`.** The Google holder is `h-10` (Google's iframe is 44px with `-2px` margins, so 40px of layout) and `[&>div]:grid [&>div>*]:[grid-area:1/1]`. That stacks Google's fallback button and iframe in one cell while it swaps them. There's no `overflow-hidden`, so the label is never clipped (the old comment's worry). The `ResizeObserver` width logic is untouched and pinned by a test.
  - Lighthouse CLS: 0.02–0.09 → **0** (4/4 runs). The iframe width still equals the measured row (258 / 238+20 at 320, 394 / 374+20 at 1440, the same +20 Google margin as before).
- **`/checkout`.**
  - **Step 02 is `invisible` until `BillingStep` reports `onLoaded`.** It's still laid out, so nothing pops in. Before that, a one-line "Loading your billing details…" note became a 190px saved-address card or a 600px form, and step 02 jumped.
  - **The checkout `<section>` is `min-h-[calc(100svh+24px)]`**, so the footer starts below the fold and the card step streaming in can't move it on screen.
  - Result: 0 at every width for signed-out and first-time buyers. Returning buyers measure 0 / 0 / 0.016 / 0.012 / 0.007, and **all of that** is CardStep's error panel. The fixture aborts Pokpay, so `usePOK` reports "Something went wrong!". With Pokpay reachable that panel isn't there.
- **Phones:** the summary bar replaces the old always-open summary (about 500px). That's why the form is now above the fold and why the guards above were needed.

### Layout numbers (verified, don't re-derive)

- **Navbar clearance.** The capsule ends at 68px below lg and 76px at lg (phase 4).
  - Checkout content starts at `pt-[92px] lg:pt-[108px]`.
  - Sign-in starts at `pt-[92px] sm:pt-28`, top-aligned on phones so the keyboard doesn't push a centred card around, and `sm:items-center`.
  - Failed and not-found use `pt-[92px] lg:pt-28`.
- **Grid:** `lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-12` in a `max-w-[1120px]` section with `px-4 sm:px-6 lg:px-10`.
  - At 1024px the left column is 516px; at 1440px it's 612px. The summary is 380px wide and its sticky `top` stays 24px after `scrollTo(0,120)`.
  - `loading.tsx` uses the same grid and padding.
- **Controls:**
  - Inputs and selects are `h-12` (48px), with `text-base sm:text-sm` (16px on phones: no iOS focus zoom), `focus:border-brandBlue focus:ring-4 focus:ring-brandBlue/15`, and `bg-surface` (white on the `surfaceBright` panel).
  - Pay is 54px, Send code 54px, and the summary bar 56px.
  - Text actions use `min-h-11` (44px): "Change address", "Change" (promo), "Use a different email", "Resend code", "Start over" and the coverage disclosure.
  - **Apple stays a visual 40px pill**, matched to Google's fixed 40px button, with an invisible `::after` (`after:-inset-y-0.5`) taking its hit area to 44px. That's the same as Google's own 44px iframe.
- **Phone H1:** `text-[28px] leading-[1.15] break-words`. Backend titles like "1 GB - 10 SMS - 10 Mins - 7 days" wrap to 2 lines at 320/375 and fit one line at lg.

### How signed-in checkout is verified without signing in

`/checkout` isn't guarded by middleware (f180). The server reads the email from the `esim_at` cookie through `readEmailFromAccessToken`, which **only decodes** the payload: `kind: "access"`, `exp` in **ms**, and no signature check (display only). Everything after that is a client `fetch` to `/bff/*`. So Task 7's Playwright script:
1. sets an **unsigned, display-only** cookie `esim_at=dev-auth.<base64url {"email":"layout-check@example.com","kind":"access","exp":now+1h}>.not-a-signature`. The backend would reject it, and it never gets there:
2. it answers **every** `/bff/**` request in the browser with `page.route` fixtures:
   - billing address: an obviously fake `Layout Check / 1 Test Street / Testville TS 00000 / US / +1 000 000 0000`, or `null` for a first-time buyer;
   - intent: `{ paymentId: "layout-check-only" }`;
   - apply-promo: `{ applied: true, discountPct: 10, finalCustomerPriceCents: 360 }`;
   - anything else is aborted.
3. It **aborts** `pokpay.io`, `cardinalcommerce.com`, `cardinaltrusted.com` and `online-metrix.net`.
4. It never types into the card fields and never clicks Pay.

The server-side page only calls the public catalog (`getPackageOption`, `/esim/countries`). No real session, card or person is involved. A manual pass on a real account (the owner's own) is optional and listed in Task 7 Step 6.

---

## File map

| File | Action | Responsibility |
|---|---|---|
| `src/lib/checkoutSummary.ts` | create | pure summary rules: total, price lines, toggle label, coverage, trust note |
| `src/lib/checkoutSummary.test.ts` | create | 8 tests |
| `src/app/components/fieldClasses.ts` | create | shared 48px field / label / error classes |
| `src/app/checkout/steps/CardStep.tsx` | modify | sticky real Pay bar below lg; shared fields + `scroll-mb-32` |
| `src/app/checkout/steps/BillingStep.tsx` | modify | shared fields, flat Save, 44px toggles, `onLoaded` |
| `src/app/checkout/checkout-steps.test.ts` | create | 4 tests |
| `src/app/checkout/OrderSummary.tsx` | create | phone disclosure bar + sticky lg panel; one `PromoCodeField` |
| `src/app/checkout/order-summary.test.ts` | create | 4 tests |
| `src/app/checkout/PromoCodeField.tsx` | modify | shared control, flat `md` Apply, 44px Change; spacing owned by the parent |
| `src/app/checkout/CheckoutPriceSection.tsx` | rewrite | grid + promo state; heading via `children`; gate restyle |
| `src/app/checkout/CheckoutWizard.tsx` | modify | numbered `StepHeading`s; step 02 `invisible` until billing loads; Pokpay note `lg:hidden` |
| `src/app/checkout/page.tsx` | modify | `overflow-x-clip`, gutters, `min-h`, heading passed as `children` |
| `src/app/checkout/checkout-layout.test.ts` | create | 7 tests |
| `src/app/discount-display-wiring.test.ts` | modify | first test follows the summary (see "Changed assertions") |
| `src/app/checkout/failed/page.tsx` | modify | card restyle, `error` tokens instead of `amber-*`, phone buttons `w-full sm:flex-1` |
| `src/app/checkout/not-found.tsx` | modify | same copy in a card |
| `src/app/checkout/loading.tsx` | rewrite | skeleton in the loaded layout's shape |
| `src/app/checkout/checkout-status-pages.test.ts` | create | 3 tests |
| `src/app/signin/signInClasses.ts` | create | card / code input / 44px text-action classes |
| `src/app/signin/page.tsx` | modify | token background, top-aligned on phones |
| `src/app/signin/SignInForm.tsx` | modify | centred header, shared fields, 44px text actions |
| `src/app/signin/LinkEmailStep.tsx` | modify | same treatment |
| `src/app/signin/SocialSignInButtons.tsx` | modify | Google holder CLS guard, Apple 44px hit area, token hover |
| `src/app/signin/signin-card.test.ts` | create | 5 tests |
| `feedAI/*`, `docs/sessions/*` | modify/create | Task 8 |

**Not changed:**
- `checkout-flow.test.ts`, `PromoCodeField.test.ts`, `social-signin.test.ts` (every string they pin is kept) and `dockNav.test.ts`.
- `GoogleTag.tsx`, `ConsentManager.tsx` and `account/[orderId]/PurchaseConversion.tsx`, so the purchase conversion on `/account/{id}?new=1` is untouched.
- The BFF routes, `route-guard.ts` and `dockNav.ts`.

### Changed assertions (deliberate)

| File | Old | New | Why |
|---|---|---|---|
| `src/app/discount-display-wiring.test.ts`, test 1 | reads `CheckoutPriceSection.tsx` and expects `hasActiveDiscount(plan)`, `formatOriginalPrice(plan)`, `discountPercentOff(plan)` | reads `src/lib/checkoutSummary.ts` for the same three calls, plus `OrderSummary.tsx` for `checkoutPriceLines(plan, promo)`; test renamed "checkout breaks an active discount out as plan price, then the discount, in the order summary" | the discount display moved from the section into the pure price lines and the summary component; the same three helpers are still the only implementation |

No other existing assertion changes.

---

### Task 1: Pure summary rules (TDD)

**Files:**
- Create: `src/lib/checkoutSummary.ts`
- Test: `src/lib/checkoutSummary.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/checkoutSummary.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  checkoutPriceLines,
  checkoutTotal,
  coverageCountries,
  orderSummaryToggleLabel,
  type CheckoutPromo,
} from "./checkoutSummary";

type Plan = Parameters<typeof checkoutTotal>[0];

function plan(overrides: Partial<Plan> = {}): Plan {
  return { price: "€4.00", priceNumeric: 4, ...overrides };
}

const promo: CheckoutPromo = { promoCode: "FRIEND10", discountPct: 10, finalCustomerPriceCents: 360 };

describe("checkoutTotal", () => {
  it("is the catalog price, the backend's promo total once a code applies, and null while a code is checked", () => {
    expect(checkoutTotal(plan(), null, false)).toBe("€4.00");
    expect(checkoutTotal(plan(), promo, false)).toBe("€3.60");
    // A pending check never flashes the full price (f094).
    expect(checkoutTotal(plan(), null, true)).toBeNull();
    expect(checkoutTotal(plan(), promo, true)).toBeNull();
  });
});

describe("checkoutPriceLines", () => {
  it("shows just the plan price when nothing is discounted", () => {
    expect(checkoutPriceLines(plan(), null)).toEqual([{ kind: "plan", label: "Plan price", value: "€4.00" }]);
  });

  it("starts from the original price and subtracts an admin discount (f078)", () => {
    expect(
      checkoutPriceLines(plan({ price: "€14.50", priceNumeric: 14.5, hasDiscount: true, retailPrice: 17.64 }), null),
    ).toEqual([
      { kind: "plan", label: "Plan price", value: "€17.64" },
      { kind: "discount", label: "Discount -18%", value: "-€3.14" },
    ]);
  });

  it("treats a markup (hasDiscount with a higher price) as no discount", () => {
    expect(checkoutPriceLines(plan({ price: "€12.00", priceNumeric: 12, hasDiscount: true, retailPrice: 10 }), null)).toEqual([
      { kind: "plan", label: "Plan price", value: "€12.00" },
    ]);
  });

  it("adds the partner code as the backend total's saving against the price before it", () => {
    expect(checkoutPriceLines(plan(), promo)).toEqual([
      { kind: "plan", label: "Plan price", value: "€4.00" },
      { kind: "partner", label: "Partner code -10%", value: "-€0.40" },
    ]);
    // Admin discount and partner code together: each line is its own step down to the total.
    expect(
      checkoutPriceLines(plan({ price: "€8.00", priceNumeric: 8, hasDiscount: true, retailPrice: 10 }), {
        ...promo,
        finalCustomerPriceCents: 720,
      }).map((line) => line.value),
    ).toEqual(["€10.00", "-€2.00", "-€0.80"]);
  });

  it("falls back to the percentage when the backend total isn't below the price", () => {
    expect(checkoutPriceLines(plan(), { ...promo, finalCustomerPriceCents: 400 })[1]).toEqual({
      kind: "partner",
      label: "Partner code -10%",
      value: "-10%",
    });
  });
});

describe("orderSummaryToggleLabel", () => {
  it("names the action and the total, and drops the total while it's unknown", () => {
    expect(orderSummaryToggleLabel(false, "€4.00")).toBe("Show order summary · €4.00");
    expect(orderSummaryToggleLabel(true, "€4.00")).toBe("Hide order summary · €4.00");
    expect(orderSummaryToggleLabel(false, null)).toBe("Show order summary");
  });
});

describe("coverageCountries", () => {
  it("lists countries only for multi-country bundles (local plans now carry a one-country list)", () => {
    const us = [{ countryCode: "US", title: "United States" }];
    const eu = [...us, { countryCode: "FR", title: "France" }];
    expect(coverageCountries(undefined)).toEqual([]);
    expect(coverageCountries(us)).toEqual([]);
    expect(coverageCountries(eu)).toEqual(eu);
  });
});
```

- [ ] **Step 2: Watch it fail**

Run: `pnpm exec vitest run src/lib/checkoutSummary.test.ts`
Expected: FAIL. The file can't resolve `./checkoutSummary`.

- [ ] **Step 3: Implement**

Create `src/lib/checkoutSummary.ts`:

```ts
import {
  discountPercentOff,
  formatOriginalPrice,
  formatPriceFromCents,
  hasActiveDiscount,
  type DiscountPricedPlan,
} from "@/services/discountPricing";

/**
 * Pure rules for the checkout order summary (OrderSummary.tsx). Kept here so the
 * totals can be unit-tested without rendering.
 */

/** Same shape as PromoCodeField's AppliedPromo: what the backend confirmed for a partner code. */
export type CheckoutPromo = { promoCode: string; discountPct: number; finalCustomerPriceCents: number };

export type CheckoutPriceLine = { kind: "plan" | "discount" | "partner"; label: string; value: string };

/** Shown once per viewport: in section 02 below lg, in the order summary at lg+. */
export const PAYMENT_TRUST_NOTE = "Payments are handled by Pokpay — eSim2you never sees your card details.";

function toCents(amount: number): number {
  return Math.round(amount * 100);
}

/**
 * What Pay charges, or null while a partner code is still being checked, so the
 * full price never flashes before a stored code's discount is confirmed (f094).
 * An applied code's backend total wins outright: it already includes any admin discount.
 */
export function checkoutTotal(
  plan: DiscountPricedPlan,
  promo: CheckoutPromo | null,
  promoPending: boolean,
): string | null {
  if (promoPending) return null;
  return promo ? formatPriceFromCents(plan, promo.finalCustomerPriceCents) : plan.price;
}

/**
 * Plan price, then each discount, so the lines step down to the total.
 * - Admin discount: a line only for a real reduction (discountPercentOff, f078).
 *   A markup (hasDiscount with a higher price) shows the charged price as the plan price.
 * - Partner code: the price before it minus the backend's total; "-N%" when that isn't a saving.
 */
export function checkoutPriceLines(plan: DiscountPricedPlan, promo: CheckoutPromo | null): CheckoutPriceLine[] {
  const lines: CheckoutPriceLine[] = [];
  const percentOff = discountPercentOff(plan);

  if (percentOff != null && hasActiveDiscount(plan)) {
    lines.push({ kind: "plan", label: "Plan price", value: formatOriginalPrice(plan) });
    lines.push({
      kind: "discount",
      label: `Discount -${percentOff}%`,
      value: `-${formatPriceFromCents(plan, toCents(plan.retailPrice) - toCents(plan.priceNumeric))}`,
    });
  } else {
    lines.push({ kind: "plan", label: "Plan price", value: plan.price });
  }

  if (promo) {
    const savedCents = toCents(plan.priceNumeric) - promo.finalCustomerPriceCents;
    lines.push({
      kind: "partner",
      label: `Partner code -${promo.discountPct}%`,
      value: savedCents > 0 ? `-${formatPriceFromCents(plan, savedCents)}` : `-${promo.discountPct}%`,
    });
  }

  return lines;
}

/** The phone disclosure bar: "Show order summary · €4.00". */
export function orderSummaryToggleLabel(expanded: boolean, total: string | null): string {
  const action = expanded ? "Hide order summary" : "Show order summary";
  return total ? `${action} · ${total}` : action;
}

/**
 * The "covers N countries" disclosure is for bundles (f108). The catalog now sends
 * a one-country list for local plans too, which read "United States covers 1 countries".
 */
export function coverageCountries<T>(countries: readonly T[] | undefined): readonly T[] {
  return countries && countries.length > 1 ? countries : [];
}
```

- [ ] **Step 4: Watch it pass**

Run: `pnpm exec vitest run src/lib/checkoutSummary.test.ts`
Expected: PASS, 8 tests. (14.50 / 17.64 rounds to `-18%`.)

- [ ] **Step 5: Full suite + types**

Run: `pnpm test && pnpm exec tsc --noEmit`
Expected: **79 files, 628 tests**; tsc prints nothing.

- [ ] **Step 6: Commit (controller)**

```bash
git add src/lib/checkoutSummary.ts src/lib/checkoutSummary.test.ts
git commit -m "feat(checkout): pure order-summary rules (total, price lines, toggle label, coverage)"
```

---

### Task 2: Shared field classes; CardStep's sticky real Pay; BillingStep restyle

`CheckoutWizard` doesn't pass `onLoaded` yet (Task 4), and it's optional, so this task stands alone. The old page still renders correctly: only the inputs, the Save button and the Pay wrapper change.

**Files:**
- Create: `src/app/components/fieldClasses.ts`
- Modify: `src/app/checkout/steps/CardStep.tsx`, `src/app/checkout/steps/BillingStep.tsx`
- Test: `src/app/checkout/checkout-steps.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/app/checkout/checkout-steps.test.ts`:

```ts
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { FIELD_CONTROL_CLASSES, FIELD_INPUT_CLASSES, FIELD_TEXT_CLASSES } from "../components/fieldClasses";

const cardStep = readFileSync("src/app/checkout/steps/CardStep.tsx", "utf8");
const billingStep = readFileSync("src/app/checkout/steps/BillingStep.tsx", "utf8");
const HEX = /#[0-9a-fA-F]{3,8}\b/;

describe("shared field classes", () => {
  it("are 48px controls with a visible focus ring and 16px text on phones", () => {
    expect(FIELD_CONTROL_CLASSES).toContain("h-12");
    expect(FIELD_CONTROL_CLASSES).toContain("focus:ring-4");
    expect(FIELD_CONTROL_CLASSES).toContain("focus:border-brandBlue");
    // Below 16px, iOS Safari zooms the page into a focused field.
    expect(FIELD_TEXT_CLASSES).toContain("text-base");
    expect(FIELD_INPUT_CLASSES).toContain(FIELD_CONTROL_CLASSES);
    expect(FIELD_CONTROL_CLASSES).not.toMatch(HEX);
  });
});

describe("checkout card step", () => {
  it("keeps one real Pay button, sticky at the bottom below lg and in the flow at lg+", () => {
    // No second, decorative Pay button anywhere: the sticky bar wraps the real one.
    expect(cardStep.match(/<Button\b/g)).toHaveLength(1);
    expect(cardStep).toContain('{submitting ? "Processing…" : "Pay"}');
    expect(cardStep).toContain("sticky bottom-0");
    expect(cardStep).toContain("pb-[max(12px,env(safe-area-inset-bottom))]");
    expect(cardStep).toContain("lg:static");
    // Same Pokpay tokenization as before.
    expect(cardStep).toContain("processPayment(card.cardNumber.replace(/\\D/g, \"\"), card.expiration, card.securityCode");
  });

  it("uses the shared fields and no hex colours", () => {
    // Focused card fields scroll clear of the sticky Pay bar.
    expect(cardStep).toContain("const CARD_INPUT_CLASSNAME = `${FIELD_INPUT_CLASSES} scroll-mb-32`;");
    expect(cardStep.match(/className=\{CARD_INPUT_CLASSNAME\}/g)).toHaveLength(3);
    expect(cardStep).not.toMatch(HEX);
  });
});

describe("checkout billing step", () => {
  it("saves with a flat button, so Pay stays the one gradient primary", () => {
    expect(billingStep).toContain('variant="flat"');
    expect(billingStep).toContain("className={FIELD_INPUT_CLASSES}");
    expect(billingStep).toContain("min-h-11");
    // Tells the wizard when it has its real height, so step 02 never jumps (CLS).
    expect(billingStep).toContain("onLoaded?.();");
    expect(billingStep).not.toContain("bg-mist");
    expect(billingStep).not.toMatch(HEX);
  });
});
```

- [ ] **Step 2: Watch it fail**

Run: `pnpm exec vitest run src/app/checkout/checkout-steps.test.ts`
Expected: FAIL. `../components/fieldClasses` doesn't exist yet.

- [ ] **Step 3: Create `src/app/components/fieldClasses.ts`**

```ts
/**
 * Shared form-control look for checkout and sign-in (phase 5 of the mobile-parity
 * redesign): 48px tall, white on the page, brandBlue border + soft ring on focus.
 * Tokens only. Text is 16px below sm so iOS Safari doesn't zoom into a focused field.
 */
export const FIELD_LABEL_CLASSES = "block text-xs font-bold uppercase tracking-[0.14em] text-onSurfaceVariant";

/** Box, border and focus ring, without text size or margin (the code and promo inputs set their own). */
export const FIELD_CONTROL_CLASSES =
  "h-12 w-full rounded-[12px] border border-outline bg-surface px-4 text-brandInk outline-none transition " +
  "placeholder:text-onSurfaceVariant/60 focus:border-brandBlue focus:ring-4 focus:ring-brandBlue/15 " +
  "disabled:cursor-not-allowed disabled:opacity-60";

export const FIELD_TEXT_CLASSES = "text-base font-medium sm:text-sm";

/** A labelled text input or select: the label above, 8px gap. */
export const FIELD_INPUT_CLASSES = `mt-2 ${FIELD_CONTROL_CLASSES} ${FIELD_TEXT_CLASSES}`;

export const FIELD_ERROR_CLASSES = "mt-1 block text-[11px] font-medium normal-case tracking-normal text-error";
```

- [ ] **Step 4: Replace `src/app/checkout/steps/CardStep.tsx`**

The tokenization (`usePOK`, `processPayment`, the callbacks and `handledRef`) is byte-for-byte the same. Only the field classes, the error panel's role and the Pay wrapper change.

```tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import Lottie from "lottie-react";
import { usePOK, type PaymentErrorResponse } from "@nebula-ltd/pok-payments-js/react";
import type { BillingAddress } from "@/app/bff/user/billing-address/route";
import { Button } from "@/app/components/Button";
import { FIELD_ERROR_CLASSES, FIELD_INPUT_CLASSES, FIELD_LABEL_CLASSES } from "@/app/components/fieldClasses";
import {
  formatCardNumber,
  formatExpiration,
  hasCardErrors,
  validateCard,
  type CardFieldErrors,
  type CardFormData
} from "@/lib/cardValidation";
import otpErrorAnimation from "@/../public/lottie/otp-error.json";

/**
 * scroll-mb-32: below lg the sticky Pay bar (about 80px) covers the bottom of the
 * screen, so a focused card field scrolls far enough up to stay above it.
 */
const CARD_INPUT_CLASSNAME = `${FIELD_INPUT_CLASSES} scroll-mb-32`;

const EMPTY_CARD: CardFormData = { cardNumber: "", expiration: "", securityCode: "" };

function fieldErrorMessage(error: CardFieldErrors[keyof CardFieldErrors]): string | null {
  if (!error) return null;
  if (error === "required") return "This field is required.";
  return "Check this value.";
}

function genericMessageFor(type: PaymentErrorResponse["type"]): string {
  if (type === "VALIDATION_ERROR") return "Check your card details and try again.";
  if (type === "FORM_ERROR") {
    return "Something's not right with this card. Please check it and try again.";
  }
  return "We couldn't process your card. Please try again.";
}

/**
 * Deliberately not using @nebula-ltd/pok-payments-js's `GuestCheckoutForm` —
 * decompiling its bundle shows a hard `error ? <ErrorPanel/> : <Form/>`
 * ternary at its root with no reset prop or retry action, so once it hits an
 * error the card fields are gone for good. `usePOK` runs the same
 * tokenization/3DS flow (the device-collection iframe logic lives in a
 * shared internal helper, not tied to that component's rendering) without
 * taking the form away from us on failure.
 */
export function CardStep({
  paymentId,
  environment,
  billingAddress,
  onPaid
}: {
  paymentId: string;
  environment: string;
  billingAddress: BillingAddress;
  onPaid: () => void;
}) {
  const [card, setCard] = useState<CardFormData>(EMPTY_CARD);
  const [fieldErrors, setFieldErrors] = useState<CardFieldErrors>({});
  const [submitError, setSubmitError] = useState<PaymentErrorResponse | null>(null);
  const [reduceMotion, setReduceMotion] = useState(false);
  // Tracked ourselves rather than relying solely on usePOK's own `fetching` —
  // that flag didn't reliably flip around the processPayment call in
  // practice, so the button never showed as busy.
  const [submitting, setSubmitting] = useState(false);

  // Guards against the SDK invoking onSuccess more than once for the same
  // payment — its docs don't guarantee single-invocation, and re-provisioning
  // is safe but re-navigating the wizard forward twice is not.
  const handledRef = useRef(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(query.matches);
    const onChange = () => setReduceMotion(query.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  // Memoized so `usePOK` (which internally opens a socket.io connection keyed
  // on these callbacks) doesn't tear down and reconnect on every keystroke —
  // the card/expiration/CVV state updates above would otherwise recreate
  // these on every render.
  const handleSuccess = useCallback(() => {
    if (handledRef.current) return;
    handledRef.current = true;
    onPaid();
  }, [onPaid]);

  const handleError = useCallback((error: PaymentErrorResponse) => {
    setSubmitting(false);
    setSubmitError(error);
  }, []);

  const { processPayment } = usePOK(
    paymentId,
    handleSuccess,
    handleError,
    environment === "production" ? "production" : "staging"
  );

  const update = (field: keyof CardFormData, format: (value: string) => string) => (value: string) => {
    setCard((current) => ({ ...current, [field]: format(value) }));
    setFieldErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const submit = async () => {
    if (submitting) return;

    const errors = validateCard(card);
    setFieldErrors(errors);
    if (hasCardErrors(errors)) return;

    setSubmitError(null);
    setSubmitting(true);
    try {
      await processPayment(card.cardNumber.replace(/\D/g, ""), card.expiration, card.securityCode, {
        holdersName: billingAddress.holdersName,
        email: billingAddress.email,
        countryCode: billingAddress.countryCode,
        address1: billingAddress.address1,
        locality: billingAddress.locality,
        administrativeArea: billingAddress.administrativeArea,
        postalCode: billingAddress.postalCode,
        phoneNumber: billingAddress.phoneNumber
      });
      // Actual outcome arrives asynchronously via handleSuccess/handleError
      // above (the SDK reports it through those callbacks, not necessarily
      // when this promise settles) — `submitting` is cleared there, not here.
    } catch {
      setSubmitting(false);
      setSubmitError({ message: "We couldn't process your card. Please try again." });
    }
  };

  return (
    <div>
      {submitError ? (
        <div className="mb-4 flex items-start gap-2 rounded-[16px] border border-error/40 bg-error/5 p-3" role="alert">
          <div className="h-10 w-10 shrink-0">
            <Lottie animationData={otpErrorAnimation} autoplay={!reduceMotion} loop={false} />
          </div>
          <p className="mt-2 text-sm font-medium text-error">
            {submitError.message ?? genericMessageFor(submitError.type)}
          </p>
        </div>
      ) : null}

      <label className={FIELD_LABEL_CLASSES}>
        Card number
        <input
          autoComplete="cc-number"
          className={CARD_INPUT_CLASSNAME}
          disabled={submitting}
          inputMode="numeric"
          onChange={(event) => update("cardNumber", formatCardNumber)(event.target.value)}
          placeholder="1234 5678 9012 3456"
          value={card.cardNumber}
        />
        {fieldErrors.cardNumber ? (
          <span className={FIELD_ERROR_CLASSES}>
            {fieldErrorMessage(fieldErrors.cardNumber)}
          </span>
        ) : null}
      </label>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <label className={FIELD_LABEL_CLASSES}>
          Expiration
          <input
            autoComplete="cc-exp"
            className={CARD_INPUT_CLASSNAME}
            disabled={submitting}
            inputMode="numeric"
            onChange={(event) => update("expiration", formatExpiration)(event.target.value)}
            placeholder="MM/YY"
            value={card.expiration}
          />
          {fieldErrors.expiration ? (
            <span className={FIELD_ERROR_CLASSES}>
              {fieldErrorMessage(fieldErrors.expiration)}
            </span>
          ) : null}
        </label>

        <label className={FIELD_LABEL_CLASSES}>
          CVC
          <input
            autoComplete="cc-csc"
            className={CARD_INPUT_CLASSNAME}
            disabled={submitting}
            inputMode="numeric"
            onChange={(event) =>
              update("securityCode", (value) => value.replace(/\D/g, "").slice(0, 4))(event.target.value)
            }
            placeholder="123"
            value={card.securityCode}
          />
          {fieldErrors.securityCode ? (
            <span className={FIELD_ERROR_CLASSES}>
              {fieldErrorMessage(fieldErrors.securityCode)}
            </span>
          ) : null}
        </label>
      </div>

      {/* Below lg the real Pay button sticks to the bottom of the screen. Sticky is
          bounded by this step's own box, so it only pins while the card fields are on
          screen and never floats over the billing form. The negative margin matches the
          page gutter (px-4 sm:px-6 in checkout/page.tsx) so the bar spans the screen.
          lg+: back in the flow, under the CVC field. */}
      <div className="sticky bottom-0 z-30 -mx-4 mt-5 border-t border-outline/60 bg-surface/95 px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 backdrop-blur sm:-mx-6 sm:px-6 lg:static lg:mx-0 lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
        <Button
          aria-busy={submitting}
          className="flex w-full items-center justify-center gap-2"
          disabled={submitting}
          onClick={() => void submit()}
          size="lg"
        >
          {submitting ? <Loader2 className="animate-spin" size={16} /> : null}
          {submitting ? "Processing…" : "Pay"}
        </Button>
      </div>

      <p className="mt-4 text-center text-xs text-onSurfaceVariant">
        Your card is encrypted on this device before it is sent. eSim2you never sees your card details.
      </p>
    </div>
  );
}
```

- [ ] **Step 5: Edit `src/app/checkout/steps/BillingStep.tsx`**

Apply this diff against `39ada94`, by hand or with `git apply`. The hunks change only the field classes, the 44px toggles, the flat Save, the saved-address card and the new optional `onLoaded`:

```diff
diff --git a/src/app/checkout/steps/BillingStep.tsx b/src/app/checkout/steps/BillingStep.tsx
index 97ef476..10885c4 100644
--- a/src/app/checkout/steps/BillingStep.tsx
+++ b/src/app/checkout/steps/BillingStep.tsx
@@ -2,6 +2,7 @@
 
 import { useCallback, useEffect, useState } from "react";
 import { Button } from "@/app/components/Button";
+import { FIELD_ERROR_CLASSES, FIELD_INPUT_CLASSES, FIELD_LABEL_CLASSES } from "@/app/components/fieldClasses";
 import type { BillingAddress } from "@/app/bff/user/billing-address/route";
 import {
   BILLING_FIELDS,
@@ -17,8 +18,9 @@ type CountryOption = { code: string; name: string };
 
 const FIELD_BY_KEY = Object.fromEntries(BILLING_FIELDS.map((field) => [field.key, field]));
 
-const INPUT_CLASSNAME =
-  "mt-2 h-12 w-full rounded-[12px] border border-outline bg-mist px-4 text-sm font-medium text-brandInk outline-none transition focus:border-brandBlue";
+/** "Change address" toggles: text-style, but a 44px tap target. */
+const TOGGLE_CLASSNAME =
+  "inline-flex min-h-11 items-center gap-1 text-xs font-bold uppercase tracking-[0.14em] text-brandBlue transition hover:text-brandInk";
 
 function fieldErrorMessage(error: BillingFieldError | undefined): string | null {
   if (!error) return null;
@@ -30,12 +32,15 @@ function fieldErrorMessage(error: BillingFieldError | undefined): string | null
 export function BillingStep({
   accountEmail,
   countries,
-  onAddressReady
+  onAddressReady,
+  onLoaded
 }: {
   accountEmail: string | null;
   countries: CountryOption[];
   /** Fires once a complete address is on file — right after load if one was already saved, or after a manual save. */
   onAddressReady: (address: BillingAddress) => void;
+  /** Fires once the saved-address lookup settles (found, empty or failed), i.e. when this step reaches its real height. */
+  onLoaded?: () => void;
 }) {
   const [address, setAddress] = useState<BillingAddress>({
     ...EMPTY_BILLING_ADDRESS,
@@ -80,13 +85,16 @@ export function BillingStep({
       } catch {
         if (!cancelled) setLoadError("We could not load your saved billing details.");
       } finally {
-        if (!cancelled) setLoading(false);
+        if (!cancelled) {
+          setLoading(false);
+          onLoaded?.();
+        }
       }
     })();
     return () => {
       cancelled = true;
     };
-    // onAddressReady is a setState identity from the parent, stable across renders.
+    // onAddressReady/onLoaded are setState-backed callbacks from the parent, stable across renders.
     // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [accountEmail]);
 
@@ -147,12 +155,12 @@ export function BillingStep({
   function renderField(key: keyof BillingAddress) {
     const field = FIELD_BY_KEY[key];
     return (
-      <label className="block text-xs font-bold uppercase tracking-[0.14em] text-onSurfaceVariant">
+      <label className={FIELD_LABEL_CLASSES}>
         {field.label}
         {key === "countryCode" ? (
           <select
             autoComplete={field.autoComplete}
-            className={INPUT_CLASSNAME}
+            className={FIELD_INPUT_CLASSES}
             onChange={(event) => update("countryCode")(event.target.value)}
             value={address.countryCode}
           >
@@ -168,13 +176,13 @@ export function BillingStep({
         ) : (
           <input
             autoComplete={field.autoComplete}
-            className={INPUT_CLASSNAME}
+            className={FIELD_INPUT_CLASSES}
             onChange={(event) => update(key)(event.target.value)}
             value={address[key]}
           />
         )}
         {errors[key] ? (
-          <span className="mt-1 block text-[11px] font-medium normal-case tracking-normal text-error">
+          <span className={FIELD_ERROR_CLASSES}>
             {fieldErrorMessage(errors[key])}
           </span>
         ) : null}
@@ -192,7 +200,7 @@ export function BillingStep({
         <>
           {savedAddress ? (
             <button
-              className="flex items-center gap-1 text-xs font-bold uppercase tracking-[0.14em] text-brandBlue transition hover:text-brandInk"
+              className={TOGGLE_CLASSNAME}
               onClick={collapse}
               type="button"
             >
@@ -223,12 +231,13 @@ export function BillingStep({
           </div>
 
           {saveError ? <p className="text-sm font-semibold text-error">{saveError}</p> : null}
-          <Button className="w-full" disabled={saving} onClick={() => void save()} size="lg" type="button">
+          {/* Flat: Pay is the page's one gradient primary, and it can show at the same time. */}
+          <Button className="w-full" disabled={saving} onClick={() => void save()} size="lg" type="button" variant="flat">
             {saving ? "Saving…" : "Save address"}
           </Button>
         </>
       ) : (
-        <div className="rounded-[12px] border border-outline bg-mist p-4">
+        <div className="rounded-[16px] border border-outline/70 bg-surfaceBright p-4">
           <p className="text-sm font-bold text-brandInk">{address.holdersName}</p>
           <p className="mt-1 text-sm text-onSurfaceVariant">{address.address1}</p>
           <p className="text-sm text-onSurfaceVariant">
@@ -237,7 +246,7 @@ export function BillingStep({
           <p className="text-sm text-onSurfaceVariant">{countryName}</p>
           <p className="mt-1 text-sm text-onSurfaceVariant">{address.phoneNumber}</p>
           <button
-            className="mt-3 flex items-center gap-1 text-xs font-bold uppercase tracking-[0.14em] text-brandBlue transition hover:text-brandInk"
+            className={`mt-1 ${TOGGLE_CLASSNAME}`}
             onClick={() => setEditing(true)}
             type="button"
           >
```

- [ ] **Step 6: Watch it pass, then full suite + types**

Run: `pnpm exec vitest run src/app/checkout/checkout-steps.test.ts && pnpm test && pnpm exec tsc --noEmit`
Expected: 4 tests pass; then **80 files, 632 tests**; tsc clean.

- [ ] **Step 7: Commit (controller)**

```bash
git add src/app/components/fieldClasses.ts src/app/checkout/steps/CardStep.tsx src/app/checkout/steps/BillingStep.tsx src/app/checkout/checkout-steps.test.ts
git commit -m "feat(checkout): shared 48px fields; real Pay button sticks to the bottom below lg; flat Save address"
```

---

### Task 3: `OrderSummary` (not wired yet)

**Files:**
- Create: `src/app/checkout/OrderSummary.tsx`
- Test: `src/app/checkout/order-summary.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/app/checkout/order-summary.test.ts`:

```ts
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const summary = readFileSync("src/app/checkout/OrderSummary.tsx", "utf8");

describe("checkout order summary", () => {
  it("is one panel: a phone disclosure bar over a panel that is always open at lg", () => {
    expect(summary).toContain("aria-controls={PANEL_ID}");
    expect(summary).toContain("aria-expanded={expanded}");
    expect(summary).toContain("id={PANEL_ID}");
    expect(summary).toContain("orderSummaryToggleLabel(expanded, total)");
    // The bar only exists below lg; the panel is display:none until opened, and always shown at lg.
    expect(summary).toMatch(/className="flex h-14 w-full[^"]*lg:hidden"/);
    expect(summary).toContain('${expanded ? "mt-3 block" : "hidden"}');
    expect(summary).toContain("lg:block");
    expect(summary).toContain("lg:sticky lg:top-6");
  });

  it("mounts PromoCodeField exactly once, so a stored code is checked once", () => {
    expect(summary.match(/<PromoCodeField\b/g)).toHaveLength(1);
    expect(summary).toContain("onPendingChange={onPromoPendingChange}");
  });

  it("reuses the plan-row pieces and the pure totals", () => {
    expect(summary).toContain("<PlanDataDisc plan={plan} />");
    expect(summary).toContain("planRowTags(plan, { position: null })");
    expect(summary).toContain("checkoutTotal(plan, promo, promoPending)");
    expect(summary).toContain("checkoutPriceLines(plan, promo)");
    expect(summary).toContain("coverageCountries(plan.countries)");
  });

  it("uses tokens only, on the surfaceBright panel", () => {
    expect(summary).toContain("bg-surfaceBright");
    expect(summary).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(summary).not.toContain("bg-mist");
  });
});
```

- [ ] **Step 2: Watch it fail**

Run: `pnpm exec vitest run src/app/checkout/order-summary.test.ts`
Expected: FAIL with ENOENT on `OrderSummary.tsx`.

- [ ] **Step 3: Create `src/app/checkout/OrderSummary.tsx`**

`flagEmoji` moves here unchanged from `CheckoutPriceSection.tsx` (Task 4 removes it there). The `<img>` gets `width`/`height` attributes so the 44px slot is reserved.

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, Globe2, Lock } from "lucide-react";
import {
  PAYMENT_TRUST_NOTE,
  checkoutPriceLines,
  checkoutTotal,
  coverageCountries,
  orderSummaryToggleLabel,
} from "@/lib/checkoutSummary";
import { planDurationText, planRowTags, planVoiceSmsDetail } from "@/lib/planRow";
import type { HeroPackageOption } from "@/services/packages";
import { PlanDataDisc, PlanTags } from "@/app/components/PlanRow";
import { PromoCodeField, type AppliedPromo } from "./PromoCodeField";

/**
 * ISO 3166-1 alpha-2 -> flag emoji, via the regional-indicator-symbol trick
 * (each letter maps to the Unicode codepoint 0x1F1E6 + its offset from 'A').
 * Falls back to the globe glyph for anything that isn't a plain two-letter
 * code (Airalo's `countryCode` is always alpha-2 for real countries).
 */
function flagEmoji(countryCode: string): string {
  const code = countryCode.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(code)) return "🌍";
  return String.fromCodePoint(...[...code].map((c) => 0x1f1e6 + (c.charCodeAt(0) - 65)));
}

const PANEL_ID = "checkout-order-summary";

/**
 * The checkout's one order summary (spec option B). There is exactly one
 * instance, so PromoCodeField mounts once and its stored-code check runs once:
 * - below lg: a "Show order summary · €X" bar that expands the panel in place;
 * - lg+: the bar hides and the panel is always open, sticky in the right column.
 * `hidden` (display:none) keeps the collapsed panel mounted, so a stored partner
 * code is still re-checked on phones before Pay is enabled.
 */
export function OrderSummary({
  plan,
  promo,
  promoPending,
  onPromoChange,
  onPromoPendingChange,
  className = "",
}: {
  plan: HeroPackageOption;
  promo: AppliedPromo | null;
  promoPending: boolean;
  onPromoChange: (promo: AppliedPromo | null) => void;
  onPromoPendingChange: (pending: boolean) => void;
  className?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [countriesExpanded, setCountriesExpanded] = useState(false);
  const [flagFailed, setFlagFailed] = useState(false);

  const total = checkoutTotal(plan, promo, promoPending);
  const lines = checkoutPriceLines(plan, promo);
  const planCountries = coverageCountries(plan.countries);
  const voiceSms = planVoiceSmsDetail(plan);
  // Not in a list, so no "Best value": just the discount and Calls + SMS tags.
  const tags = planRowTags(plan, { position: null });

  return (
    <aside aria-label="Order summary" className={`min-w-0 lg:sticky lg:top-6 lg:self-start ${className}`}>
      <button
        aria-controls={PANEL_ID}
        aria-expanded={expanded}
        className="flex h-14 w-full items-center justify-between gap-3 rounded-[16px] border border-outline/70 bg-surfaceBright px-4 text-left text-sm font-bold text-brandBlue transition hover:border-brandBlue/40 lg:hidden"
        onClick={() => setExpanded((value) => !value)}
        type="button"
      >
        <span className="min-w-0 truncate">{orderSummaryToggleLabel(expanded, total)}</span>
        <ChevronDown
          aria-hidden="true"
          className={`shrink-0 motion-safe:transition-transform ${expanded ? "rotate-180" : ""}`}
          size={18}
        />
      </button>

      <div
        className={`${expanded ? "mt-3 block" : "hidden"} rounded-[24px] border border-outline/70 bg-surfaceBright p-4 sm:p-6 lg:mt-0 lg:block`}
        id={PANEL_ID}
      >
        <h2 className="sr-only lg:not-sr-only lg:mb-4 lg:text-xs lg:font-bold lg:uppercase lg:tracking-[0.14em] lg:text-onSurfaceVariant">
          Order summary
        </h2>

        <div className="flex items-center gap-3">
          {plan.flagUri && !flagFailed ? (
            <img
              alt=""
              className="h-11 w-11 shrink-0 rounded-full border border-outline/60 object-cover"
              height={44}
              onError={() => setFlagFailed(true)}
              src={plan.flagUri}
              width={44}
            />
          ) : (
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-outline/60 bg-surface text-brandBlue">
              <Globe2 aria-hidden="true" size={20} />
            </span>
          )}
          <div className="min-w-0">
            <p className="truncate font-display text-base font-black text-brandInk">{plan.country}</p>
            <p className="truncate text-body-sm text-onSurfaceVariant">{plan.title}</p>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3 rounded-[16px] border border-outline/60 bg-surface p-3">
          <PlanDataDisc plan={plan} />
          <div className="min-w-0 flex-1">
            <p className="font-display text-title-sm font-black text-brandInk">{planDurationText(plan)}</p>
            {voiceSms ? <p className="truncate text-body-sm text-onSurfaceVariant">{voiceSms}</p> : null}
            <PlanTags className="mt-1" tags={tags} />
          </div>
        </div>

        {planCountries.length > 0 ? (
          <div className="mt-3">
            <button
              aria-expanded={countriesExpanded}
              className="flex min-h-11 w-full items-center justify-between gap-2 rounded-[12px] bg-brandBlue/10 px-3 text-[13px] font-bold text-brandBlue transition-colors hover:bg-brandBlue/15"
              onClick={() => setCountriesExpanded((value) => !value)}
              type="button"
            >
              <span className="min-w-0 truncate">
                {plan.country} covers {planCountries.length} countries
              </span>
              <ChevronDown
                aria-hidden="true"
                className={`shrink-0 motion-safe:transition-transform ${countriesExpanded ? "rotate-180" : ""}`}
                size={16}
              />
            </button>
            {countriesExpanded ? (
              <div className="relative -mx-1 mt-2 flex gap-2 overflow-x-auto px-1 pb-1">
                {planCountries.map((country) => (
                  <span
                    className="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-outline/60 bg-surface px-2.5 py-1 text-[12px] text-brandInk"
                    key={country.countryCode}
                  >
                    <span aria-hidden="true">{flagEmoji(country.countryCode)}</span>
                    {country.title}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="mt-5 border-t border-outline/70 pt-5">
          <PromoCodeField onChange={onPromoChange} onPendingChange={onPromoPendingChange} packageId={plan.id} />
        </div>

        <dl className="mt-5 space-y-2 border-t border-outline/70 pt-5 text-sm">
          {lines.map((line) => (
            <div className="flex items-center justify-between gap-4" key={line.kind}>
              <dt className="text-onSurfaceVariant">{line.label}</dt>
              <dd className={`font-bold ${line.kind === "plan" ? "text-brandInk" : "text-brandBlue"}`}>{line.value}</dd>
            </div>
          ))}
          <div className="flex items-end justify-between gap-4 border-t border-outline/70 pt-3">
            <dt className="font-bold text-brandInk">Total</dt>
            <dd className="font-display text-3xl font-black tracking-[-0.04em] text-brandInk">
              {total ?? (
                <span
                  aria-hidden="true"
                  className="inline-block h-8 w-24 rounded-md bg-outline/40 align-middle motion-safe:animate-pulse"
                />
              )}
            </dd>
          </div>
        </dl>

        <p className="mt-5 hidden items-start gap-2 text-body-sm text-onSurfaceVariant lg:flex">
          <Lock aria-hidden="true" className="mt-0.5 shrink-0 text-brandBlue" size={15} />
          {PAYMENT_TRUST_NOTE}
        </p>

        <p className="mt-4 text-center text-xs text-onSurfaceVariant">
          Changed your mind?{" "}
          <Link className="font-semibold text-brandBlue hover:text-brandInk" href="/destinations">
            Browse other destinations
          </Link>
        </p>
      </div>
    </aside>
  );
}
```

- [ ] **Step 4: Watch it pass, then full suite + types**

Run: `pnpm exec vitest run src/app/checkout/order-summary.test.ts && pnpm test && pnpm exec tsc --noEmit`
Expected: 4 tests pass; then **81 files, 636 tests**; tsc clean.

- [ ] **Step 5: Commit (controller)**

```bash
git add src/app/checkout/OrderSummary.tsx src/app/checkout/order-summary.test.ts
git commit -m "feat(checkout): OrderSummary (phone disclosure bar, sticky lg panel, one promo field)"
```

---

### Task 4: Checkout layout: two columns, summary first, numbered steps

**Files:**
- Modify: `src/app/checkout/page.tsx`, `src/app/checkout/CheckoutWizard.tsx`, `src/app/checkout/PromoCodeField.tsx`
- Rewrite: `src/app/checkout/CheckoutPriceSection.tsx`
- Modify: `src/app/discount-display-wiring.test.ts` (see "Changed assertions")
- Test: `src/app/checkout/checkout-layout.test.ts`

- [ ] **Step 1: Write the failing test and update the discount assertion**

Create `src/app/checkout/checkout-layout.test.ts`:

```ts
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const page = readFileSync("src/app/checkout/page.tsx", "utf8");
const section = readFileSync("src/app/checkout/CheckoutPriceSection.tsx", "utf8");
const wizard = readFileSync("src/app/checkout/CheckoutWizard.tsx", "utf8");
const promoField = readFileSync("src/app/checkout/PromoCodeField.tsx", "utf8");
const HEX = /#[0-9a-fA-F]{3,8}\b/;

describe("checkout page layout (spec option B)", () => {
  it("clips instead of hiding overflow, so the sticky summary and Pay bar can stick (f215)", () => {
    expect(page).toContain('<main className="min-h-screen overflow-x-clip');
    expect(page).not.toContain("overflow-x-hidden");
    // The gutter the sticky Pay bar bleeds into (CardStep: -mx-4 sm:-mx-6).
    expect(page).toContain("px-4 pb-16 pt-[92px] sm:px-6");
  });

  it("leads the left column with the eyebrow, plan title and the same sub-copy", () => {
    expect(page).toContain("Secure checkout");
    expect(page).toContain("{plan.title}");
    expect(page).toContain("Review your plan and pay below.");
    expect(page.indexOf("<CheckoutPriceSection")).toBeLessThan(page.indexOf("Secure checkout"));
    expect(section).toContain("{children}");
  });

  it("puts the one summary first in the DOM (phone bar under the top bar) and in the right column at lg", () => {
    expect(section).toContain("lg:grid-cols-[minmax(0,1fr)_380px]");
    expect(section).toContain('className="lg:col-start-2 lg:row-start-1"');
    expect(section.indexOf("<OrderSummary")).toBeLessThan(section.indexOf("<CheckoutWizard"));
    expect(section.match(/<OrderSummary\b/g)).toHaveLength(1);
  });

  it("keeps the sign-in gate and the partner-code gating of the payment intent", () => {
    expect(section).toContain("Sign in to complete your purchase");
    expect(section).toContain("href={`/signin?next=${encodeURIComponent(`/checkout?package=${plan.id}`)}`}");
    expect(section).toContain("disabled={promoPending}");
    expect(wizard).toContain("window.location.assign(`/signin?next=${encodeURIComponent(`/checkout?package=${packageId}`)}`)");
    expect(wizard).toContain("Payment reference:");
  });

  it("never shifts step 02 or the footer while the client steps load (CLS 0)", () => {
    expect(wizard).toContain("onLoaded={markBillingLoaded}");
    expect(wizard).toContain('${billingLoaded ? "" : "invisible"}');
    // The footer starts below the fold, so the card step streaming in can't move it on screen.
    expect(page).toContain("min-h-[calc(100svh+24px)]");
  });

  it("shows the Pokpay note once per screen: in step 02 below lg, in the summary at lg", () => {
    expect(wizard).toContain('noteClassName="lg:hidden"');
    expect(wizard).toContain("{PAYMENT_TRUST_NOTE}");
  });

  it("restyles the partner-code field with the shared controls and a flat Apply", () => {
    expect(promoField).toContain("FIELD_CONTROL_CLASSES");
    expect(promoField).toMatch(/size="md" type="submit" variant="flat"/);
    expect(promoField).not.toContain("bg-mist");
    for (const source of [page, section, wizard, promoField]) {
      expect(source).not.toMatch(HEX);
    }
  });
});
```

In `src/app/discount-display-wiring.test.ts`, replace the whole first `it(...)` block (the one that reads `CheckoutPriceSection.tsx`) with:

```ts
  it("checkout breaks an active discount out as plan price, then the discount, in the order summary", () => {
    // The checkout summary's price lines are pure rules (lib/checkoutSummary.ts),
    // rendered by OrderSummary.tsx; CheckoutPriceSection only owns the promo state.
    const rules = readFileSync(join(process.cwd(), "src/lib/checkoutSummary.ts"), "utf8");
    const summary = readFileSync(join(process.cwd(), "src/app/checkout/OrderSummary.tsx"), "utf8");

    expect(rules).toContain("hasActiveDiscount(plan)");
    expect(rules).toContain("formatOriginalPrice(plan)");
    expect(rules).toContain("discountPercentOff(plan)");
    expect(summary).toContain("checkoutPriceLines(plan, promo)");
  });
```

- [ ] **Step 2: Watch them fail**

Run: `pnpm exec vitest run src/app/checkout/checkout-layout.test.ts src/app/discount-display-wiring.test.ts`
Expected: `checkout-layout.test.ts` FAILS, because `overflow-x-clip`, `{children}`, `<OrderSummary` and `PAYMENT_TRUST_NOTE` aren't in the sources yet. The updated discount test already passes: Tasks 1 and 3 created the two files it now reads.

- [ ] **Step 3: Rewrite `src/app/checkout/CheckoutPriceSection.tsx`**

```tsx
"use client";

import { useState, type ReactNode } from "react";
import { LogIn } from "lucide-react";
import type { HeroPackageOption } from "@/services/packages";
import { LinkButton } from "@/app/components/Button";
import { CheckoutWizard } from "./CheckoutWizard";
import { OrderSummary } from "./OrderSummary";
import type { AppliedPromo } from "./PromoCodeField";

/**
 * The `plan.hasDiscount`/`retailPrice` fields describe an admin-set retail
 * discount already baked into `plan.price` — a different mechanism from a
 * partner promo code applied at checkout. When a promo is applied we trust
 * `finalCustomerPriceCents` from the backend outright (it already accounts
 * for whatever admin discount was in effect) and swap it in as the total,
 * rather than trying to recompute/stack the two client-side. The summary's
 * price lines (lib/checkoutSummary.ts) still show the admin discount above it.
 */
type CountryOption = { code: string; name: string };

/**
 * One-page checkout (spec option B). The summary comes first in the DOM, so on
 * phones its "Show order summary · €X" bar sits right under the top bar; at lg it
 * moves to the sticky right column. `children` is the server-rendered heading
 * (eyebrow, plan title, sub-copy), which leads the left column.
 */
export function CheckoutPriceSection({
  plan,
  accountEmail,
  countries,
  children
}: {
  plan: HeroPackageOption;
  accountEmail: string | null;
  countries: CountryOption[];
  children: ReactNode;
}) {
  const [promo, setPromo] = useState<AppliedPromo | null>(null);
  // Tracks whether a promo-apply request (manual, or the silent on-mount
  // re-validation of a stored code) is currently in flight. Used to both
  // gate Pay (so a payment can't be created while the promo state is
  // unsettled) and to avoid flashing the full price before a stored code's
  // discount is confirmed.
  const [promoPending, setPromoPending] = useState(false);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start lg:gap-12">
      <OrderSummary
        className="lg:col-start-2 lg:row-start-1"
        onPromoChange={setPromo}
        onPromoPendingChange={setPromoPending}
        plan={plan}
        promo={promo}
        promoPending={promoPending}
      />

      <div className="min-w-0 lg:col-start-1 lg:row-start-1">
        {children}

        {!accountEmail ? (
          <div className="mt-6 rounded-[16px] border border-brandBlue/30 bg-brandBlue/5 p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <LogIn aria-hidden="true" className="mt-1 shrink-0 text-brandBlue" size={20} />
              <div className="min-w-0">
                <h2 className="font-semibold text-brandInk">Sign in to complete your purchase</h2>
                <p className="mt-1 text-sm text-onSurfaceVariant">
                  Sign in or create an account to proceed with this eSIM purchase.
                </p>
                <LinkButton
                  className="mt-3"
                  href={`/signin?next=${encodeURIComponent(`/checkout?package=${plan.id}`)}`}
                  size="md"
                  variant="primary"
                >
                  Sign in to checkout
                </LinkButton>
              </div>
            </div>
          </div>
        ) : null}

        <div className="mt-8">
          <CheckoutWizard
            accountEmail={accountEmail}
            countries={countries}
            disabled={promoPending}
            packageId={plan.id}
            promoCode={promo?.promoCode ?? null}
          />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Replace `src/app/checkout/page.tsx`**

```tsx
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { Lock } from "lucide-react";
import { createMetadata } from "@/lib/seo";
import { backendFetch } from "@/lib/backend";
import { ACCESS_COOKIE } from "@/lib/session";
import { readEmailFromAccessToken } from "@/lib/session-identity";
import { getPackageOption } from "@/services/server-packages";
import { Navbar } from "../components/Navbar";
import { SiteFooter } from "../SiteFooter";
import { CheckoutPriceSection } from "./CheckoutPriceSection";

type EsimCountry = { code: string; name: string; geography: string };

export const metadata: Metadata = createMetadata({
  path: "/checkout",
  title: "Checkout | eSim2you",
  description: "Review your eSIM plan and pay securely.",
  indexable: false
});

export default async function CheckoutPage({
  searchParams
}: {
  searchParams: Promise<{ package?: string }>;
}) {
  const { package: packageId = "" } = await searchParams;
  const plan = await getPackageOption(packageId);

  if (!plan) {
    notFound();
  }

  const jar = await cookies();
  const accountEmail = readEmailFromAccessToken(jar.get(ACCESS_COOKIE)?.value);

  const countriesResult = await backendFetch<{ countries: EsimCountry[] }>("/esim/countries");
  const countries = countriesResult.ok
    ? countriesResult.data.countries
        .filter((country) => country.geography === "local")
        .map((country) => ({ code: country.code, name: country.name }))
    : [];

  return (
    // overflow-x-clip, not -hidden: hidden would make <main> a scroll container and
    // the sticky summary (lg) and sticky Pay bar (phones) would never stick (f215).
    <main className="min-h-screen overflow-x-clip bg-surface text-onSurface">
      <Navbar />

      {/* px-4 sm:px-6 is the gutter CardStep's sticky Pay bar bleeds into (-mx-4 sm:-mx-6). */}
      <section className="mx-auto min-h-[calc(100svh+24px)] w-full max-w-[1120px] px-4 pb-16 pt-[92px] sm:px-6 lg:px-10 lg:pb-24 lg:pt-[108px]">
        <CheckoutPriceSection accountEmail={accountEmail} countries={countries} plan={plan}>
          <p className="inline-flex items-center gap-1.5 rounded-full bg-brandBlue/10 px-3 py-1 text-xs font-bold text-brandBlue">
            <Lock aria-hidden="true" size={13} />
            Secure checkout
          </p>

          <h1 className="mt-3 break-words font-display text-[28px] font-black leading-[1.15] tracking-[-0.03em] text-brandInk sm:text-4xl">
            {plan.title}
          </h1>

          <p className="mt-2 max-w-[52ch] text-sm leading-6 text-onSurfaceVariant">
            Review your plan and pay below. Your eSIM and QR code are delivered to your account
            the moment payment clears.
          </p>
        </CheckoutPriceSection>
      </section>

      <SiteFooter />
    </main>
  );
}
```

- [ ] **Step 5: Replace `src/app/checkout/CheckoutWizard.tsx`**

The intent effect, the 401 redirect, `handlePaid`, provisioning and the payment-reference error are unchanged. New are `billingLoaded`/`markBillingLoaded`, the status-message wrapper (`mb-4 space-y-2 empty:hidden`, so a message and the card fields don't touch) and `StepHeading`.

```tsx
"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { BillingAddress } from "@/app/bff/user/billing-address/route";
import { PAYMENT_TRUST_NOTE } from "@/lib/checkoutSummary";
import { BillingStep } from "./steps/BillingStep";
import { CardStep } from "./steps/CardStep";

type CountryOption = { code: string; name: string };

export function CheckoutWizard({
  packageId,
  promoCode,
  accountEmail,
  countries,
  disabled = false
}: {
  packageId: string;
  promoCode?: string | null;
  accountEmail: string | null;
  countries: CountryOption[];
  disabled?: boolean;
}) {
  const router = useRouter();
  const [billingAddress, setBillingAddress] = useState<BillingAddress | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [environment, setEnvironment] = useState<string>("staging");
  const [cardError, setCardError] = useState<string | null>(null);
  const [intentError, setIntentError] = useState<string | null>(null);
  const [creatingIntent, setCreatingIntent] = useState(false);
  // Step 02 stays invisible (still laid out, so nothing pops in) until the billing
  // step has its real height: the saved address or the form replaces a one-line
  // loading note, and a visible step 02 below it would jump (CLS).
  const [billingLoaded, setBillingLoaded] = useState(false);
  const markBillingLoaded = useCallback(() => setBillingLoaded(true), []);

  // Creates (or re-creates) the payment intent as soon as the package/promo
  // are settled — there is no "Continue to payment" click anymore, so this
  // is the only trigger. Re-runs if promoCode changes later (e.g. the
  // shopper applies a code after the card form is already showing), since
  // the charge amount depends on it; the card step below just gets a fresh
  // paymentId when that happens.
  useEffect(() => {
    if (disabled) return;
    let cancelled = false;

    void (async () => {
      setCreatingIntent(true);
      setIntentError(null);
      try {
        const response = await fetch("/bff/payments/intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            package_id: packageId,
            ...(promoCode ? { promo_code: promoCode } : {})
          })
        });

        if (response.status === 401) {
          window.location.assign(`/signin?next=${encodeURIComponent(`/checkout?package=${packageId}`)}`);
          return;
        }

        const payload = (await response.json().catch(() => ({}))) as {
          data?: { paymentId?: string; environment?: string };
          error?: string;
        };

        if (cancelled) return;

        if (!response.ok || !payload.data?.paymentId) {
          setIntentError(payload.error ?? "We could not start the payment. Please try again.");
          return;
        }

        setPaymentId(payload.data.paymentId);
        setEnvironment(payload.data.environment ?? "staging");
      } catch {
        if (!cancelled) setIntentError("We could not reach the payment service. Please try again.");
      } finally {
        if (!cancelled) setCreatingIntent(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [packageId, promoCode, disabled]);

  const handlePaid = useCallback(async () => {
    if (!paymentId) return;
    try {
      const response = await fetch("/bff/payments/provision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payment_id: paymentId })
      });
      const payload = (await response.json().catch(() => ({}))) as {
        data?: { order?: { id: number | string } };
        error?: string;
      };

      if (!response.ok || !payload.data?.order) {
        setCardError(
          payload.error ??
            "Your payment went through, but we could not finish setting up your eSIM. Please contact support with your payment reference."
        );
        return;
      }

      // Lands on the existing order page — same destination the hosted-redirect
      // flow ended at (/account/{orderId}?new=1), via client navigation.
      router.push(`/account/${payload.data.order.id}?new=1`);
    } catch {
      setCardError(
        "Your payment went through, but we could not confirm it with our server. Please contact support with your payment reference."
      );
    }
  }, [paymentId, router]);

  return (
    <div>
      <section aria-labelledby="checkout-step-billing" className="border-b border-outline/70 pb-8">
        <StepHeading id="checkout-step-billing" number="01" title="Billing address">
          Used for your receipt and card verification.
        </StepHeading>
        <BillingStep
          accountEmail={accountEmail}
          countries={countries}
          onAddressReady={setBillingAddress}
          onLoaded={markBillingLoaded}
        />
      </section>

      <section aria-labelledby="checkout-step-card" className={`pt-8 ${billingLoaded ? "" : "invisible"}`}>
        {/* At lg the order summary carries the Pokpay note, so it shows once per screen. */}
        <StepHeading id="checkout-step-card" number="02" noteClassName="lg:hidden" title="Card details">
          {PAYMENT_TRUST_NOTE}
        </StepHeading>

        <div className="mb-4 space-y-2 empty:hidden">
          {disabled ? (
            <p className="text-sm text-onSurfaceVariant">Finish applying your partner code first.</p>
          ) : null}
          {creatingIntent && !paymentId ? (
            <p className="text-sm text-onSurfaceVariant">Preparing secure payment…</p>
          ) : null}
          {intentError ? <p className="text-sm font-semibold text-error">{intentError}</p> : null}

          {cardError ? (
            <p className="text-sm font-semibold text-error">
              {cardError}
              <br />
              Payment reference: <span className="font-mono font-bold">{paymentId}</span>
            </p>
          ) : null}
        </div>

        {paymentId && billingAddress ? (
          <CardStep
            billingAddress={billingAddress}
            environment={environment}
            onPaid={() => void handlePaid()}
            paymentId={paymentId}
          />
        ) : null}
      </section>
    </div>
  );
}

/** "01 Billing address": a numbered step heading, as in the app's checkout. */
function StepHeading({
  id,
  number,
  title,
  noteClassName = "",
  children
}: {
  id: string;
  number: string;
  title: string;
  noteClassName?: string;
  children: ReactNode;
}) {
  return (
    <div className="mb-5 flex items-start gap-3">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brandBlue/10 font-display text-[13px] font-black text-brandBlue">
        {number}
      </span>
      <div className="min-w-0 pt-1">
        <h2 className="font-display text-title-sm font-black text-brandInk" id={id}>
          {title}
        </h2>
        <p className={`mt-0.5 text-body-sm text-onSurfaceVariant ${noteClassName}`}>{children}</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Edit `src/app/checkout/PromoCodeField.tsx`**

Apply this diff. Its `mt-4` wrappers go because `OrderSummary` owns the spacing now (`mt-5 border-t pt-5`):

```diff
diff --git a/src/app/checkout/PromoCodeField.tsx b/src/app/checkout/PromoCodeField.tsx
index f00fd51..3a806fd 100644
--- a/src/app/checkout/PromoCodeField.tsx
+++ b/src/app/checkout/PromoCodeField.tsx
@@ -3,6 +3,7 @@
 import { FormEvent, useEffect, useState } from "react";
 import { Check, Loader2 } from "lucide-react";
 import { Button } from "@/app/components/Button";
+import { FIELD_CONTROL_CLASSES, FIELD_LABEL_CLASSES, FIELD_TEXT_CLASSES } from "@/app/components/fieldClasses";
 
 export const PROMO_STORAGE_KEY = "esim2you.checkout.promo";
 const STORAGE_KEY = PROMO_STORAGE_KEY;
@@ -168,8 +169,8 @@ export function PromoCodeField({
 
   if (checkingStoredCode) {
     return (
-      <div className="mt-4 flex items-center gap-2 rounded-[12px] border border-outline bg-mist px-4 py-3 text-sm font-medium text-onSurfaceVariant">
-        <Loader2 className="animate-spin" size={16} />
+      <div className="flex min-h-12 items-center gap-2 rounded-[12px] border border-outline/70 bg-surface px-4 text-sm font-medium text-onSurfaceVariant">
+        <Loader2 aria-hidden="true" className="animate-spin" size={16} />
         Checking your saved code…
       </div>
     );
@@ -177,13 +178,13 @@ export function PromoCodeField({
 
   if (applied) {
     return (
-      <div className="mt-4 flex items-center justify-between gap-3 rounded-[12px] border border-outline bg-mist px-4 py-3">
-        <span className="inline-flex items-center gap-2 text-sm font-bold text-brandInk">
-          <Check className="text-brandTeal" size={16} />
+      <div className="flex min-h-12 items-center justify-between gap-3 rounded-[12px] border border-outline/70 bg-surface pl-4 pr-1">
+        <span className="inline-flex min-w-0 items-center gap-2 text-sm font-bold text-brandInk">
+          <Check aria-hidden="true" className="shrink-0 text-brandTeal" size={16} />
           Partner Code: {applied.promoCode.toUpperCase()} ✓
         </span>
         <button
-          className="text-xs font-bold text-brandBlue hover:text-brandInk"
+          className="inline-flex min-h-11 shrink-0 items-center px-3 text-xs font-bold text-brandBlue hover:text-brandInk"
           onClick={change}
           type="button"
         >
@@ -194,16 +195,13 @@ export function PromoCodeField({
   }
 
   return (
-    <form className="mt-4" onSubmit={submit}>
-      <label
-        className="block text-xs font-bold uppercase tracking-[0.14em] text-onSurfaceVariant"
-        htmlFor="promo-code"
-      >
+    <form onSubmit={submit}>
+      <label className={FIELD_LABEL_CLASSES} htmlFor="promo-code">
         Partner code
       </label>
       <div className="mt-2 flex items-center gap-2">
         <input
-          className="h-11 flex-1 rounded-[12px] border border-outline bg-mist px-4 text-sm font-medium uppercase text-brandInk outline-none transition focus:border-brandBlue"
+          className={`${FIELD_CONTROL_CLASSES} ${FIELD_TEXT_CLASSES} min-w-0 flex-1 uppercase`}
           disabled={busy}
           id="promo-code"
           onChange={(event) => {
@@ -213,7 +211,8 @@ export function PromoCodeField({
           placeholder="Enter code"
           value={code}
         />
-        <Button aria-busy={busy} disabled={busy || !code.trim()} size="sm" type="submit">
+        {/* Flat: Pay is the page's one gradient primary. */}
+        <Button aria-busy={busy} className="shrink-0" disabled={busy || !code.trim()} size="md" type="submit" variant="flat">
           {busy ? <Loader2 className="animate-spin" size={16} /> : null}
           {busy ? "Applying…" : "Apply"}
         </Button>
```

- [ ] **Step 7: Watch them pass, then full suite + types**

Run: `pnpm exec vitest run src/app/checkout src/app/discount-display-wiring.test.ts && pnpm test && pnpm exec tsc --noEmit`
Expected: `src/app/checkout` passes (checkout-flow 18, PromoCodeField 6, steps 4, summary 4, layout 7, plus discount-wiring 3). Then **82 files, 643 tests**; tsc clean.

- [ ] **Step 8: Smoke-check the page (no payment)**

Run: `pnpm build && pnpm start`. Then open `http://localhost:3000/checkout?package=change-plus-7days-1gb` signed out, at 375px and 1440px in DevTools. Expected:
- **375px:** the "Show order summary · €4.00" bar sits under the top bar; tapping it opens the panel. The H1, the gate ("Sign in to complete your purchase") and 01/02 follow. A moment later the page redirects to `/signin?next=%2Fcheckout%3Fpackage%3Dchange-plus-7days-1gb`. That redirect is the existing 401 behaviour (f180).
- **1440px:** the summary is in the right column.

- [ ] **Step 9: Commit (controller)**

```bash
git add src/app/checkout/page.tsx src/app/checkout/CheckoutPriceSection.tsx src/app/checkout/CheckoutWizard.tsx src/app/checkout/PromoCodeField.tsx src/app/checkout/checkout-layout.test.ts src/app/discount-display-wiring.test.ts
git commit -m "feat(checkout): one-page layout, sticky order summary at lg, phone summary bar, numbered steps"
```

---

### Task 5: `checkout/failed`, `checkout/not-found`, `checkout/loading`

**Files:**
- Modify: `src/app/checkout/failed/page.tsx`, `src/app/checkout/not-found.tsx`
- Rewrite: `src/app/checkout/loading.tsx`
- Test: `src/app/checkout/checkout-status-pages.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/app/checkout/checkout-status-pages.test.ts`:

```ts
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const failed = readFileSync("src/app/checkout/failed/page.tsx", "utf8");
const notFound = readFileSync("src/app/checkout/not-found.tsx", "utf8");
const loading = readFileSync("src/app/checkout/loading.tsx", "utf8");
const HEX = /#[0-9a-fA-F]{3,8}\b/;

describe("checkout status pages", () => {
  it("failed: token colours only, the same three outcomes, one gradient primary", () => {
    expect(failed).not.toContain("amber-");
    expect(failed).not.toMatch(HEX);
    expect(failed).toContain("bg-error/10 text-error");
    // Copy is unchanged: only 402 promises the card was untouched (f020).
    expect(failed).toContain("You have not been charged. You can safely try again.");
    expect(failed).toContain("Do not pay again. Contact support with the reference below and we will sort it out.");
    expect(failed.match(/variant="flat"/g)).toHaveLength(1);
    // In the phone column a basis-0 flex-1 squashed the 54px buttons to ~24px.
    expect(failed).not.toContain('className="flex-1"');
    expect(failed.match(/className="w-full sm:flex-1"/g)).toHaveLength(3);
  });

  it("not-found: the same copy and Browse destinations CTA, in a card", () => {
    expect(notFound).toContain("We couldn&apos;t find that plan");
    expect(notFound).toContain('href="/destinations"');
    expect(notFound).toContain("rounded-[24px]");
    expect(notFound).not.toContain("bg-mist");
  });

  it("loading: shaped like the loaded checkout, and still under reduced motion", () => {
    expect(loading).toContain("lg:grid-cols-[minmax(0,1fr)_380px]");
    expect(loading).toContain("motion-safe:animate-pulse");
    expect(loading).toContain('aria-busy="true"');
    expect(loading).not.toMatch(HEX);
  });
});
```

- [ ] **Step 2: Watch it fail**

Run: `pnpm exec vitest run src/app/checkout/checkout-status-pages.test.ts`
Expected: FAIL. `amber-` is still present, `rounded-[24px]` is missing and the skeleton grid is missing.

- [ ] **Step 3: Replace `src/app/checkout/failed/page.tsx`**

`copyFor`, the metadata and every string are unchanged.

```tsx
import type { Metadata } from "next";
import { AlertTriangle, LifeBuoy } from "lucide-react";
import { createMetadata } from "@/lib/seo";
import { Navbar } from "../../components/Navbar";
import { LinkButton } from "../../components/Button";
import { SiteFooter } from "../../SiteFooter";

export const metadata: Metadata = createMetadata({
  path: "/checkout/failed",
  title: "Payment problem | eSim2you",
  description: "We could not complete your eSIM purchase.",
  indexable: false
});

type FailureCopy = {
  heading: string;
  body: string;
  chargeNote: string;
};

/**
 * Only `unpaid` is known to mean the money did not move. Every other outcome may
 * have taken payment, so the copy must never promise the card was untouched.
 */
function copyFor(reason: string): FailureCopy {
  if (reason === "unpaid") {
    return {
      heading: "Your payment wasn't completed",
      body: "The payment was cancelled or declined before it went through, so your plan was not purchased.",
      chargeNote: "You have not been charged. You can safely try again."
    };
  }

  if (reason === "missing_payment") {
    return {
      heading: "We lost track of that payment",
      body: "We couldn't match this return link to a payment. If you completed a payment, it may still be processing.",
      chargeNote:
        "If you were charged, your eSIM will appear in your account shortly. Contact support if it doesn't."
    };
  }

  return {
    heading: "Your payment went through, but setup didn't finish",
    body: "We received your payment but could not finish setting up your eSIM. Our team can complete it for you.",
    chargeNote:
      "Do not pay again. Contact support with the reference below and we will sort it out."
  };
}

export default async function CheckoutFailedPage({
  searchParams
}: {
  searchParams: Promise<{ reason?: string; package?: string; payment?: string }>;
}) {
  const { reason = "provisioning", package: packageId, payment } = await searchParams;
  const copy = copyFor(reason);

  return (
    <main className="min-h-screen bg-surfaceBright text-onSurface">
      <Navbar />

      <section className="mx-auto flex w-full max-w-[1440px] justify-center px-4 pb-16 pt-[92px] sm:px-6 lg:px-10 lg:pb-24 lg:pt-28">
        <div className="w-full max-w-[560px] rounded-[24px] border border-outline/70 bg-surface p-6 shadow-brandCard sm:p-9">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-error/10 text-error">
            <AlertTriangle aria-hidden="true" size={24} />
          </span>

          <h1 className="mt-5 font-display text-2xl font-black tracking-[-0.03em] text-brandInk sm:text-3xl">
            {copy.heading}
          </h1>

          <p className="mt-3 text-sm leading-6 text-onSurfaceVariant">{copy.body}</p>

          <p className="mt-4 rounded-[16px] border border-outline/70 bg-surfaceBright px-4 py-3 text-sm font-semibold text-brandInk">
            {copy.chargeNote}
          </p>

          {payment ? (
            <p className="mt-4 break-all text-xs text-onSurfaceVariant">
              Payment reference:{" "}
              <span className="font-mono font-bold text-brandInk">{payment}</span>
            </p>
          ) : null}

          {/* w-full, not flex-1, below sm: in a column, flex-1 (basis 0) squashed the 54px buttons to ~24px. */}
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            {reason === "unpaid" && packageId ? (
              <LinkButton
                className="w-full sm:flex-1"
                href={`/checkout?package=${encodeURIComponent(packageId)}`}
                size="lg"
              >
                Try again
              </LinkButton>
            ) : (
              <LinkButton className="w-full sm:flex-1" href="/account" size="lg">
                Go to my eSIMs
              </LinkButton>
            )}

            <LinkButton className="w-full sm:flex-1" href="/support" size="lg" tone="brand" variant="flat">
              <LifeBuoy aria-hidden="true" size={17} />
              Contact support
            </LinkButton>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
```

- [ ] **Step 4: Replace `src/app/checkout/not-found.tsx`**

```tsx
import { SearchX } from "lucide-react";
import { Navbar } from "../components/Navbar";
import { LinkButton } from "../components/Button";
import { SiteFooter } from "../SiteFooter";

export default function CheckoutNotFound() {
  return (
    <main className="min-h-screen bg-surfaceBright text-onSurface">
      <Navbar />

      <section className="mx-auto flex w-full max-w-[1440px] justify-center px-4 pb-16 pt-[92px] sm:px-6 lg:px-10 lg:pb-24 lg:pt-28">
        <div className="flex w-full max-w-[560px] flex-col items-center rounded-[24px] border border-outline/70 bg-surface p-6 text-center shadow-brandCard sm:p-9">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-brandBlue/10 text-brandBlue">
            <SearchX aria-hidden="true" size={26} />
          </span>

          <h1 className="mt-5 font-display text-2xl font-black tracking-[-0.03em] text-brandInk sm:text-3xl">
            We couldn&apos;t find that plan
          </h1>

          <p className="mt-3 max-w-[520px] text-sm leading-6 text-onSurfaceVariant">
            The plan in this link is no longer in our catalog. Prices and packages change
            regularly — browse current plans to find the right one for your trip.
          </p>

          <LinkButton className="mt-7 w-full sm:w-auto" href="/destinations" size="lg">
            Browse destinations
          </LinkButton>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
```

- [ ] **Step 5: Replace `src/app/checkout/loading.tsx`**

```tsx
/**
 * Skeleton in the shape of the loaded checkout (OrderSummary + left column), so
 * nothing jumps when the page streams in: the phone summary bar on top, the
 * sticky summary panel on the right at lg.
 */
export default function CheckoutLoading() {
  return (
    <main
      aria-busy="true"
      className="min-h-screen overflow-x-clip bg-surface px-4 pb-16 pt-[92px] sm:px-6 lg:px-10 lg:pb-24 lg:pt-[108px]"
    >
      <div className="mx-auto grid w-full max-w-[1040px] gap-6 motion-safe:animate-pulse lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start lg:gap-12">
        <div className="h-14 rounded-[16px] bg-outline/25 lg:col-start-2 lg:row-start-1 lg:h-[520px] lg:rounded-[24px]" />
        <div className="min-w-0 space-y-4 lg:col-start-1 lg:row-start-1">
          <div className="h-7 w-36 rounded-full bg-outline/25" />
          <div className="h-10 w-2/3 rounded-[16px] bg-outline/25" />
          <div className="h-5 w-full max-w-[52ch] rounded-full bg-outline/25" />
          <div className="!mt-8 h-64 rounded-[24px] bg-outline/25" />
          <div className="h-48 rounded-[24px] bg-outline/25" />
        </div>
      </div>
    </main>
  );
}
```

- [ ] **Step 6: Watch it pass, then full suite + types**

Run: `pnpm exec vitest run src/app/checkout/checkout-status-pages.test.ts && pnpm test && pnpm exec tsc --noEmit`
Expected: 3 tests pass; then **83 files, 646 tests**; tsc clean.

- [ ] **Step 7: Commit (controller)**

```bash
git add src/app/checkout/failed/page.tsx src/app/checkout/not-found.tsx src/app/checkout/loading.tsx src/app/checkout/checkout-status-pages.test.ts
git commit -m "feat(checkout): restyle failed/not-found/loading; fix squashed phone buttons on the failed page"
```

---

### Task 6: Sign-in card, `LinkEmailStep`, Google/Apple row

**Files:**
- Create: `src/app/signin/signInClasses.ts`
- Modify: `src/app/signin/page.tsx`, `src/app/signin/SignInForm.tsx`, `src/app/signin/LinkEmailStep.tsx`, `src/app/signin/SocialSignInButtons.tsx`
- Test: `src/app/signin/signin-card.test.ts`

`signInClasses.ts` is its own module because `SignInForm` imports `LinkEmailStep`. Putting the shared classes in `SignInForm` would make the two files import each other.

- [ ] **Step 1: Write the failing test**

Create `src/app/signin/signin-card.test.ts`:

```ts
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const page = readFileSync("src/app/signin/page.tsx", "utf8");
const form = readFileSync("src/app/signin/SignInForm.tsx", "utf8");
const linkStep = readFileSync("src/app/signin/LinkEmailStep.tsx", "utf8");
const buttons = readFileSync("src/app/signin/SocialSignInButtons.tsx", "utf8");
const classes = readFileSync("src/app/signin/signInClasses.ts", "utf8");
const HEX = /#[0-9a-fA-F]{3,8}\b/;

describe("sign-in card (spec section 5)", () => {
  it("sits on a token background, with no hard-coded colours", () => {
    expect(page).toContain("bg-surfaceBright");
    expect(page).toContain("from-brandBlue/10");
    expect(page).not.toContain("rgba(");
    expect(page).not.toContain("hero-grid");
    for (const source of [page, form, linkStep, classes]) {
      expect(source).not.toMatch(HEX);
      expect(source).not.toContain("bg-mist");
    }
  });

  it("keeps the field order: email, Send code, then Google/Apple, then the terms", () => {
    const email = form.indexOf('autoComplete="email"');
    const sendCode = form.indexOf("Send code");
    const social = form.indexOf("<SocialSignInButtons");
    const terms = form.indexOf("By continuing you agree to our");
    expect(email).toBeGreaterThan(-1);
    expect(email).toBeLessThan(sendCode);
    expect(sendCode).toBeLessThan(social);
    expect(social).toBeLessThan(terms);
  });

  it("uses the shared 48px fields with a focus ring, and 44px text actions", () => {
    expect(form).toContain("className={FIELD_INPUT_CLASSES}");
    expect(form).toContain("className={CODE_INPUT_CLASSES}");
    expect(linkStep).toContain("className={FIELD_INPUT_CLASSES}");
    expect(linkStep).toContain("className={CODE_INPUT_CLASSES}");
    expect(classes).toContain("min-h-11");
    expect(form).toContain("className={SIGN_IN_CARD_CLASSES}");
  });

  it("keeps one gradient primary per step (Send code, Verify and continue)", () => {
    // Button defaults to the gradient primary; sign-in never passes a variant.
    expect(form.match(/<Button\b/g)).toHaveLength(2);
    expect(linkStep.match(/<Button\b/g)).toHaveLength(2);
  });

  it("still measures the row to size Google's fixed-width button (ResizeObserver trap)", () => {
    expect(buttons).toContain("const GOOGLE_MAX_WIDTH = 400;");
    expect(buttons).toContain("new ResizeObserver(");
    expect(buttons).toContain("Math.min(width, GOOGLE_MAX_WIDTH)");
    expect(buttons).toContain("width: googleWidth,");
    expect(buttons).toContain('<div className="mt-5 flex flex-col items-center gap-3" ref={rowRef}>');
    expect(buttons).toContain('<div className="flex h-10 w-full justify-center [&>div>*]:[grid-area:1/1] [&>div]:grid" ref={googleButtonRef} />');
    // Apple matches Google's 40px pill; an invisible ::after takes its hit area to 44px,
    // the same as Google's own 44px iframe.
    expect(buttons).toContain("h-10 w-full");
    expect(buttons).toContain("after:-inset-y-0.5");
  });
});
```

- [ ] **Step 2: Watch it fail**

Run: `pnpm exec vitest run src/app/signin/signin-card.test.ts`
Expected: FAIL with ENOENT on `signInClasses.ts`.

- [ ] **Step 3: Create `src/app/signin/signInClasses.ts`**

```ts
import { FIELD_CONTROL_CLASSES } from "../components/fieldClasses";

/** The sign-in card (SignInForm), also the frame for the LinkEmailStep claim screen. */
export const SIGN_IN_CARD_CLASSES =
  "relative w-full max-w-[440px] rounded-[24px] border border-outline/70 bg-surface p-6 shadow-brandCard sm:p-8";

/** Text-style secondary actions (Use a different email, Resend code), at a 44px tap height. */
export const SIGN_IN_TEXT_ACTION_CLASSES =
  "inline-flex min-h-11 items-center px-1 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50";

/** The 6-digit code field: the shared control, set large and spaced. */
export const CODE_INPUT_CLASSES = `mt-2 ${FIELD_CONTROL_CLASSES} text-center font-display text-xl font-black tracking-[0.4em]`;
```

- [ ] **Step 4: Replace `src/app/signin/page.tsx`**

```tsx
import { Suspense } from "react";
import type { Metadata } from "next";
import { createMetadata } from "@/lib/seo";
import { Navbar } from "../components/Navbar";
import { SiteFooter } from "../SiteFooter";
import { SignInForm } from "./SignInForm";

export const metadata: Metadata = createMetadata({
  path: "/signin",
  title: "Sign in | eSim2you",
  description: "Sign in to buy eSIM plans and manage your data on eSim2you.",
  indexable: false
});

export default function SignInPage() {
  return (
    <main className="min-h-screen overflow-x-clip bg-surfaceBright text-onSurface">
      <Navbar />

      {/* Phones: the card starts under the top bar (no vertical centring that the
          keyboard would push around). sm+: centred in the viewport. */}
      <section className="relative isolate mx-auto flex min-h-[100svh] w-full max-w-[1440px] items-start justify-center px-4 pb-16 pt-[92px] sm:items-center sm:px-6 sm:pt-28 lg:px-10">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] bg-gradient-to-b from-brandBlue/10 to-transparent"
        />

        <Suspense fallback={null}>
          <SignInForm />
        </Suspense>
      </section>

      <SiteFooter />
    </main>
  );
}
```

- [ ] **Step 5: Replace `src/app/signin/SignInForm.tsx`**

The logic is unchanged: `requestCode`, `verifyCode`, the cooldown, `linkChallenge`, `safeNextPath` and every string are the same. Field order is email → Send code → `SocialSignInButtons` → terms.

```tsx
"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Loader2, MailCheck, ShieldCheck } from "lucide-react";
import { safeNextPath } from "@/lib/safe-redirect";
import { Button } from "../components/Button";
import { FIELD_INPUT_CLASSES, FIELD_LABEL_CLASSES } from "../components/fieldClasses";
import { LinkEmailStep } from "./LinkEmailStep";
import { CODE_INPUT_CLASSES, SIGN_IN_CARD_CLASSES, SIGN_IN_TEXT_ACTION_CLASSES } from "./signInClasses";
import { SocialSignInButtons, type LinkChallenge } from "./SocialSignInButtons";

type Step = "email" | "code";

type ApiError = {
  error?: string;
  retryAfterSeconds?: number;
};

async function postJson(url: string, body: unknown) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  const payload = (await response.json().catch(() => ({}))) as ApiError;
  return { ok: response.ok, status: response.status, payload };
}

export function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeNextPath(searchParams.get("next"));
  const isCheckout = next.startsWith("/checkout");

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [linkChallenge, setLinkChallenge] = useState<LinkChallenge | null>(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  async function requestCode(event?: FormEvent) {
    event?.preventDefault();
    setBusy(true);
    setError(null);

    const { ok, payload } = await postJson("/bff/auth/otp/send", { email });

    setBusy(false);

    if (!ok) {
      setError(payload.error ?? "We could not send your code. Please try again.");
      if (typeof payload.retryAfterSeconds === "number") {
        setCooldown(payload.retryAfterSeconds);
      }
      return;
    }

    setStep("code");
    setCooldown(30);
  }

  async function verifyCode(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    const { ok, payload } = await postJson("/bff/auth/otp/verify", { email, otp: code });

    if (!ok) {
      setBusy(false);
      setError(payload.error ?? "That code did not work. Please try again.");
      return;
    }

    // Session cookies are already set by the route handler.
    router.replace(next);
    router.refresh();
  }

  if (linkChallenge) {
    return (
      <div className={SIGN_IN_CARD_CLASSES}>
        <LinkEmailStep
          challenge={linkChallenge}
          next={next}
          onRestart={() => setLinkChallenge(null)}
        />
      </div>
    );
  }

  return (
    <div className={SIGN_IN_CARD_CLASSES}>
      <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-brandBlue/10 text-brandBlue">
        {step === "email" ? <ShieldCheck aria-hidden="true" size={26} /> : <MailCheck aria-hidden="true" size={26} />}
      </span>

      <h1 className="mt-4 text-center font-display text-2xl font-black tracking-[-0.03em] text-brandInk sm:text-3xl">
        {step === "email"
          ? isCheckout
            ? "Sign in to continue your purchase"
            : "Sign in to eSim2you"
          : "Enter your code"}
      </h1>

      <p className="mt-2 text-center text-sm leading-6 text-onSurfaceVariant">
        {step === "email"
          ? isCheckout
            ? "We'll email you a 6-digit code so your eSIM and QR code arrive in your account. No password required."
            : "We'll email you a 6-digit code. No password required."
          : `We sent a 6-digit code to ${email}.`}
      </p>

      {step === "email" ? (
        <>
          <form className="mt-6 space-y-4" onSubmit={requestCode}>
            <label className={FIELD_LABEL_CLASSES}>
              Email address
              <input
                autoComplete="email"
                className={FIELD_INPUT_CLASSES}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                required
                type="email"
                value={email}
              />
            </label>

            {error ? <p className="text-sm font-semibold text-error">{error}</p> : null}

            <Button className="w-full" disabled={busy || !email} size="lg" type="submit">
              {busy ? <Loader2 className="animate-spin" size={18} /> : null}
              Send code
              {busy ? null : <ArrowRight size={17} />}
            </Button>
          </form>

          {/* Outside the form: a provider button is its own sign-in path, not a
              second control of the email one. */}
          <SocialSignInButtons next={next} onLinkRequired={setLinkChallenge} />

          <p className="mt-6 text-center text-xs leading-5 text-onSurfaceVariant">
            By continuing you agree to our{" "}
            <Link className="text-onSurfaceVariant underline underline-offset-2 transition hover:text-brandInk" href="/terms">
              Terms
            </Link>{" "}
            and{" "}
            <Link className="text-onSurfaceVariant underline underline-offset-2 transition hover:text-brandInk" href="/policy">
              Privacy Policy
            </Link>
            .
          </p>
        </>
      ) : (
        <form className="mt-6 space-y-4" onSubmit={verifyCode}>
          <label className={FIELD_LABEL_CLASSES}>
            6-digit code
            <input
              autoComplete="one-time-code"
              className={CODE_INPUT_CLASSES}
              inputMode="numeric"
              maxLength={6}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
              placeholder="000000"
              required
              value={code}
            />
          </label>

          {error ? <p className="text-sm font-semibold text-error">{error}</p> : null}

          <Button className="w-full" disabled={busy || code.length !== 6} size="lg" type="submit">
            {busy ? <Loader2 className="animate-spin" size={18} /> : null}
            Verify and continue
          </Button>

          <div className="flex items-center justify-between gap-3">
            <button
              className={`${SIGN_IN_TEXT_ACTION_CLASSES} text-onSurfaceVariant hover:text-brandInk`}
              onClick={() => {
                setStep("email");
                setCode("");
                setError(null);
              }}
              type="button"
            >
              Use a different email
            </button>

            <button
              className={`${SIGN_IN_TEXT_ACTION_CLASSES} text-brandBlue hover:text-brandInk`}
              disabled={busy || cooldown > 0}
              onClick={() => void requestCode()}
              type="button"
            >
              {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
```

- [ ] **Step 6: Replace `src/app/signin/LinkEmailStep.tsx`**

```tsx
"use client";

import { FormEvent, useEffect, useState } from "react";
import { Loader2, MailCheck } from "lucide-react";
import { Button } from "../components/Button";
import { FIELD_INPUT_CLASSES, FIELD_LABEL_CLASSES } from "../components/fieldClasses";
import { CODE_INPUT_CLASSES, SIGN_IN_TEXT_ACTION_CLASSES } from "./signInClasses";
import type { LinkChallenge } from "./SocialSignInButtons";

type Step = "email" | "code";

/**
 * Claim-by-OTP after a social sign-in whose email could not be trusted.
 *
 * Apple's Hide My Email gives a relay address, and a first sign-in may carry no
 * verified address at all. Neither is safe to key an account on, so the visitor
 * names an email and proves it with a code before the identity is bound.
 *
 * The link ticket stays in component state and never reaches the URL.
 */
export function LinkEmailStep({
  challenge,
  next,
  onRestart
}: {
  challenge: LinkChallenge;
  next: string;
  onRestart: () => void;
}) {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState(challenge.suggestedEmail ?? "");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  async function requestCode(event?: FormEvent) {
    event?.preventDefault();
    setBusy(true);
    setError(null);

    const response = await fetch("/bff/auth/link/otp/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ linkTicket: challenge.linkTicket, email })
    });

    const payload = (await response.json().catch(() => ({}))) as {
      error?: string;
      retryAfterSeconds?: number;
    };

    setBusy(false);

    if (!response.ok) {
      setError(payload.error ?? "We could not send your code. Please try again.");
      if (typeof payload.retryAfterSeconds === "number") {
        setCooldown(payload.retryAfterSeconds);
      }
      return;
    }

    setStep("code");
    setCooldown(30);
  }

  async function verifyCode(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    const response = await fetch("/bff/auth/link/otp/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ linkTicket: challenge.linkTicket, email, otp: code })
    });

    const payload = (await response.json().catch(() => ({}))) as { error?: string };

    if (!response.ok) {
      setBusy(false);
      setError(payload.error ?? "That code did not work. Please try again.");
      return;
    }

    window.location.assign(next);
  }

  return (
    <>
      <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-brandBlue/10 text-brandBlue">
        <MailCheck aria-hidden="true" size={26} />
      </span>

      <h1 className="mt-4 text-center font-display text-2xl font-black tracking-[-0.03em] text-brandInk sm:text-3xl">
        {step === "email" ? "Confirm your email" : "Enter your code"}
      </h1>

      <p className="mt-2 text-center text-sm leading-6 text-onSurfaceVariant">
        {step === "email"
          ? "Almost there. Tell us the email address for your eSim2you account and we'll send a 6-digit code to confirm it."
          : `We sent a 6-digit code to ${email}.`}
      </p>

      {step === "email" ? (
        <form className="mt-6 space-y-4" onSubmit={requestCode}>
          <label className={FIELD_LABEL_CLASSES}>
            Email address
            <input
              autoComplete="email"
              className={FIELD_INPUT_CLASSES}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              required
              type="email"
              value={email}
            />
          </label>

          {error ? <p className="text-sm font-semibold text-error">{error}</p> : null}

          <Button className="w-full" disabled={busy || !email} size="lg" type="submit">
            {busy ? <Loader2 className="animate-spin" size={18} /> : null}
            Send code
          </Button>
        </form>
      ) : (
        <form className="mt-6 space-y-4" onSubmit={verifyCode}>
          <label className={FIELD_LABEL_CLASSES}>
            6-digit code
            <input
              autoComplete="one-time-code"
              className={CODE_INPUT_CLASSES}
              inputMode="numeric"
              maxLength={6}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
              placeholder="000000"
              required
              value={code}
            />
          </label>

          {error ? <p className="text-sm font-semibold text-error">{error}</p> : null}

          <Button className="w-full" disabled={busy || code.length !== 6} size="lg" type="submit">
            {busy ? <Loader2 className="animate-spin" size={18} /> : null}
            Confirm and continue
          </Button>

          <div className="flex items-center justify-between gap-3">
            <button
              className={`${SIGN_IN_TEXT_ACTION_CLASSES} text-onSurfaceVariant hover:text-brandInk`}
              onClick={() => {
                setStep("email");
                setCode("");
                setError(null);
              }}
              type="button"
            >
              Use a different email
            </button>

            <button
              className={`${SIGN_IN_TEXT_ACTION_CLASSES} text-brandBlue hover:text-brandInk`}
              disabled={busy || cooldown > 0}
              onClick={() => void requestCode()}
              type="button"
            >
              {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
            </button>
          </div>
        </form>
      )}

      <button
        className="mx-auto mt-4 flex min-h-11 items-center px-2 text-xs font-bold text-onSurfaceVariant transition hover:text-brandInk"
        onClick={onRestart}
        type="button"
      >
        Start over
      </button>
    </>
  );
}
```

- [ ] **Step 7: Edit `src/app/signin/SocialSignInButtons.tsx`**

Apply this diff. The ResizeObserver, `GOOGLE_MAX_WIDTH`, `renderButton` and the Apple flow are untouched:

```diff
diff --git a/src/app/signin/SocialSignInButtons.tsx b/src/app/signin/SocialSignInButtons.tsx
index 0743594..674811c 100644
--- a/src/app/signin/SocialSignInButtons.tsx
+++ b/src/app/signin/SocialSignInButtons.tsx
@@ -239,7 +239,7 @@ export function SocialSignInButtons({
   }
 
   return (
-    <div className="mt-8">
+    <div className="mt-6">
       <div className="flex items-center gap-4">
         <span className="h-px flex-1 bg-gradient-to-r from-transparent to-outline" />
         <span className="text-[10px] font-black uppercase tracking-[0.22em] text-onSurfaceVariant">
@@ -253,14 +253,18 @@ export function SocialSignInButtons({
           rather than the taller house button above. */}
       <div className="mt-5 flex flex-col items-center gap-3" ref={rowRef}>
         {GOOGLE_CLIENT_ID ? (
-          // No forced height: Google owns the button box, and clipping it would
-          // cut the label. The measured width is what makes it span the card.
-          <div className="flex w-full justify-center" ref={googleButtonRef} />
+          // CLS guard, never a clip (no overflow-hidden, so the label is never cut):
+          // Google first mounts a plain fallback button and then its iframe next to
+          // it inside its own wrapper div, and drops the fallback once the iframe
+          // loads. [&>div]:grid stacks the two in one cell and h-10 fixes the box
+          // (the iframe is 44px with -2px margins = 40px of layout), so Apple and
+          // the terms below never jump. The measured width is what makes it span the card.
+          <div className="flex h-10 w-full justify-center [&>div>*]:[grid-area:1/1] [&>div]:grid" ref={googleButtonRef} />
         ) : null}
 
         {APPLE_SERVICES_ID ? (
           <button
-            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-full border border-outline bg-white text-sm font-semibold text-brandInk transition hover:bg-mist focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brandBlue disabled:cursor-not-allowed disabled:opacity-60"
+            className="relative inline-flex h-10 w-full items-center justify-center gap-2 rounded-full border border-outline bg-white after:absolute after:inset-x-0 after:-inset-y-0.5 after:content-[''] text-sm font-semibold text-brandInk transition hover:bg-surfaceBright focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brandBlue disabled:cursor-not-allowed disabled:opacity-60"
             disabled={busy !== null}
             onClick={() => void signInWithApple()}
             type="button"
```

- [ ] **Step 8: Watch it pass, then full suite + types**

Run: `pnpm exec vitest run src/app/signin && pnpm test && pnpm exec tsc --noEmit`
Expected: `src/app/signin` 15 tests (social-signin 10 + card 5); then **84 files, 651 tests**; tsc clean.

- [ ] **Step 9: Commit (controller)**

```bash
git add src/app/signin
git commit -m "feat(signin): centred card on tokens, shared 48px fields, 44px actions; Google row CLS 0"
```

---

### Task 7: Full verification

- [ ] **Step 1: Tests + types**

Run: `pnpm test && pnpm exec tsc --noEmit`
Expected: **84 files, 651 tests** (baseline 78 / 620: +8 rules, +4 steps, +4 summary, +7 layout, +3 status pages, +5 sign-in); tsc clean.

- [ ] **Step 2: Production build**

Run: `pnpm build`
Expected (dry run in brackets):
- `/signin` is still **○** [`7.16 kB / 121 kB` → `7.35 kB / 121 kB`];
- `/` is still **○** [`7.29 kB / 215 kB`];
- `/checkout` is still **ƒ** [`41.9 kB / 249 kB` → `43.8 kB / 251 kB`: PlanRow pieces + summary];
- `/checkout/failed` is still **ƒ** [`135 B / 117 kB`].

If `/signin` flipped to ƒ, something read request data outside the `Suspense`d `useSearchParams`.

- [ ] **Step 3: Browser matrix (headless Playwright, fixtures, no sign-in, no payment)**

Run `pnpm build && pnpm start -p 3105`. Save the script below as a scratch file outside the repo (for example `$SCRATCH/checkout-matrix.cjs`). Set `PW` to the cached Playwright's `playwright-core` (`$(dirname $(ls -d ~/.npm/_npx/*/node_modules/playwright | tail -1))/playwright-core`) and run `BASE=http://localhost:3105 PKG=change-plus-7days-1gb node checkout-matrix.cjs`.
- The package id comes from `https://esim.uplisoft.com/api/packages`: a US local plan, €4.00, 10 min + 10 SMS.
- Also run it with `PKG=annatel+-7days-1gb PROMO=TEST10` (admin discount + stored partner code) and `PKG=eu-connect-in-30days-3gb` (28-country bundle).

```js
// Layout-only check of /checkout and /signin. NEVER signs in and NEVER pays:
// - "signed in" = an unsigned, display-only esim_at cookie (readEmailFromAccessToken
//   only decodes it); every /bff call is answered by the fixtures below, so the
//   token never reaches the backend;
// - Pokpay / Cardinal / ThreatMetrix hosts are aborted; Pay is never clicked.
const pw = require(process.env.PW || "/Users/elnorrapaj/.npm/_npx/e41f203b7505f1fb/node_modules/playwright-core");
const fs = require("fs");

const BASE = process.env.BASE || "http://localhost:3105";
const OUT = process.env.OUT || __dirname + "/shots";
const PKG = process.env.PKG || "change-plus-7days-1gb";
const WIDTHS = [320, 375, 768, 1024, 1440];
fs.mkdirSync(OUT, { recursive: true });

const FAKE_ADDRESS = {
  holdersName: "Layout Check",
  email: "layout-check@example.com",
  countryCode: "US",
  administrativeArea: "TS",
  locality: "Testville",
  address1: "1 Test Street",
  postalCode: "00000",
  phoneNumber: "+1 000 000 0000",
};

function fakeAccessCookie() {
  const payload = Buffer.from(
    JSON.stringify({ email: "layout-check@example.com", kind: "access", exp: Date.now() + 3600_000 }),
  ).toString("base64url");
  return `dev-auth.${payload}.not-a-signature`;
}

async function context(browser, width, { signedIn, billing = "saved", promo = null, holdIntent = false }) {
  const ctx = await browser.newContext({
    viewport: { width, height: width < 768 ? 740 : 900 },
    isMobile: width < 768,
    hasTouch: width < 1024,
    deviceScaleFactor: 2,
  });
  const url = new URL(BASE);
  const cookies = [
    { name: "esim2you_consent", value: encodeURIComponent(JSON.stringify({ version: 1, analytics: false, marketing: false })), domain: url.hostname, path: "/" },
  ];
  if (signedIn) cookies.push({ name: "esim_at", value: fakeAccessCookie(), domain: url.hostname, path: "/" });
  await ctx.addCookies(cookies);
  if (promo) {
    await ctx.addInitScript(([pkg, code]) => {
      localStorage.setItem("esim2you.checkout.promo", JSON.stringify({ promoCode: code, packageId: pkg }));
    }, [PKG, promo]);
  }
  await ctx.addInitScript(() => {
    window.__cls = 0;
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) if (!e.hadRecentInput) { window.__cls += e.value; (window.__src = window.__src || []).push(Math.round(e.startTime) + ' ' + e.value.toFixed(4) + ' ' + e.sources.map((x) => (x.node ? x.node.nodeName + '.' + String(x.node.className || '').slice(0, 40) : '?') + ' ' + Math.round(x.previousRect.y) + '->' + Math.round(x.currentRect.y)).join(' | ')); }
    }).observe({ type: "layout-shift", buffered: true });
  });
  await ctx.route(/pokpay\.io|cardinalcommerce\.com|cardinaltrusted\.com|online-metrix\.net/, (r) => r.abort());
  await ctx.route("**/bff/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    const json = (status, body) => route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
    if (!signedIn && path !== "/bff/payments/intent") return json(401, { error: "Your session has expired. Please sign in again." });
    if (path === "/bff/user/billing-address") return json(200, { data: { billingAddress: billing === "saved" ? FAKE_ADDRESS : null } });
    if (path === "/bff/payments/intent") {
      if (holdIntent) return; // leave the request hanging: the page stays as it renders before the 401 redirect
      if (!signedIn) return json(401, { error: "Your session has expired. Please sign in again." });
      return json(200, { data: { paymentId: "layout-check-only", environment: "staging" } });
    }
    if (path === "/bff/checkout/apply-promo") return json(200, { data: { applied: true, discountPct: 10, finalCustomerPriceCents: 360 } });
    return route.abort();
  });
  return ctx;
}

const measure = () => {
  const de = document.documentElement;
  const main = document.querySelector("main");
  const rect = (el) => (el ? (({ top, bottom, left, width, height }) => ({ top: Math.round(top), bottom: Math.round(bottom), left: Math.round(left), width: Math.round(width), height: Math.round(height) }))(el.getBoundingClientRect()) : null);
  const visible = (el) => el && el.offsetParent !== null && getComputedStyle(el).visibility !== "hidden";
  const gradients = [...main.querySelectorAll("a,button")].filter((el) => visible(el) && getComputedStyle(el).backgroundImage.includes("gradient"));
  const small = [...main.querySelectorAll("a,button,input,select")]
    .filter((el) => visible(el) && !el.closest("footer") && !el.closest("p"))
    .map((el) => ({ el, r: el.getBoundingClientRect() }))
    .filter(({ r }) => r.height < 44)
    .map(({ el, r }) => `${el.tagName.toLowerCase()}:${(el.textContent || el.getAttribute("aria-label") || el.id || "").trim().slice(0, 24)}=${Math.round(r.height)}`);
  const toggle = document.querySelector('button[aria-controls="checkout-order-summary"]');
  const panel = document.getElementById("checkout-order-summary");
  const pay = [...main.querySelectorAll("button")].find((b) => /^(Pay|Processing…)$/.test(b.textContent.trim()));
  const dock = document.querySelector("[data-bottom-dock]");
  return {
    cls: Number((window.__cls || 0).toFixed(4)), clsSrc: window.__src,
    noHScroll: de.scrollWidth === de.clientWidth && innerWidth === de.clientWidth,
    sw: de.scrollWidth,
    gradients: gradients.map((g) => g.textContent.trim()),
    small,
    h1: rect(document.querySelector("h1")),
    toggle: toggle && visible(toggle) ? { text: toggle.textContent.trim(), expanded: toggle.getAttribute("aria-expanded"), r: rect(toggle) } : null,
    panel: panel ? { display: getComputedStyle(panel).display, r: rect(panel) } : null,
    aside: (() => { const a = document.querySelector('aside[aria-label="Order summary"]'); return a ? { position: getComputedStyle(a).position, r: rect(a) } : null; })(),
    pay: pay ? { r: rect(pay), stickyBar: getComputedStyle(pay.parentElement).position } : null,
    dockVisible: !!(dock && visible(dock)),
    heading: [...document.querySelectorAll("h1,h2")].map((h) => `${h.tagName}:${h.textContent.trim().slice(0, 32)}`),
  };
};

(async () => {
  const browser = await pw.chromium.launch({ headless: true });
  const results = {};

  // 1) Signed out: the gate renders, then the 401 from the intent sends the visitor to sign-in.
  for (const w of WIDTHS) {
    const ctx = await context(browser, w, { signedIn: false, holdIntent: true });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/checkout?package=${PKG}`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("text=Sign in to complete your purchase");
    await page.waitForTimeout(600);
    results[`gate-${w}`] = await page.evaluate(measure);
    await page.screenshot({ path: `${OUT}/checkout-gate-${w}.png`, fullPage: true });
    await ctx.close();
  }
  {
    const ctx = await context(browser, 375, { signedIn: false });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/checkout?package=${PKG}`, { waitUntil: "domcontentloaded" });
    await page.waitForURL(/\/signin\?next=/, { timeout: 15000 });
    results["gate-redirect"] = page.url().replace(BASE, "");
    await ctx.close();
  }

  // 2) "Signed in" (fixtures): saved billing address -> card step with the sticky Pay.
  for (const w of WIDTHS) {
    const ctx = await context(browser, w, { signedIn: true, promo: process.env.PROMO || null });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/checkout?package=${PKG}`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector('input[autocomplete="cc-number"]');
    await page.waitForTimeout(800);
    const top = await page.evaluate(measure);
    await page.screenshot({ path: `${OUT}/checkout-in-${w}-top.png` });
    // Scroll until only the top of the card step is on screen: below lg the real
    // Pay button must be pinned to the bottom edge (bar bottom === innerHeight).
    await page.evaluate(() => {
      const step = document.querySelector('input[autocomplete="cc-number"]').closest("label").parentElement;
      window.scrollTo(0, step.getBoundingClientRect().top + scrollY - innerHeight + 160);
    });
    await page.waitForTimeout(300);
    const card = await page.evaluate(() => {
      const pay = [...document.querySelectorAll("main button")].find((b) => b.textContent.trim() === "Pay");
      const r = pay.getBoundingClientRect();
      return { payTop: Math.round(r.top), payBottom: Math.round(r.bottom), innerHeight, barBottom: Math.round(pay.parentElement.getBoundingClientRect().bottom) };
    });
    await page.screenshot({ path: `${OUT}/checkout-in-${w}-card.png` });
    // Billing section in view: Pay must NOT float over it.
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(200);
    const atTop = await page.evaluate(() => {
      const pay = [...document.querySelectorAll("main button")].find((b) => b.textContent.trim() === "Pay");
      return { payTop: Math.round(pay.getBoundingClientRect().top), innerHeight };
    });
    let sticky = null;
    if (w >= 1024) {
      await page.evaluate(() => window.scrollTo(0, 120));
      await page.waitForTimeout(200);
      sticky = await page.evaluate(() => Math.round(document.querySelector('aside[aria-label="Order summary"]').getBoundingClientRect().top));
    }
    let expanded = null;
    if (w < 1024) {
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.click('button[aria-controls="checkout-order-summary"]');
      await page.waitForTimeout(300);
      expanded = await page.evaluate(measure);
      await page.screenshot({ path: `${OUT}/checkout-in-${w}-summary.png`, fullPage: true });
    }
    results[`in-${w}`] = { top, card, atTop, sticky, expanded: expanded && { toggle: expanded.toggle, panel: expanded.panel, noHScroll: expanded.noHScroll, small: expanded.small } };
    await ctx.close();
  }

  // 3) First-time buyer: no saved address -> billing form, no Pay yet, Save address is flat.
  for (const w of [320, 1440]) {
    const ctx = await context(browser, w, { signedIn: true, billing: "none" });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/checkout?package=${PKG}`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector('input[autocomplete="name"]');
    await page.waitForTimeout(600);
    results[`first-${w}`] = await page.evaluate(measure);
    await page.screenshot({ path: `${OUT}/checkout-first-${w}.png`, fullPage: true });
    await ctx.close();
  }

  // 4) Sign-in page.
  for (const w of WIDTHS) {
    const ctx = await context(browser, w, { signedIn: false });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/signin?next=${encodeURIComponent(`/checkout?package=${PKG}`)}`, { waitUntil: "networkidle" });
    await page.waitForSelector('input[type="email"]');
    await page.waitForTimeout(800);
    results[`signin-${w}`] = await page.evaluate(() => {
      const de = document.documentElement;
      const card = document.querySelector("h1").closest("div.relative");
      const googleRow = document.querySelector('[class="mt-5 flex flex-col items-center gap-3"]');
      const googleFrame = document.querySelector('iframe[src*="accounts.google.com"]');
      const vis = (el) => el && el.offsetParent !== null;
      return {
        noHScroll: de.scrollWidth === de.clientWidth && innerWidth === de.clientWidth,
        card: card && Math.round(card.getBoundingClientRect().width),
        email: Math.round(document.querySelector('input[type="email"]').getBoundingClientRect().height),
        send: Math.round([...document.querySelectorAll("main button")].find((b) => b.textContent.includes("Send code")).getBoundingClientRect().height),
        gradients: [...document.querySelectorAll("main a,main button")].filter((el) => vis(el) && getComputedStyle(el).backgroundImage.includes("gradient")).map((el) => el.textContent.trim()),
        googleRow: googleRow && Math.round(googleRow.getBoundingClientRect().width),
        googleFrame: googleFrame && Math.round(googleFrame.getBoundingClientRect().width),
        apple: (() => { const b = [...document.querySelectorAll("main button")].find((x) => x.textContent.includes("Apple")); return b ? Math.round(b.getBoundingClientRect().height) : null; })(),
        dockVisible: vis(document.querySelector("[data-bottom-dock]")),
      };
    });
    await page.screenshot({ path: `${OUT}/signin-${w}.png` });
    await ctx.close();
  }

  await browser.close();
  console.log(JSON.stringify(results, null, 1));
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
```

Expected (dry-run results in brackets):

| Width | Check | Expected |
|---|---|---|
| all | horizontal scroll | `scrollWidth === clientWidth === innerWidth` on the gate, the signed-in, first-time and expanded-summary states, and `/signin` [true at all 5] |
| all | dock | `[data-bottom-dock]` not visible on `/checkout` or `/signin` [hidden at all 5] |
| all | gradients in `main` outside the navbar | signed out: `Sign in to checkout`; signed in: `Pay`; first-time buyer: none; `/signin`: `Send code` [as stated; at lg the navbar's "Get eSIM Now" also shows and is shell] |
| all | controls < 44px in `main` | none outside the navbar capsule (logo 36/40, desktop text links 20) and inline copy [as stated] |
| 320/375/768 | summary bar | 56px tall at top 92, reads `Show order summary · €4.00`, `aria-expanded="false"`, panel `display:none`; after a click `Hide order summary · €4.00`, `aria-expanded="true"`, panel 447–463px tall [as stated] |
| 320/375/768 | sticky Pay | scroll until only the top of the card step is on screen: the Pay bar's bottom equals `innerHeight` (bar `position: sticky`) [740/740, 740/740, 900/900]; at `scrollY 0` Pay isn't over the billing card [true] |
| 1024/1440 | summary | `aside` `position: sticky`, 380px wide, `top` 24px after `scrollTo(0,120)` [24 / 24]; Pay static in the left column [516 / 612px wide] |
| all | gate redirect | signed out, unmocked intent → URL becomes `/signin?next=%2Fcheckout%3Fpackage%3Dchange-plus-7days-1gb` [true] |
| `annatel+-7days-1gb` + `TEST10` | lines | `Plan price €4.84`, `Discount -17% -€0.84`, `Partner code -10% -€0.40`, `Total €3.60`; bar `· €3.60`; tags `-17%`, `Calls + SMS`; promo shows `Partner Code: TEST10 ✓ Change` [as stated] |
| `eu-connect-in-30days-3gb` | coverage | `European Union and United Kingdom covers 28 countries` button; a US local plan shows none [as stated] |
| `/signin` | card | 288 / 343 / 440 / 440 / 440px wide; email field 48px; Send code 54px; Google iframe = row + 20 (Google's own −10px margins: 258/238, 313/293, 394/374) and still tracks the width on resize; Apple 40px visual, 44px hit area [as stated] |
| `/checkout/failed?reason=unpaid&package=…&payment=…` | buttons | 54px tall at 320 (were 23–25px) and 1440; one gradient (`Try again`); `reason=provisioning` → `Go to my eSIMs` [as stated] |
| `/checkout?package=does-not-exist` | not found | card with "We couldn't find that plan" and a 54px `Browse destinations` [as stated] |

The "Something went wrong!" panel in the signed-in screenshots is expected. The script aborts Pokpay, so `usePOK` reports an error. It's the existing `submitError` panel.

- [ ] **Step 4: CLS**

Add the script's `layout-shift` observer (`addInitScript`, summing entries without `hadRecentInput`). Read `window.__cls` 3s after load for gate, returning and first-time at all 5 widths.
- **Expected:** gate `0 0 0 0 0`; first-time `0 0 0 0 0`.
- Returning ≤ `0.016`, and only from CardStep's error panel caused by the aborted Pokpay (the observer's sources are `LABEL` / `.grid-cols-2` / the sticky bar moving down by the panel's height).
- Baseline for comparison: returning `0 0 0.003 0.068 0.036`, first-time `0 0 0 0.067 0`.

- [ ] **Step 5: Lighthouse (mobile) on `/signin`**

Run `lighthouse http://localhost:3105/signin --only-categories=accessibility,performance --form-factor=mobile --chrome-flags="--headless=new"` 3–4 times. Expected:
- **a11y 1.0**;
- **CLS 0.000** on every run [0 / 0 / 0 / 0; baseline 0.023–0.092];
- LCP not worse than 3.76 s [3.68–3.76 s, unchanged: the LCP element is the card heading text].

- [ ] **Step 6: Manual check list (optional, the owner's own account, real Pokpay — still never pay)**

On a phone (iOS Safari + Android Chrome), signed in with the owner's own account, open `/checkout?package=change-plus-7days-1gb` and check:
1. The summary bar opens and closes, and VoiceOver/TalkBack announce "expanded/collapsed".
2. Tapping into the card number with the keyboard up keeps the field above the Pay bar.
3. The Pay bar clears the home indicator.
4. "Change address" shows the flat Save and the gradient Pay together.
5. A stored partner code shows the placeholder total, then the discounted total, and Pay waits for it.

**Do not submit the card form.**

---

### Task 8: Knowledge + session log (repo rules)

**Files:**
- Modify: `feedAI/facts.jsonl` (append)
- Modify: `feedAI/topics/account-flows.json`, `feedAI/topics/auth.json`, `feedAI/topics/troubleshooting.json`
- Create: `docs/sessions/2026-10-01_web-ui-polish-checkout.md`
- Modify: `docs/sessions/INDEX.md`, `feedAI/brain.json` (`sync`, `phase.current`)

- [ ] **Step 1: Append facts**

Check the next free id with `tail -1 feedAI/facts.jsonl | cut -c1-20`. It was `f215` when this plan was written, so use `f216`–`f219` unless something landed in between.

```json
{"id": "f216", "date": "2026-10-01", "kind": "decision", "topic": "account-flows", "fact": "Checkout is one page (spec option B, phase 5 of the mobile-parity redesign). CheckoutPriceSection is a grid lg:grid-cols-[minmax(0,1fr)_380px]: OrderSummary comes FIRST in the DOM (phone 'Show order summary · €X' bar right under the top bar; lg:col-start-2, lg:sticky lg:top-6) and the left column gets the server heading (eyebrow, plan title H1, sub-copy) as children, then the sign-in gate and CheckoutWizard (numbered 01/02 StepHeadings). There is exactly ONE OrderSummary and ONE PromoCodeField: the phone panel is display:none (hidden) but mounted, so the stored partner code is still re-checked and Pay stays gated on promoPending. Price lines come from lib/checkoutSummary.ts (checkoutTotal / checkoutPriceLines: Plan price -> Discount -N% -> Partner code -N% -> Total; a markup shows the charged price only). Pay is the page's one gradient: Save address and Apply are flat.", "source": "src/app/checkout/{CheckoutPriceSection,OrderSummary,CheckoutWizard}.tsx; src/lib/checkoutSummary.ts; docs/superpowers/plans/2026-10-01-web-ui-polish-phase5-checkout.md"}
{"id": "f217", "date": "2026-10-01", "kind": "invariant", "topic": "account-flows", "fact": "The phone sticky Pay is CardStep's REAL button, never a copy: below lg it is wrapped in 'sticky bottom-0 -mx-4 sm:-mx-6 pb-[max(12px,env(safe-area-inset-bottom))] ... lg:static'. Sticky is bounded by CardStep's own box, so Pay only pins while the card fields are on screen and never covers billing. The -mx must match checkout/page.tsx's section gutter (px-4 sm:px-6); card inputs carry scroll-mb-32 so a focused field scrolls above the bar; <main> must stay overflow-x-clip (f215). checkout-steps.test.ts pins exactly one <Button in CardStep.", "source": "src/app/checkout/steps/CardStep.tsx; src/app/checkout/page.tsx; src/app/checkout/checkout-steps.test.ts"}
{"id": "f218", "date": "2026-10-01", "kind": "invariant", "topic": "account-flows", "fact": "Checkout CLS 0 depends on two guards: CheckoutWizard keeps step 02 'invisible' until BillingStep calls onLoaded (the one-line loading note becomes a ~190px saved card or a ~600px form), and the checkout <section> is min-h-[calc(100svh+24px)] so the footer starts below the fold while the card step streams in. Since the phone summary collapsed to a 56px bar, the form is above the fold, so without these guards 768-1440px measured CLS 0.10-0.22.", "source": "src/app/checkout/CheckoutWizard.tsx; src/app/checkout/steps/BillingStep.tsx; src/app/checkout/page.tsx"}
{"id": "f219", "date": "2026-10-01", "kind": "fix", "topic": "auth", "fact": "/signin CLS 0.02-0.09 -> 0: Google Identity Services first mounts a plain fallback button and then its iframe beside it inside its own wrapper div, then drops the fallback, so the row grew 40px and shrank back. The Google holder in SocialSignInButtons is now 'flex h-10 w-full justify-center [&>div>*]:[grid-area:1/1] [&>div]:grid' (stacks both in one cell; the iframe is 44px with -2px margins = 40px of layout; no overflow-hidden, so the label is never clipped). The ResizeObserver width logic is unchanged. Apple stays a visual 40px pill matched to Google, with an invisible ::after (after:-inset-y-0.5) giving it a 44px hit area.", "source": "src/app/signin/SocialSignInButtons.tsx; src/app/signin/signin-card.test.ts"}
```

- [ ] **Step 2: Topics, troubleshooting, session, index, brain sync**

- **`feedAI/topics/account-flows.json`:**
  - add `f216`, `f217` and `f218` to `facts`;
  - under `checkout` add `"layout": "one-page option B: OrderSummary (phone bar / sticky lg panel, single PromoCodeField) + numbered steps; sticky real Pay below lg (f216-f218)"`.
- **`feedAI/topics/auth.json`:** add `f219` to `facts`. In `social_signin` add `"layout_guard": "Google holder h-10 + [&>div]:grid stacking keeps /signin CLS 0 (f219); width still from ResizeObserver"`.
- **`feedAI/topics/troubleshooting.json`:** append three entries, each symptom → cause → fix:
  1. `/signin` CLS 0.02–0.09 → Google fallback + iframe briefly side by side → fixed holder + grid stacking (f219).
  2. `/checkout/failed` buttons 23–25px tall on phones → `flex-1` (basis 0) in a column → `w-full sm:flex-1`.
  3. "United States covers 1 countries" on local plans → the catalog sends one-country `countries` lists → `coverageCountries` needs more than one country.
- **Session log:** write `docs/sessions/2026-10-01_web-ui-polish-checkout.md` in the same shape as `2026-10-01_web-ui-polish-plans.md` (Goal, What changed, Review findings, Verification, Commits, Next). Include:
  - the test counts and the build lines;
  - the Task 7 matrix, CLS table and Lighthouse runs;
  - the one changed assertion (`discount-display-wiring.test.ts` test 1);
  - the content mapping table;
  - the markup decision.
- **`docs/sessions/INDEX.md`:** append
  `| 2026-10-01 | [Web UI polish: checkout + sign-in](./2026-10-01_web-ui-polish-checkout.md) | Phase 5: one-page checkout (sticky order summary at lg, phone "Show order summary · €X" bar, real Pay sticky below lg), sign-in card on shared 48px fields; /signin CLS 0.09→0, checkout CLS guards; 651 tests. |`
- **`feedAI/brain.json`:**
  - set `sync.date` to `2026-10-01`;
  - prepend `f216-f219: checkout B (one OrderSummary, sticky real Pay, CLS guards) + sign-in card (Google row CLS fix); next plan = account (desktop sidebar / phone app layout).` to `sync.note_latest`;
  - in `phase.current`, add "checkout B + sign-in (f216-f219)" to the shipped list and change "Next:" to account.

- [ ] **Step 3: Validate JSON**

Run: `tail -4 feedAI/facts.jsonl | while read -r l; do echo "$l" | node -e 'JSON.parse(require("fs").readFileSync(0,"utf8"))' && echo ok; done && node -e 'for (const f of ["feedAI/brain.json","feedAI/topics/account-flows.json","feedAI/topics/auth.json","feedAI/topics/troubleshooting.json"]) JSON.parse(require("fs").readFileSync(f,"utf8")); console.log("json ok")'`
Expected: `ok` ×4, `json ok`.

- [ ] **Step 4: Commit (controller)**

```bash
git add feedAI docs/sessions
git commit -m "docs: feedAI + session log for web UI polish phase 5 (checkout + sign-in)"
```

---

## Risks and open questions

1. **Markup display changed at checkout only.** A `hasDiscount` package priced *above* `retailPrice` used to show a struck-through lower price next to the total. Now it shows just the charged price, so the lines add up. `PlanRow` elsewhere keeps f078's strike-through. There are 0 such packages live. **Confirm, or ask for a "Price adjustment" line instead.**
2. **The coverage disclosure now needs more than one country.** That's a visible fix ("covers 1 countries" on every local plan), not a pure restyle. **Confirm.**
3. **iOS keyboard.** iOS Safari doesn't shrink the layout viewport for the keyboard, so the sticky Pay bar can sit behind it while a card field is focused. `scroll-mb-32` keeps the focused field above the bar. Task 7 Step 6 item 2 checks this on a real device.
4. **First-time buyers see no gradient** until the card step appears ("Save address" is flat). That's on purpose, because Pay and Save can be on screen together after "Change address". **Confirm.**
5. **Desktop reading order is summary → H1.** That's the cost of the phone-first DOM order, softened by the labelled `aside`. A visual-order alternative would need two summaries (rejected, see Decisions) or CSS `order`, which reintroduces the phone mismatch.
6. **Google's internal DOM.** The CLS guard targets "Google's wrapper `div` and its children" generically (`[&>div]`, `[&>div>*]`), with no Google class names. If GIS changes structure, the guard fails open: back to the old small shift, never a clipped button. `signin-card.test.ts` pins the classes.
7. **Pokpay in verification.** Signed-in screenshots always show the CardStep error panel, because Pokpay is aborted. A real-Pokpay visual pass needs the owner's own session (Task 7 Step 6), still without paying.
8. **Not changed (pre-existing):**
   - The signed-out gate flashes before the 401 redirect (f180 behaviour).
   - Admin `x*` pages and the account pages aren't touched.

## Verification numbers from the dry run

The dry run applied Tasks 1–6 to a scratch copy, then replayed them file by file from a clean copy. It built the result and ran `next start` against the hosted backend's public catalog, with headless Chromium (Playwright, `/bff` fixtures, Pokpay aborted) and Lighthouse 13.5.

| | 320 | 375 | 768 | 1024 | 1440 |
|---|---|---|---|---|---|
| scrollWidth = clientWidth = innerWidth (checkout gate / signed in / first-time / signin) | ✓ | ✓ | ✓ | ✓ | ✓ |
| summary | bar 56px @92 | bar 56px @92 | bar 56px @92 | sticky 380px, top 24 | sticky 380px, top 24 |
| expanded panel height | 463 | 447 | 463 | – | – |
| Pay | 288×54 sticky, pinned 740/740 | 343×54 sticky, pinned 740/740 | 720×54 sticky, pinned 900/900 | 516×54 static | 612×54 static |
| gradient in main (excl. navbar) | Pay | Pay | Pay | Pay | Pay |
| dock visible | no | no | no | no | no |
| signin card / Google row / iframe | 288 / 238 / 258 | 343 / 293 / 313 | 440 / 374 / 394 | 440 / 374 / 394 | 440 / 374 / 394 |
| checkout CLS gate · returning · first-time | 0 · 0 · 0 | 0 · 0 · 0 | 0 · 0.016* · 0 | 0 · 0.012* · 0 | 0 · 0.007* · 0 |

\* Only CardStep's error panel, from the aborted Pokpay (see Task 7 Step 4).

- Stage counts: base 78/620 → T1 79/628 → T2 80/632 → T3 81/636 → T4 82/643 → T5 83/646 → T6 84/651, with `tsc` clean at each stage.
- Lighthouse mobile `/signin`: a11y 1 / 1 / 1 / 1, **CLS 0 / 0 / 0 / 0** (baseline 0.0228 / 0.0919 / 0.0919), LCP 3681–3756 ms (baseline 3683–3756 ms), TBT ≤ 16 ms.

## Next plans (not in this document)

7. Account: desktop sidebar dashboard / phone app layout + order detail (its top-up list reuses `PlanRow`)
8. Homepage bento blocks
9. Content pages restyle + legal token fix
10. Partner pages on the account shell
